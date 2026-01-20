
import { createClient } from '@supabase/supabase-js';
import { Route, RouteConcept, FeedbackData, POI, UserPreferences } from '../types';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vXT_oUjgSllGs8upeDQwLw_2lYYU3t9'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_EMAIL = "admin@urbanito.com"; 

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
    const { error } = await supabase.from('user_profiles').upsert({ id: userId, preferences, updated_at: new Date().toISOString() });
    if (error) console.error("Save Prefs Error:", error);
  } catch (e) {}
};

export const getCachedPoiDetails = async (poiName: string, city: string, lat?: number, lng?: number) => {
  try {
    const normName = normalize(poiName);
    const normCity = normalize(city);
    
    const { data } = await supabase
      .from('poi_details')
      .select('details_data')
      .eq('poi_name', normName)
      .eq('city', normCity)
      .maybeSingle();
      
    if (data) return data.details_data;

    if (lat && lng) {
      const { data: coordMatch } = await supabase
        .from('poi_details')
        .select('details_data')
        .filter('details_data->lat', 'gte', lat - 0.0005)
        .filter('details_data->lat', 'lte', lat + 0.0005)
        .filter('details_data->lng', 'gte', lng - 0.0005)
        .filter('details_data->lng', 'lte', lng + 0.0005)
        .limit(1);

      if (coordMatch && coordMatch.length > 0) return coordMatch[0].details_data;
    }
    
    return null;
  } catch (e) { return null; }
};

export const cachePoiDetails = async (poiName: string, city: string, details: any) => {
  try {
    const normName = normalize(poiName);
    const normCity = normalize(city);
    
    const payload = {
      poi_name: normName,
      city: normCity,
      details_data: { 
        ...details, 
        lat: Number(details.lat), 
        lng: Number(details.lng),
        poi_name: poiName, 
        city_name: city,
        enriched_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('poi_details').upsert(payload, { onConflict: 'poi_name, city' });
  } catch (e) {}
};

export const findCuratedRoute = async (city: string, theme: string): Promise<Route | null> => {
  try {
    const normCity = normalize(city);
    const normTheme = normalize(theme);
    const { data } = await supabase.from('curated_routes').select('route_data').eq('city', normCity).eq('theme', normTheme).maybeSingle();
    return data ? (data.route_data as Route) : null;
  } catch (e) { return null; }
};

export const cacheCuratedRoute = async (city: string, theme: string, route: Route) => {
  try {
    const normCity = normalize(city);
    const normTheme = normalize(theme);
    await supabase.from('curated_routes').upsert({
      city: normCity,
      theme: normTheme,
      route_data: route
    }, { onConflict: 'city, theme' });
  } catch (e) {}
};

export const saveRouteToSupabase = async (userId: string, route: Route) => {
  try {
    const { data, error } = await supabase.from('saved_routes').insert([{ user_id: userId, route_data: route, city: normalize(route.city) }]).select();
    if (error) throw error;
    return data ? data[0] : null;
  } catch (e) { return null; }
};

export const updateSavedRouteData = async (dbId: string, userId: string, route: Route) => {
  try {
    await supabase.from('saved_routes').update({ route_data: route }).eq('id', dbId).eq('user_id', userId);
  } catch (e) {}
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

export const deleteRouteFromSupabase = async (id: string, userId: string) => {
  try { await supabase.from('saved_routes').delete().eq('id', id).eq('user_id', userId); } catch (e) {}
};

export const deletePoiFromSupabase = async (id: string, userId: string) => {
  try { await supabase.from('saved_pois').delete().eq('id', id).eq('user_id', userId); } catch (e) {}
};

export const checkUsageLimit = async (userId: string | null): Promise<{ allowed: boolean, remaining: number, limit: number }> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (user?.email === ADMIN_EMAIL) return { allowed: true, remaining: 999, limit: 999 };
  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase.from('usage_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', today);
  const limit = userId ? 100 : 50; 
  return { allowed: (count || 0) < limit, remaining: Math.max(0, limit - (count || 0)), limit };
};

export const logUsage = async (userId: string | null, city: string) => {
  try { await supabase.from('usage_logs').insert([{ user_id: userId, city: normalize(city) }]); } catch (e) {}
};

export const submitFeedback = async (userId: string | null, feedback: FeedbackData, language: string) => {
  try {
    const { error } = await supabase.from('app_feedback').insert([{ user_id: userId, feedback_data: feedback, language }]);
    return !error;
  } catch (e) { return false; }
};

export const getRecentCuratedRoutes = async (limit: number = 24): Promise<Route[]> => {
  try {
    const { data } = await supabase.from('curated_routes').select('route_data').order('created_at', { ascending: false }).limit(limit);
    return (data || []).map(d => d.route_data as Route);
  } catch (e) { return []; }
};

export const getRoutesByCityHub = async (cityName: string, cityNameEn?: string): Promise<Route[]> => {
  try {
    const normHe = normalize(cityName);
    const normEn = cityNameEn ? normalize(cityNameEn) : "";
    
    // Wider search query using OR to find routes matched to either language name
    const { data: curated } = await supabase
      .from('curated_routes')
      .select('route_data')
      .or(`city.ilike.%${normHe}%,city.ilike.%${normEn}%`)
      .limit(100);

    const { data: community } = await supabase
      .from('saved_routes')
      .select('route_data')
      .or(`city.ilike.%${normHe}%,city.ilike.%${normEn}%`)
      .limit(100);
    
    const merged = [
      ...((curated || []).map(d => d.route_data as Route)), 
      ...((community || []).map(d => d.route_data as Route))
    ];
    
    const seen = new Set();
    return merged.filter(r => { 
      if (!r || !r.name || seen.has(r.name)) return false; 
      seen.add(r.name); 
      return true; 
    });
  } catch (e) { return []; }
};

export const signInWithGoogle = async () => { await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }); };
export const signOut = async () => { await supabase.auth.signOut(); };
