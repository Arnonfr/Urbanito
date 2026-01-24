
import { createClient } from '@supabase/supabase-js';
import { Route, RouteConcept, FeedbackData, POI, UserPreferences } from '../types';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vXT_oUjgSllGs8upeDQwLw_2lYYU3t9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'urbanito-auth-v1',
    storage: window.localStorage
  }
});

export const normalize = (s: string) => {
  if (!s) return "";
  return s.trim()
    .toLowerCase()
    .split(',')[0]
    .replace(/\([^)]*\)/g, '')
    .replace(/[^\w\s\u0590-\u05FF\d]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const generateStableId = (name: string, lat: number, lng: number) => {
  const clean = normalize(name);
  return `poi-${clean}-${lat.toFixed(4)}-${lng.toFixed(4)}`.replace(/\s+/g, '-');
};

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const { data, error } = await supabase.from('user_profiles').select('preferences').eq('id', userId).maybeSingle();
    if (error || !data) return null;
    return data.preferences as UserPreferences;
  } catch (e) { return null; }
};

export const saveUserPreferences = async (userId: string, preferences: UserPreferences) => {
  try {
    await supabase.from('user_profiles').upsert({
      id: userId,
      preferences,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (e) { }
};

export const getCachedPoiDetails = async (poiName: string, city: string, lat?: number, lng?: number) => {
  try {
    const normName = normalize(poiName);
    const normCity = normalize(city);
    const { data } = await supabase.from('poi_details').select('details_data, image_url').eq('poi_name', normName).eq('city', normCity).maybeSingle();
    if (data) return { ...data.details_data, imageUrl: data.image_url || data.details_data.imageUrl };
    return null;
  } catch (e) { return null; }
};

export const cachePoiDetails = async (poiName: string, city: string, details: any) => {
  try {
    const normName = normalize(poiName);
    const normCity = normalize(city);
    await supabase.from('poi_details').upsert({
      poi_name: normName,
      city: normCity,
      details_data: details,
      image_url: details.imageUrl || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'poi_name,city' });
  } catch (e) { }
};

export const updatePoiImageInDb = async (poiName: string, city: string, imageUrl: string) => {
  try {
    const normName = normalize(poiName);
    const normCity = normalize(city);
    await supabase.from('poi_details').upsert({
      poi_name: normName,
      city: normCity,
      image_url: imageUrl,
      updated_at: new Date().toISOString()
    }, { onConflict: 'poi_name,city' });
  } catch (e) { }
};

export const saveToCuratedRoutes = async (route: Route, theme: string = 'general') => {
  try {
    await supabase.from('curated_routes').insert([{
      city: normalize(route.city),
      theme: theme,
      route_data: route
    }]);
  } catch (e) {
    console.error("Auto-save to curated failed:", e);
  }
};

export const saveRouteToSupabase = async (userId: string, route: Route) => {
  try {
    const { data, error } = await supabase.from('saved_routes').insert([{
      user_id: userId,
      route_data: route,
      city: normalize(route.city)
    }]).select();
    if (error) throw error;
    return data ? data[0] : null;
  } catch (e) { return null; }
};

export const updateSavedRouteData = async (dbId: string, userId: string, route: Route) => {
  try {
    await supabase.from('saved_routes').update({ route_data: route }).eq('id', dbId).eq('user_id', userId);
  } catch (e) { }
};

export const getSavedRoutesFromSupabase = async (userId: string) => {
  try {
    const { data } = await supabase.from('saved_routes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  } catch (e) { return []; }
};

export const deleteRouteFromSupabase = async (id: string, userId: string) => {
  try { await supabase.from('saved_routes').delete().eq('id', id).eq('user_id', userId); } catch (e) { }
};

export const logUsage = async (userId: string | null, city: string) => {
  try { await supabase.from('usage_logs').insert([{ user_id: userId, city: normalize(city) }]); } catch (e) { }
};

export const logPremiumInterest = async (userId: string | null) => {
  try { await supabase.from('premium_interest').insert([{ user_id: userId, created_at: new Date().toISOString() }]); } catch (e) { }
};

export const submitFeedback = async (userId: string | null, feedback: FeedbackData, language: string) => {
  try {
    const { error } = await supabase.from('app_feedback').insert([{
      user_id: userId,
      feedback_data: feedback,
      language,
      created_at: new Date().toISOString()
    }]);
    return !error;
  } catch (e) { return false; }
};

export const getAllRecentRoutes = async (limit: number = 100): Promise<Route[]> => {
  try {
    // Separate calls to ensure one failure (like RLS for non-logged-in users) doesn't block the other
    const [curatedRes, savedRes] = await Promise.allSettled([
      supabase.from('curated_routes').select('route_data').order('created_at', { ascending: false }).limit(limit),
      supabase.from('saved_routes').select('route_data').order('created_at', { ascending: false }).limit(limit)
    ]);

    const curatedData = curatedRes.status === 'fulfilled' && curatedRes.value.data ? curatedRes.value.data : [];
    const savedData = savedRes.status === 'fulfilled' && savedRes.value.data ? savedRes.value.data : [];

    const merged = [...curatedData, ...savedData];
    const seen = new Set();
    const final: Route[] = [];

    for (const item of merged) {
      if (!item.route_data) continue;
      const r = item.route_data as Route;
      if (!r.name || !r.pois || r.pois.length === 0) continue;
      const key = `${normalize(r.name)}-${normalize(r.city)}`;
      if (!seen.has(key)) {
        seen.add(key);
        final.push(r);
      }
    }
    return final;
  } catch (e) {
    console.error("Fetch recent routes failed:", e);
    return [];
  }
};


export const getRecentCuratedRoutes = async (limit: number = 24): Promise<Route[]> => {
  return await getAllRecentRoutes(limit);
};

export const getRoutesByCityHub = async (cityName: string, cityNameEn?: string): Promise<Route[]> => {
  try {
    const normHe = normalize(cityName);
    const normEn = cityNameEn ? normalize(cityNameEn) : "";

    // Fetch from curated and community tables
    const [curatedRes, communityRes] = await Promise.allSettled([
      supabase.from('curated_routes').select('route_data').or(`city.ilike.%${normHe}%,city.ilike.%${normEn}%`).limit(30),
      supabase.from('saved_routes').select('route_data').or(`city.ilike.%${normHe}%,city.ilike.%${normEn}%`).limit(30)
    ]);

    const curated = curatedRes.status === 'fulfilled' ? (curatedRes.value.data || []) : [];
    const community = communityRes.status === 'fulfilled' ? (communityRes.value.data || []) : [];

    const merged = [
      ...curated.map(d => d.route_data as Route),
      ...community.map(d => d.route_data as Route)
    ];

    const seen = new Set();
    return merged.filter(r => {
      if (!r || !r.name) return false;
      const key = `${normalize(r.name)}-${normalize(r.city)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (e) {
    console.error("City hub fetch failed:", e);
    return [];
  }
};

export const signInWithGoogle = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    if (error) throw error;
  } catch (err) {
    console.error("Auth error:", err);
  }
};
export const signOut = async () => { await supabase.auth.signOut(); };
