/**
 * Supabase client and data fetching utilities
 */

import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Route, UserPreferences, POI } from '../types';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const getSupabaseKey = () => {
  try {
    // @ts-ignore
    return import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';
  } catch {
    return (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : null) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';
  }
};

const SUPABASE_ANON_KEY = getSupabaseKey();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to normalize strings for comparison (lowercase, trimmed)
// Helper to normalize strings for comparison (lowercase, trimmed, strip parentheses)
export const normalize = (str: string = '') => {
  return str.toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, ' ') // Remove content in parentheses
    .trim();
};

/**
 * Cache Management
 */
class SimpleCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  async fetch<T>(key: string, fetchFn: () => Promise<T>, ttl: number = 300000): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && cached.expiry > now) return cached.data;

    const data = await fetchFn();
    this.cache.set(key, { data, expiry: now + ttl });
    return data;
  }

  clear() { this.cache.clear(); }

  invalidatePattern(pattern: string) {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }
}

export const globalCache = new SimpleCache();
export const cityCache = new SimpleCache();

/**
 * POI Details Cache
 */
export const getCachedPoiDetails = async (poiName: string, city: string, lat?: number, lng?: number) => {
  try {
    const normName = normalize(poiName);
    const normCity = normalize(city);

    const { data, error } = await supabase
      .from('poi_details')
      .select('details_data, image_url, google_place_id')
      .eq('poi_name', normName)
      .eq('city', normCity)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data.details_data,
      imageUrl: data.image_url,
      googlePlaceId: data.google_place_id
    };
  } catch (e) { return null; }
};

export const cachePoiDetails = async (poiName: string, city: string, details: any) => {
  try {
    const normName = normalize(poiName);
    const normCity = normalize(city);
    console.log(`[cachePoiDetails] Attempting to save cache for: ${normName} in ${normCity}`);

    const { error } = await supabase.from('poi_details').upsert({
      poi_name: normName,
      city: normCity,
      details_data: details,
      image_url: details.imageUrl || null,
      google_place_id: details.googlePlaceId || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'poi_name,city' });

    if (error) {
      console.error("[cachePoiDetails] Supabase error during upsert:", error);
    } else {
      console.log(`✅ [cachePoiDetails] Successfully cached: ${normName}`);
    }
  } catch (e) {
    console.error("[cachePoiDetails] Unexpected failure:", e);
  }
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
 * User Preferences
 */
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const { data, error } = await supabase.from('user_preferences').select('preferences_data').eq('user_id', userId).maybeSingle();
    return (data && data.preferences_data) || null;
  } catch (e) { return null; }
};

export const saveUserPreferences = async (userId: string, preferences: UserPreferences) => {
  try {
    await supabase.from('user_preferences').upsert({ user_id: userId, preferences_data: preferences, updated_at: new Date().toISOString() });
    return true;
  } catch (e) { return false; }
};

/**
 * Routes Persistence
 */
export const saveRouteToSupabase = async (userId: string, route: Route, preferences: UserPreferences, is_favorite: boolean = false, parent_route_id?: string) => {
  try {
    const effectiveUserId = userId === 'anon' ? null : userId;

    // 1. Call RPC to handle complex insert (route + pois + junction)
    const { data: routeId, error } = await supabase.rpc('save_generated_route', {
      p_user_id: effectiveUserId,
      p_name: route.name,
      p_city: route.city,
      p_description: route.description,
      p_duration_minutes: route.durationMinutes,
      p_preferences: preferences,
      p_is_public: route.is_public || false,
      p_is_favorite: is_favorite,
      p_parent_route_id: parent_route_id || route.parent_route_id,
      p_share_teaser: route.shareTeaser || null,
      p_highlights: route.highlights || [],
      p_pois: route.pois.map((p, idx) => {
        const generatedId = generateStableId(p.name, p.lat, p.lng);
        return {
          id: p.id || generatedId,
          content_hash: p.id || generatedId, // Explicitly pass content_hash
          name: p.name,
          lat: p.lat,
          lng: p.lng,
          order_index: idx,
          travel_data: null, // Could be enhanced later
          poi_data: {
            description: p.description,
            historicalContext: p.historicalContext,
            historicalAnalysis: p.historicalAnalysis,
            architecturalAnalysis: p.architecturalAnalysis,
            narrative: p.narrative,
            imageUrl: p.imageUrl,
            isPremiumContent: p.isPremiumContent
          }
        };
      })
    });

    if (error) throw error;

    // Invalidate cache so the new route appears in library
    globalCache.invalidatePattern('all-recent-routes');

    return routeId;
  } catch (err) {
    console.error("Save error:", err);
    return null;
  }
};

