import { createClient } from '@supabase/supabase-js';
import { Route, RouteConcept, FeedbackData, POI, UserPreferences } from '../types';
import { globalCache } from './cacheUtils';
import { saveRouteToNewSchema, getRouteFromNewSchema, getUserRoutesFromNewSchema, deleteRouteFromNewSchema } from './supabaseRoutes';

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
    const { data } = await supabase.from('poi_details').select('details_data, image_url, google_place_id').eq('poi_name', normName).eq('city', normCity).maybeSingle();
    if (data) return {
      ...data.details_data,
      imageUrl: data.image_url || data.details_data.imageUrl,
      googlePlaceId: data.google_place_id || data.details_data.googlePlaceId
    };
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
      google_place_id: details.googlePlaceId || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'poi_name,city' });
  } catch (e) { }
};

export const updatePoiImageInDb = async (poiName: string, city: string, imageUrl: string, googlePlaceId?: string) => {
  try {
    const normName = normalize(poiName);
    const normCity = normalize(city);
    await supabase.from('poi_details').upsert({
      poi_name: normName,
      city: normCity,
      image_url: imageUrl,
      google_place_id: googlePlaceId || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'poi_name,city' });
  } catch (e) { }
};

/**
 * Ensures there is a logged in user.
 * Tries Anonymous login first. If disabled, creates a temporary "guest" account.
 */
/**
 * Ensures there is a logged in user.
 * Tries Anonymous login first. If disabled, uses cached guest credentials or creates a new "guest" account.
 * Prevents hitting rate limits by reusing guest accounts.
 */
export const ensureAuthenticatedUser = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user.id;

  console.log('User not logged in. Attempting auto-login...');

  // 1. Try Anonymous (if enabled in Supabase)
  const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
  if (!anonError && anonData.user) {
    console.log('Logged in anonymously:', anonData.user.id);
    return anonData.user.id;
  }

  console.warn('Anonymous login failed (likely disabled). Using persistent guest strategy...');

  // 2. Strategy: Reuse Guest Credentials from LocalStorage
  // This prevents 'Email Rate Limit Exceeded' errors by avoiding constant SignUps.
  const STORAGE_KEY = 'urbanito_guest_creds';
  const storedCreds = localStorage.getItem(STORAGE_KEY);

  if (storedCreds) {
    try {
      const { email, password } = JSON.parse(storedCreds);
      console.log('Found cached guest credentials. Attempting login...');

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!signInError && signInData.user) {
        console.log('✅ Successfully reused guest account:', signInData.user.id);
        return signInData.user.id;
      }

      console.warn('Cached guest login failed (auth revoked or invalid). generating new identity...', signInError);
    } catch (e) {
      console.error('Error parsing stored credentials', e);
    }
  }

  // 3. Fallback: Create a NEW random guest account
  const guestEmail = `guest-${Date.now()}-${Math.floor(Math.random() * 1000)}@urbanito.local`;
  const guestPassword = `GuestPass${Date.now()}!`;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: guestEmail,
    password: guestPassword,
  });

  if (signUpData?.user) {
    console.log('✅ Created and logged in as NEW temporary guest:', signUpData.user.id);

    // Cache the credentials for next time
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: guestEmail, password: guestPassword }));

    return signUpData.user.id;
  }

  // If signUp fails, we are likely rate limited or blocked.
  console.error('Guest login fallback failed (Rate Limit/Error):', signUpError);
  return null;
}

/**
 * Save a route as a curated route (system-owned, public)
 */
export const saveToCuratedRoutes = async (route: Route, theme: string = 'general') => {
  try {
    console.log('[saveToCuratedRoutes] Starting save for route:', route.name);

    // Ensure we have a user to satisfy RLS
    const userId = await ensureAuthenticatedUser();

    if (!userId) {
      console.warn('[saveToCuratedRoutes] Could not authenticate user. Falling back to System User (public save).');
      // Continue execution with userId = null
    }

    console.log('[saveToCuratedRoutes] Saving using User ID:', userId);

    const result = await saveRouteToNewSchema(userId, route, { theme }, undefined, true);

    if (result?.success) {
      console.log('[saveToCuratedRoutes] Route saved successfully with ID:', result.routeId);
      // Invalidate cache implicitly by fetching fresh next time (since we disabled cache)
      return { data: [{ route_data: route, id: result.routeId }], error: null };
    }
    console.error('[saveToCuratedRoutes] Save failed - no success flag');
    return { data: null, error: 'Save failed' };
  } catch (e) {
    console.error("[saveToCuratedRoutes] Auto-save failed:", e);
    return { data: null, error: (e as Error).message };
  }
};

