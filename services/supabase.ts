
import { createClient } from '@supabase/supabase-js';
import { Route, RouteConcept, FeedbackData, POI } from '../types';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vXT_oUjgSllGs8upeDQwLw_2lYYU3t9'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_EMAIL = "admin@urbanito.com"; 

/**
 * Normalizes strings for database matching.
 * We prioritize English/Latin characters for database keys.
 */
export const normalize = (s: string) => {
  if (!s) return "";
  return s.trim().toLowerCase()
    .replace(/[^\w\s]/gi, '') // Remove non-alphanumeric (keep spaces)
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .trim();
};

export const getUniqueUserCount = async (): Promise<number> => {
  try {
    const { data, error } = await supabase.from('usage_logs').select('user_id');
    if (error) return 0;
    const uniqueIds = new Set(data.map(item => item.user_id).filter(id => id !== null));
    return uniqueIds.size;
  } catch (e) { return 0; }
};

export const checkUsageLimit = async (userId: string | null): Promise<{ allowed: boolean, remaining: number, limit: number }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email === ADMIN_EMAIL) return { allowed: true, remaining: 999, limit: 999 };

  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase.from('usage_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', today);

  const limit = userId ? 10 : 3; 
  const currentCount = count || 0;
  return { allowed: currentCount < limit, remaining: Math.max(0, limit - currentCount), limit };
};

export const logUsage = async (userId: string | null, city: string) => {
  try {
    await supabase.from('usage_logs').insert([{ user_id: userId, city: normalize(city) }]);
  } catch (e) {}
};

export const findCuratedRoute = async (city: string, theme: string): Promise<Route | null> => {
  try {
    const normCity = normalize(city);
    const normTheme = normalize(theme);
    
    const { data } = await supabase
      .from('curated_routes')
      .select('route_data')
      .eq('city', normCity)
      .eq('theme', normTheme)
      .maybeSingle();

    return data ? (data.route_data as Route) : null;
  } catch (e) { return null; }
};

export const cacheCuratedRoute = async (city: string, theme: string, route: Route) => {
  try {
    await supabase.from('curated_routes').upsert({
      city: normalize(city),
      theme: normalize(theme),
      route_data: { ...route, theme: theme, id: route.id || `cr-${Date.now()}` }
    });
  } catch (e) {}
};

export const getCachedPoiDetails = async (poiName: string, city: string) => {
  try {
    const { data } = await supabase
      .from('poi_details')
      .select('details_data')
      .eq('poi_name', normalize(poiName))
      .eq('city', normalize(city))
      .maybeSingle();
    return data ? data.details_data : null;
  } catch (e) { 
    return null; 
  }
};

export const cachePoiDetails = async (poiName: string, city: string, details: any) => {
  try {
    await supabase.from('poi_details').upsert({
      poi_name: normalize(poiName),
      city: normalize(city),
      details_data: details,
      updated_at: new Date().toISOString()
    });
  } catch (e) {}
};

export const saveRouteToSupabase = async (userId: string, route: Route) => {
  try {
    const { data } = await supabase.from('saved_routes').insert([{
      user_id: userId,
      route_data: route,
      city: normalize(route.city)
    }]).select();
    return data ? data[0] : null;
  } catch (e) { return null; }
};

export const savePoiToSupabase = async (userId: string, poi: POI, city: string) => {
  try {
    const { data } = await supabase.from('saved_pois').insert([{
      user_id: userId,
      poi_data: poi,
      poi_name: poi.name,
      city: normalize(city)
    }]).select();
    return data ? data[0] : null;
  } catch (e) { return null; }
};

export const getSavedRoutesFromSupabase = async (userId: string) => {
  try {
    const { data } = await supabase.from('saved_routes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  } catch (e) { return []; }
};

export const getSavedPoisFromSupabase = async (userId: string) => {
  try {
    const { data } = await supabase.from('saved_pois').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  } catch (e) { return []; }
};

export const getRecentCuratedRoutes = async (limit: number = 20): Promise<Route[]> => {
  try {
    const { data, error } = await supabase
      .from('curated_routes')
      .select('route_data, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) return [];
    return (data || []).map(d => d.route_data as Route);
  } catch (e) { return []; }
};

export const getRoutesByCityHub = async (city: string): Promise<Route[]> => {
  try {
    const normCity = normalize(city);
    
    // Fetch curated routes matching the normalized city name
    const { data: curated } = await supabase
      .from('curated_routes')
      .select('route_data')
      .eq('city', normCity)
      .limit(30);
      
    // Fetch community (saved) routes that match the city name
    const { data: community } = await supabase
      .from('saved_routes')
      .select('route_data')
      .eq('city', normCity)
      .limit(30);

    const curatedList = (curated || []).map(d => d.route_data as Route);
    const communityList = (community || []).map(d => d.route_data as Route);
    
    // Merge and filter out duplicates based on id
    const merged = [...curatedList, ...communityList];
    const seenIds = new Set();
    return merged.filter(r => {
      if (!r || !r.id) return false;
      const duplicate = seenIds.has(r.id);
      seenIds.add(r.id);
      return !duplicate;
    });
  } catch (e) { return []; }
};

export const deleteRouteFromSupabase = async (id: string, userId: string) => {
  try {
    await supabase.from('saved_routes').delete().eq('id', id).eq('user_id', userId);
  } catch (e) {}
};

export const deletePoiFromSupabase = async (id: string, userId: string) => {
  try {
    await supabase.from('saved_pois').delete().eq('id', id).eq('user_id', userId);
  } catch (e) {}
};

export const signInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
};

export const signOut = async () => { await supabase.auth.signOut(); };

export const submitFeedback = async (userId: string | null, feedback: FeedbackData, language: string) => {
  try {
    await supabase.from('app_feedback').insert([{
      user_id: userId,
      sentiment: feedback.sentiment,
      language: language,
      additional_comments: feedback.additionalComments,
      planning_rating: feedback.features.planning.rating,
      editing_rating: feedback.features.editing.rating,
      saving_rating: feedback.features.saving.rating,
      content_rating: feedback.features.content.rating,
      audio_rating: feedback.features.audio.rating
    }]);
    return true;
  } catch (e) { return false; }
};
