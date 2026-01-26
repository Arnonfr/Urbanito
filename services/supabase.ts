import { createClient } from '@supabase/supabase-js';
import { Route, RouteConcept, FeedbackData, POI, UserPreferences } from '../types';
import { globalCache } from './cacheUtils';
import { saveRouteToNewSchema, getUserRoutesFromNewSchema, deleteRouteFromNewSchema } from './supabaseRoutes';

// Feature flag: Set to true to use new normalized schema
const USE_NEW_SCHEMA = true;

// @ts-ignore - import.meta is a Vite feature
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://xrawvyvcyewjmlzypnqc.supabase.co';
// @ts-ignore - import.meta is a Vite feature
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

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
    const { data, error } = await supabase.from('curated_routes').insert([{
      city: normalize(route.city),
      theme: theme,
      route_data: route
    }]).select();

    if (error) {
      console.error("Supabase insert error (curated_routes):", error);
    } else {
      console.log("Successfully saved to curated_routes:", data);
      globalCache.invalidatePattern('all-recent-routes');
    }
  } catch (e) {
    console.error("Auto-save to curated failed:", e);
  }
};

export const saveRouteToSupabase = async (userId: string, route: Route, preferences?: UserPreferences) => {
  try {
    // Use new normalized schema if feature flag is enabled
    if (USE_NEW_SCHEMA) {
      console.log('Using NEW schema for route storage');
      const result = await saveRouteToNewSchema(userId, route, preferences);
      if (result) {
        globalCache.invalidatePattern('all-recent-routes');
        return { id: result.routeId, ...result };
      }
      return null;
    }

    // Fallback to old schema
    console.log('Using OLD schema for route storage');
    const { data, error } = await supabase.from('saved_routes').insert([{
      user_id: userId,
      route_data: route,
      city: normalize(route.city)
    }]).select();
    if (error) {
      console.error("Supabase insert error (saved_routes):", error);
      throw error;
    }
    globalCache.invalidatePattern('all-recent-routes');
    return data ? data[0] : null;
  } catch (e) {
    console.error("saveRouteToSupabase failed:", e);
    return null;
  }
};

export const updateSavedRouteData = async (dbId: string, userId: string, route: Route) => {
  try {
    await supabase.from('saved_routes').update({ route_data: route }).eq('id', dbId).eq('user_id', userId);
  } catch (e) { }
};

