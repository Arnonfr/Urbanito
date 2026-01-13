
import { createClient } from '@supabase/supabase-js';
import { Route, RouteConcept, FeedbackData, POI } from '../types';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vXT_oUjgSllGs8upeDQwLw_2lYYU3t9'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_EMAIL = "admin@urbanito.com"; 

const normalize = (s: string) => s ? s.trim().toLowerCase() : "";

export const getUniqueUserCount = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('usage_logs')
      .select('user_id');
    
    if (error) return 0;
    const uniqueIds = new Set(data.map(item => item.user_id).filter(id => id !== null));
    return uniqueIds.size;
  } catch (e) {
    return 0;
  }
};

export const checkUsageLimit = async (userId: string | null): Promise<{ allowed: boolean, remaining: number, limit: number }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email === ADMIN_EMAIL) {
    return { allowed: true, remaining: 999, limit: 999 };
  }

  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today);

  const limit = userId ? 5 : 3; 
  const currentCount = count || 0;
  return { allowed: currentCount < limit, remaining: Math.max(0, limit - currentCount), limit };
};

export const logUsage = async (userId: string | null, city: string) => {
  try {
    await supabase.from('usage_logs').insert([{
      user_id: userId,
      city: normalize(city)
    }]);
  } catch (e) {
    console.error("Failed to log usage:", e);
  }
};

export const submitFeedback = async (userId: string | null, feedback: FeedbackData, language: string) => {
  try {
    await supabase.from('app_feedback').insert([{
      user_id: userId,
      sentiment: feedback.sentiment,
      planning_rating: feedback.features.planning.isSelected ? feedback.features.planning.rating : null,
      planning_comment: feedback.features.planning.comment,
      editing_rating: feedback.features.editing.isSelected ? feedback.features.editing.rating : null,
      editing_comment: feedback.features.editing.comment,
      saving_rating: feedback.features.saving.isSelected ? feedback.features.saving.rating : null,
      saving_comment: feedback.features.saving.comment,
      content_rating: feedback.features.content.isSelected ? feedback.features.content.rating : null,
      content_comment: feedback.features.content.comment,
      audio_rating: feedback.features.audio.isSelected ? feedback.features.audio.rating : null,
      audio_comment: feedback.features.audio.comment,
      additional_comments: feedback.additionalComments,
      language: language
    }]);
    return true;
  } catch (e) {
    return false;
  }
};

export const getCachedLibrary = async (city: string): Promise<RouteConcept[] | null> => {
  try {
    const { data } = await supabase.from('city_library').select('concepts').eq('city', normalize(city)).maybeSingle();
    return data ? (data.concepts as RouteConcept[]) : null;
  } catch (e) { return null; }
};

export const saveLibraryToDb = async (city: string, concepts: RouteConcept[]) => {
  try {
    await supabase.from('city_library').upsert({ city: normalize(city), concepts: concepts });
  } catch (e) {}
};

export const findCuratedRoute = async (city: string, theme: string): Promise<Route | null> => {
  try {
    const { data } = await supabase.from('curated_routes').select('route_data').eq('city', normalize(city)).eq('theme', normalize(theme)).maybeSingle();
    return data ? (data.route_data as Route) : null;
  } catch (e) { return null; }
};

export const getRecentCuratedRoutes = async (limit: number = 10): Promise<Route[]> => {
  try {
    const { data } = await supabase.from('curated_routes').select('route_data').order('created_at', { ascending: false }).limit(limit);
    return (data || []).map(d => d.route_data as Route);
  } catch (e) { return []; }
};

export const cacheCuratedRoute = async (city: string, theme: string, route: Route) => {
  try {
    await supabase.from('curated_routes').upsert({
      city: normalize(city),
      theme: normalize(theme),
      route_data: route
    });
  } catch (e) {}
};

export const saveRouteToSupabase = async (userId: string, route: Route) => {
  try {
    const { data, error } = await supabase.from('saved_routes').insert([{
      user_id: userId,
      route_data: route,
      city: normalize(route.city)
    }]).select();
    return data ? data[0] : null;
  } catch (e) { return null; }
};

export const updateSavedRoute = async (userId: string, route: Route) => {
  try {
    // Find the entry that has this specific route ID inside its JSON route_data
    const { data } = await supabase
      .from('saved_routes')
      .select('id, route_data')
      .eq('user_id', userId);
    
    const entry = data?.find(d => (d.route_data as any).id === route.id);
    if (entry) {
      await supabase
        .from('saved_routes')
        .update({ route_data: route })
        .eq('id', entry.id);
    }
  } catch (e) {
    console.error("Failed to update route:", e);
  }
};

export const getSavedRoutesFromSupabase = async (userId: string) => {
  try {
    const { data } = await supabase.from('saved_routes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  } catch (e) { return []; }
};

export const deleteRouteFromSupabase = async (id: string, userId: string) => {
  try {
    await supabase.from('saved_routes').delete().eq('id', id).eq('user_id', userId);
  } catch (e) {}
};

export const getCachedPoiDetails = async (poiName: string, city: string) => {
  try {
    const { data } = await supabase.from('poi_cache').select('data').eq('poi_name', normalize(poiName)).eq('city', normalize(city)).maybeSingle();
    return data ? data.data : null;
  } catch (e) { return null; }
};

export const cachePoiDetails = async (poiName: string, city: string, data: any) => {
  try {
    await supabase.from('poi_cache').upsert({
      poi_name: normalize(poiName),
      city: normalize(city),
      data: data
    });
  } catch (e) {}
};

// --- SAVED POIs FUNCTIONS ---

export const savePoiToSupabase = async (userId: string, poi: POI, city: string) => {
  try {
    const { data } = await supabase.from('saved_pois').insert([{
      user_id: userId,
      poi_data: poi,
      city: normalize(city),
      poi_name: poi.name
    }]).select();
    return data ? data[0] : null;
  } catch (e) { return null; }
};

export const getSavedPoisFromSupabase = async (userId: string) => {
  try {
    const { data } = await supabase.from('saved_pois').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  } catch (e) { return []; }
};

export const deletePoiFromSupabase = async (id: string, userId: string) => {
  try {
    await supabase.from('saved_pois').delete().eq('id', id).eq('user_id', userId);
  } catch (e) {}
};

export const signInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