// Update saveRouteToSupabase to accept options
export const saveRouteToSupabase = async (
  userId: string,
  route: Route,
  preferences?: UserPreferences,
  isPublic: boolean = false,
  parentRouteId?: string
) => {
  try {
    const result = await saveRouteToNewSchema(userId, route, preferences, parentRouteId, isPublic);
    if (result?.success) {
      globalCache.invalidatePattern('all-recent-routes');
      return { id: result.routeId, route_data: route, user_id: userId };
    }
    return null;
  } catch (e) {
    console.error("saveRouteToSupabase failed:", e);
    return null;
  }
};

export const updateSavedRouteData = async (dbId: string, userId: string, route: Route) => {
  try {
    // Updates are handled by saveRouteToNewSchema (upsert logic)
    // If updating an existing route, we keep its public status unless specified? 
    // Ideally we should read current RLS, but for now we assume Private for simple updates unless it's a Fork
    await saveRouteToNewSchema(userId, route);
  } catch (e) { }
};

export const getSavedRoutesFromSupabase = async (userId: string) => {
  if (!userId) return [];
  const routes = await getUserRoutesFromNewSchema(userId);
  // Filter to only show PRIVATE routes in "My Saved", to avoid showing all public curated routes
  const privateRoutes = routes.filter(r => !r.is_public);
  return privateRoutes.map(r => ({
    id: r.id,
    user_id: userId,
    route_data: r,
    created_at: new Date().toISOString()
  }));
};

export const deleteRouteFromSupabase = async (id: string, userId: string) => {
  return await deleteRouteFromNewSchema(id, userId);
};

export const forkRoute = async (userId: string, originalRoute: Route, newRouteData: Route, isPublic: boolean = false) => {
  try {
    const result = await saveRouteToNewSchema(userId, newRouteData, {}, originalRoute.id, isPublic);
    if (result?.success) {
      globalCache.invalidatePattern('all-recent-routes');
      // If public, we might want to log it or do something else
      return { id: result.routeId, route_data: newRouteData, user_id: userId, created_at: new Date().toISOString() };
    }
    throw new Error("Failed to fork route");
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
  console.log('[getAllRecentRoutes] Fetching routes with limit (NO CACHE):', limit);

  try {
    const { data: routes, error } = await supabase
      .from('routes')
      .select('id')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !routes) {
      console.error('[getAllRecentRoutes] Error fetching routes:', error);
      return [];
    }

    console.log(`[getAllRecentRoutes] Found ${routes.length} route IDs`);

    const fullRoutes = await Promise.all(
      routes.map(r => getRouteFromNewSchema(r.id))
    );

    const filtered = fullRoutes.filter(r => r !== null) as Route[];
    console.log(`[getAllRecentRoutes] Returning ${filtered.length} full routes`);
    return filtered;
  } catch (e) {
    console.error("[getAllRecentRoutes] failure:", e);
    return [];
  }
};

export const getRecentCuratedRoutes = async (limit: number = 24): Promise<Route[]> => {
  return await getAllRecentRoutes(limit);
};

export const getRoutesByCityHub = async (cityName: string, cityNameEn?: string): Promise<Route[]> => {
  const normHe = normalize(cityName);
  const normEn = cityNameEn ? normalize(cityNameEn) : normHe;
  const cacheKey = `city-hub-${normHe}-${normEn}`;

  return globalCache.fetch(cacheKey, async () => {
    try {
      const { data: routes, error } = await supabase
        .from('routes')
        .select('id')
        .or(`city.ilike.%${normHe}%,city.ilike.%${normEn}%`)
        .eq('is_public', true)
        .limit(30);

      if (error || !routes) return [];

      const fullRoutes = await Promise.all(
        routes.map(r => getRouteFromNewSchema(r.id))
      );

      return fullRoutes.filter(r => r !== null) as Route[];
    } catch (e) {
      console.error("City hub fetch failed:", e);
      return [];
    }
  }, { ttl: 300000 });
};

export const getRouteById = async (routeId: string): Promise<Route | null> => {
  return await getRouteFromNewSchema(routeId);
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
  } catch (err) { }
};

export const signOut = async () => {
  try {
    await supabase.auth.signOut();
    window.localStorage.removeItem('urbanito-auth-v1');
    window.location.reload();
  } catch (err) { }
};

export const clearAllCache = () => {
  globalCache.clear();
};