export const updateRouteImage = async (routeId: string, imageUrl: string, prompt?: string) => {
  try {
    const updates: any = { reconstruction_image_url: imageUrl };
    if (prompt) {
      updates.historical_reconstruction_prompt = prompt;
    }

    const { error } = await supabase
      .from('routes')
      .update(updates)
      .eq('id', routeId);

    if (error) throw error;
    globalCache.invalidatePattern('all-recent-routes');
    console.log("✅ Route reconstruction image updated in DB");
    return true;
  } catch (err) {
    console.error("Failed to update route image:", err);
    return false;
  }
};

export const getSavedRoutesFromSupabase = async (userId: string): Promise<any[]> => {
  try {
    const effectiveUserId = userId === 'anon' ? null : userId;
    if (!effectiveUserId) return [];

    console.log('[getSavedRoutesFromSupabase] Fetching for user:', effectiveUserId);
    const { data, error } = await supabase
      .from('user_saved_routes')
      .select(`
        is_favorite,
        route_id,
        routes (
          id,
          name,
          city,
          description,
          duration_minutes,
          preferences,
          user_id,
          is_public,
          user_id,
          is_public,
          parent_route_id,
          share_teaser,
          reconstruction_image_url,
          historical_reconstruction_prompt,
          route_pois (
            order_index,
            pois (
              id,
              name,
              lat,
              lng,
              data
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((item: any) => {
      const r = item.routes;
      const sortedPois = (r.route_pois || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((rp: any) => ({
          ...rp.pois,
          ...rp.pois.data,
          isFullyLoaded: !!(rp.pois.data?.historicalAnalysis || rp.pois.data?.description)
        }));

      return {
        id: r.id,
        is_favorite: item.is_favorite,
        route_data: {
          ...r,
          durationMinutes: r.duration_minutes,
          shareTeaser: r.share_teaser,
          pois: sortedPois,
          isFullyLoaded: sortedPois.some((p: any) => p.isFullyLoaded)
        }
      };
    });
  } catch (err) { return []; }
};

export const updateSavedRouteData = async (routeId: string, updates: any) => {
  try {
    const { error } = await supabase.from('routes').update(updates).eq('id', routeId);
    return !error;
  } catch (e) { return false; }
};



export const deleteRouteFromSupabase = async (userId: string, routeId: string) => {
  try {
    const effectiveUserId = userId === 'anon' ? null : userId;
    if (!effectiveUserId) return false;
    const { error } = await supabase.from('user_saved_routes').delete().eq('user_id', effectiveUserId).eq('route_id', routeId);
    return !error;
  } catch (e) { return false; }
};

export const getAllRecentRoutes = async (limit: number = 100, userId?: string): Promise<Route[]> => {
  const cacheKey = `all-recent-routes-${limit}-${userId || 'anon'}`;
  return globalCache.fetch(cacheKey, async () => {
    console.log('[getAllRecentRoutes] Fetching routes with limit (Deep Query):', limit, 'for user:', userId || 'anon');

    try {
      let query = supabase
        .from('routes')
        .select(`
          *,
          route_pois (
            order_index,
            travel_data,
            pois (
              id,
              name,
              lat,
              lng,
              data
            )
          )
        `);

      if (userId) {
        query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
      } else {
        query = query.eq('is_public', true);
      }

      const { data: routes, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !routes) {
        console.error('[getAllRecentRoutes] Error fetching routes:', error);
        return [];
      }

      console.log(`[getAllRecentRoutes] Found ${routes.length} routes via Deep Query`);

      // Map to Route interface
      const mappedRoutes: Route[] = routes.map((r: any) => {
        // Sort POIs by order_index
        const sortedPois = (r.route_pois || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((rp: any) => {
            const p = rp.pois;
            const poiData = p.data || {};
            const hasContent = !!(poiData.historicalAnalysis || poiData.description || poiData.historicalContext);

            return {
              id: p.id || generateStableId(p.name, p.lat, p.lng),
              name: p.name,
              lat: p.lat,
              lng: p.lng,
              ...poiData,
              travelFromPrevious: rp.travel_data,
              isFullyLoaded: hasContent
            };
          });

        return {
          id: r.id,
          name: r.name,
          city: r.city,
          description: r.description || '',
          durationMinutes: r.duration_minutes || 0,
          creator: r.user_id,
          directionsData: r.directions_data,
          pois: sortedPois,
          preferences: r.preferences || {},
          originalPoiCount: sortedPois.length,
          is_public: r.is_public,
          isFullyLoaded: sortedPois.some((p: any) => p.isFullyLoaded)
        };
      });

      return mappedRoutes;
    } catch (err) {
      console.error('[getAllRecentRoutes] CRITICAL ERROR:', err);
      return [];
    }
  });
};

export const getRoutesByCityHub = async (cityName: string, cityEn?: string, language?: string): Promise<Route[]> => {
  const cacheKey = `city-hub-${normalize(cityName)}-${normalize(cityEn || '')}-${language || 'any'}`;
  return cityCache.fetch(cacheKey, async () => {
    try {
      let query = supabase
        .from('routes')
        .select(`
          *,
          route_pois (
            order_index,
            pois (
              id,
              name,
              lat,
              lng,
              data
            )
          )
        `);

      if (cityEn) {
        query = query.or(`city.eq.${cityName},city.eq.${cityEn}`);
      } else {
        query = query.eq('city', cityName);
      }

      const { data, error } = await query
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error || !data) return [];

      let filtered = data;
      if (language) {
        const isHe = language === 'he';
        filtered = data.filter((r: any) => {
          const hasHebrew = /[\u0590-\u05FF]/.test(r.name || '');
          return isHe ? hasHebrew : !hasHebrew;
        });
      }

      return filtered.map((r: any) => {
        const sortedPois = (r.route_pois || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((rp: any) => ({
            ...rp.pois,
            ...rp.pois.data,
            isFullyLoaded: !!(rp.pois.data?.historicalAnalysis || rp.pois.data?.description)
          }));

        return {
          ...r,
          durationMinutes: r.duration_minutes,
          pois: sortedPois,
          isFullyLoaded: sortedPois.some((p: any) => p.isFullyLoaded)
        };
      });
    } catch (e) { return []; }
  });
};

/**
 * POIs Persistence
 */
export const getSavedPoisFromSupabase = async (userId: string): Promise<any[]> => {
  try {
    const effectiveUserId = userId === 'anon' ? null : userId;
    if (!effectiveUserId) return [];
    const { data, error } = await supabase.from('user_saved_pois').select('*, pois(*)').eq('user_id', effectiveUserId);
    return data || [];
  } catch (e) { return []; }
};

export const savePoiToSupabase = async (userId: string, poi: POI) => {
  try {
    const effectiveUserId = userId === 'anon' ? null : userId;
    if (!effectiveUserId) return false;
    // 1. Ensure POI exists
    const { data: poiRecord, error: pError } = await supabase.from('pois').upsert({
      name: poi.name,
      lat: poi.lat,
      lng: poi.lng,
      data: poi
    }, { onConflict: 'name,lat,lng' }).select().single();

    if (pError) throw pError;

    // 2. Link to user
    await supabase.from('user_saved_pois').upsert({ user_id: effectiveUserId, poi_id: poiRecord.id });
    return true;
  } catch (e) { return false; }
};

export const deletePoiFromSupabase = async (userId: string, poiId: string) => {
  try {
    const effectiveUserId = userId === 'anon' ? null : userId;
    if (!effectiveUserId) return false;
    await supabase.from('user_saved_pois').delete().eq('user_id', effectiveUserId).eq('poi_id', poiId);
    return true;
  } catch (e) { return false; }
};

/**
 * Auth
 */
export const signInWithGoogle = async () => {
  // For native Capacitor apps, redirect to the web URL which will deep-link back.
  // For web, redirect to the current origin.
  const isNative = Capacitor.isNativePlatform();
  const redirectUrl = isNative
    ? 'https://urbanito.live/auth/callback'
    : window.location.origin;

  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
};

/**
 * Clean OAuth hash fragment from URL after Supabase processes it.
 * Call this after auth state changes to prevent React Router confusion.
 */
export const cleanOAuthHash = () => {
  if (window.location.hash && window.location.hash.includes('access_token')) {
    // Replace the URL without the hash, keeping the path
    const cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', cleanUrl || '/');
  }
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

/**
 * Utils
 */
export const generateStableId = (name: string, lat: number, lng: number) => {
  return `poi-${normalize(name)}-${lat.toFixed(4)}-${lng.toFixed(4)}`;
};

// CRITICAL FIX: Ensure enriched POI data is saved to the shared 'pois' table
export const updateSharedPoiData = async (poi: POI) => {
  try {
    // We only update if we have actual content to save
    if (!poi.description && !poi.historicalAnalysis) return;

    // Remove UI-only flags and ID before saving
    const { isFullyLoaded, id, ...dataToSave } = poi as any;

    console.log(`[updateSharedPoiData] Persisting enriched data via RPC for: ${poi.name}`);

    // Call RPC to handle safe insertion/update (Security Definer)
    const { error } = await supabase.rpc('safe_update_poi', {
      p_name: poi.name,
      p_lat: poi.lat || 0,
      p_lng: poi.lng || 0,
      p_data: dataToSave
    });

    if (error) throw error;
  } catch (e) {
    console.warn("[updateSharedPoiData] Failed to update shared POI:", e);
  }
};

export const logUsage = async (userId: string | null, action: string, details?: any) => {
  try {
    const effectiveUserId = userId === 'anon' ? null : userId;
    await supabase.from('usage_logs').insert({
      user_id: effectiveUserId,
      action,
      details,
      created_at: new Date().toISOString()
    });
  } catch (e) { }
};

export const submitFeedback = async (userId: string | null, feedback: any, language?: string) => {
  try {
    const effectiveUserId = userId === 'anon' ? null : userId;
    await supabase.from('feedback').insert({
      user_id: effectiveUserId,
      data: feedback,
      language: language || 'he',
      created_at: new Date().toISOString()
    });
    return true;
  } catch (e) { return false; }
};

export const logPremiumInterest = async (userId: string | null, feature: string = 'general') => {
  try {
    const effectiveUserId = userId === 'anon' ? null : userId;
    await supabase.from('premium_interest').insert({
      user_id: effectiveUserId,
      feature,
      created_at: new Date().toISOString()
    });
    return true;
  } catch (e) { return false; }
};

/**
 * Automatically save a generated route to the curated list (Public)
 */
export const saveToCuratedRoutes = async (route: Route, language?: string) => {
  try {
    const finalLanguage = language || route.preferences?.language || (route.name.match(/[\u0590-\u05FF]/) ? 'he' : 'en');
    console.log(`[saveToCuratedRoutes] Saving route ${route.name} as public (${finalLanguage})...`);

    // Use the RPC to ensure it's saved correctly with all POIs
    const preferences = {
      ...(route.preferences || {}),
      language: finalLanguage,
      explanationStyle: route.preferences?.explanationStyle || 'standard'
    };

    const userId = (route as any).user_id || (route as any).user?.id || null;
    const effectiveUserId = userId === 'anon' ? null : userId;

    const routeId = await saveRouteToSupabase(
      effectiveUserId,
      { ...route, is_public: true },
      preferences,
      false // not favorite by default
    );

    if (routeId) {
      console.log(`✅ [saveToCuratedRoutes] Successfully saved public route: ${routeId}`);
      return { data: [{ id: routeId }] };
    }
    return { error: 'Failed to save via RPC' };
  } catch (e: any) {
    console.error("[saveToCuratedRoutes] Failed:", e);
    return { error: e.message };
  }
};

/**
 * Fork a route (or update it by creating a new version linked to the parent)
 */
export const forkRoute = async (userId: string, parentRoute: Route, newRoute: Route, isPublic: boolean = false) => {
  try {
    console.log(`[forkRoute] Forking route ${parentRoute.name} for user ${userId}...`);

    // Default preferences if missing
    const preferences = newRoute.preferences || parentRoute.preferences || {
      language: 'he',
      explanationStyle: 'standard'
    };

    const newRouteId = await saveRouteToSupabase(
      userId,
      { ...newRoute, is_public: isPublic },
      preferences,
      false, // favorite
      parentRoute.id // link to parent
    );

    if (newRouteId) {
      return { id: newRouteId };
    }
    return null;
  } catch (e) {
    console.error("[forkRoute] Failed:", e);
    return null;
  }
};

export const getRecentCuratedRoutes = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('*, route_pois(pois(*))')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  } catch (e) { return []; }
};

export const getRouteById = async (id: string): Promise<Route | null> => {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        route_pois (
          order_index,
          pois (
            id,
            name,
            lat,
            lng,
            data
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const sortedPois = (data.route_pois || [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((rp: any) => ({
        ...rp.pois,
        ...rp.pois.data,
        isFullyLoaded: !!(rp.pois.data?.historicalAnalysis || rp.pois.data?.description)
      }));

    return {
      ...data,
      durationMinutes: data.duration_minutes,
      pois: sortedPois,
      isFullyLoaded: sortedPois.some((p: any) => p.isFullyLoaded)
    };
  } catch (e) { return null; }
};