export const getSavedRoutesFromSupabase = async (userId: string) => {
  try {
    if (USE_NEW_SCHEMA) {
      console.log('Fetching routes from NEW schema');
      const routes = await getUserRoutesFromNewSchema(userId);
      // Wrap in route_data format for backward compatibility
      return routes.map(route => ({ route_data: route, id: route.id }));
    }

    // Fallback to old schema
    const { data } = await supabase.from('saved_routes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  } catch (e) { return []; }
};

export const deleteRouteFromSupabase = async (id: string, userId: string) => {
  try {
    if (USE_NEW_SCHEMA) {
      console.log('Deleting route from NEW schema');
      await deleteRouteFromNewSchema(id, userId);
      return;
    }

    // Fallback to old schema
    await supabase.from('saved_routes').delete().eq('id', id).eq('user_id', userId);
  } catch (e) { }
};

export const forkRoute = async (userId: string, originalRoute: Route, newRouteData: Route) => {
  try {
    // 1. Prepare the new route object
    const forkedRoute: Route = {
      ...newRouteData,
      id: `r-${Date.now()}`, // Generate new ID
      creator: userId, // New owner
      parent_route_id: originalRoute.id, // Link to parent
      // Note: We keep the original city/name but they might be updated by AI logic before passing here
    };

    // 2. Save to Supabase (creating a new entry)
    const { data, error } = await supabase.from('saved_routes').insert([{
      user_id: userId,
      route_data: forkedRoute,
      city: normalize(forkedRoute.city),
      parent_route_id: originalRoute.id // If DB has this column, otherwise rely on jsonb
    }]).select();

    if (error) {
      console.error("Forking route failed (DB insert):", error);
      throw error;
    }

    globalCache.invalidatePattern('all-recent-routes');
    return data ? data[0] : null;

  } catch (e) {
    console.error("forkRoute failed:", e);
    return null;
  }
};

export const savePoiToSupabase = async (userId: string, poi: POI) => {
  try {
    const { data, error } = await supabase.from('saved_pois').upsert([{
      user_id: userId,
      poi_id: poi.id,
      poi_data: poi
    }], { onConflict: 'user_id,poi_id' }).select();
    if (error) throw error;
    return data ? data[0] : null;
  } catch (e) { return null; }
};

export const getSavedPoisFromSupabase = async (userId: string) => {
  try {
    const { data } = await supabase.from('saved_pois').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  } catch (e) { return []; }
};

export const deletePoiFromSupabase = async (poiId: string, userId: string) => {
  try { await supabase.from('saved_pois').delete().eq('poi_id', poiId).eq('user_id', userId); } catch (e) { }
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
  return globalCache.fetch(`all-recent-routes-${limit}`, async () => {
    try {
      // Separate calls to ensure one failure (like RLS for non-logged-in users) doesn't block the other
      const [curatedRes, savedRes] = await Promise.allSettled([
        supabase.from('curated_routes').select('route_data').order('created_at', { ascending: false }).limit(limit),
        supabase.from('saved_routes').select('route_data').order('created_at', { ascending: false }).limit(limit)
      ]);

      console.log('getAllRecentRoutes - Raw results:', {
        curatedStatus: curatedRes.status,
        savedStatus: savedRes.status,
        curatedError: curatedRes.status === 'rejected' ? curatedRes.reason : null,
        savedError: savedRes.status === 'rejected' ? savedRes.reason : null
      });

      const curatedData = curatedRes.status === 'fulfilled' && curatedRes.value.data ? curatedRes.value.data : [];
      // For saved_routes: if RLS blocks it, we'll get an error or empty array. That's fine - just use curated.
      const savedData = savedRes.status === 'fulfilled' && savedRes.value.data ? savedRes.value.data : [];

      console.log(`getAllRecentRoutes: curated=${curatedData.length}, saved=${savedData.length}`);

      const merged = [...curatedData, ...savedData];
      const seen = new Set();
      const final: Route[] = [];

      for (const item of merged) {
        if (!item.route_data) {
          console.warn('getAllRecentRoutes: Item without route_data:', item);
          continue;
        }
        const r = item.route_data as Route;
        if (!r.name || !r.pois || r.pois.length === 0) {
          console.warn('getAllRecentRoutes: Invalid route:', r);
          continue;
        }
        const key = `${normalize(r.name)}-${normalize(r.city)}`;
        if (!seen.has(key)) {
          seen.add(key);
          final.push(r);
        }
      }

      console.log(`getAllRecentRoutes: Returning ${final.length} routes`);

      // Return whatever we got, even if empty - the UI will handle it
      return final;
    } catch (e) {
      console.error("Fetch recent routes failed:", e);
      return [];
    }
  }, { ttl: 60000 }); // 1 minute cache for recent routes
};


export const getRecentCuratedRoutes = async (limit: number = 24): Promise<Route[]> => {
  return await getAllRecentRoutes(limit);
};

export const getRoutesByCityHub = async (cityName: string, cityNameEn?: string): Promise<Route[]> => {
  const normHe = normalize(cityName);
  const normEn = cityNameEn ? normalize(cityNameEn) : "";
  const cacheKey = `city-hub-${normHe}-${normEn}`;

  return globalCache.fetch(cacheKey, async () => {
    try {
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
  }, { ttl: 300000 }); // 5 minutes cache for city hubs
};

export const getRouteById = async (routeId: string): Promise<Route | null> => {
  try {
    // Check curated_routes first
    const { data: curatedData } = await supabase.from('curated_routes').select('route_data').eq('route_data->>id', routeId).maybeSingle();
    if (curatedData?.route_data) return curatedData.route_data as Route;

    // Then check saved_routes
    // Note: This might fail if the user is not the owner (RLS), 
    // but curated routes are public.
    const { data: savedData } = await supabase.from('saved_routes').select('route_data').eq('route_data->>id', routeId).maybeSingle();
    if (savedData?.route_data) return savedData.route_data as Route;

    return null;
  } catch (e) {
    console.error("Get route by ID failed:", e);
    return null;
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
export const signOut = async () => {
  try {
    await supabase.auth.signOut();
    // Clear any cached data
    window.localStorage.removeItem('urbanito-auth-v1');
    // Reload to clear all state
    window.location.reload();
  } catch (err) {
    console.error("Sign out error:", err);
  }
};


// Export cache clearing for debugging
export const clearAllCache = () => {
  globalCache.clear();
  console.log('All cache cleared');
};
