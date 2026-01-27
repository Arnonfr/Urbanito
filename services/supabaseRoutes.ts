/**
 * New Route Storage System using normalized schema (routes, pois, route_pois)
 * This replaces the old JSONB-heavy approach for better deduplication and forking support
 */

import { supabase, normalize, generateStableId } from './supabase';
import { Route, POI } from '../types';

/**
 * Generate a content hash for POI deduplication
 * Uses stable_id as the primary identifier
 */
const generateContentHash = async (poi: POI): Promise<string> => {
    const stableId = generateStableId(poi.name, poi.lat, poi.lng);

    // Use Web Crypto API for SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(stableId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
};

/**
 * Save or retrieve a POI from the pois table
 * Returns the UUID of the POI in the database
 */

/**
 * Save a complete route to the new schema
 * This will:
 * 1. Create/reuse POIs in the pois table
 * 2. Create a route entry in routes table
 * 3. Link them via route_pois junction table
 */
export const saveRouteToNewSchema = async (
    userId: string,
    route: Route,
    preferences?: any,
    parentRouteId?: string,
    isPublic: boolean = false
): Promise<{ routeId: string; success: boolean } | null> => {
    try {
        console.log(`[saveRouteToNewSchema] Using RPC for user ${userId}`);

        // Prepare POIs for RPC
        const poisForRpc = await Promise.all(route.pois.map(async (poi, index) => {
            const contentHash = await generateContentHash(poi);
            return {
                id: contentHash, // We send the hash as the ID for deduplication logic on server
                name: poi.name,
                lat: poi.lat,
                lng: poi.lng,
                order_index: index,
                travel_data: poi.travelFromPrevious || null,
                data: {
                    category: poi.category,
                    description: poi.description,
                    narrative: poi.narrative,
                    historicalContext: poi.historicalContext,
                    architecturalStyle: poi.architecturalStyle,
                    historicalAnalysis: poi.historicalAnalysis,
                    architecturalAnalysis: poi.architecturalAnalysis,
                    tourScript: poi.tourScript,
                    imageUrl: poi.imageUrl,
                    additionalImages: poi.additionalImages,
                    sections: poi.sections,
                    sources: poi.sources,
                    externalUrl: poi.externalUrl
                }
            };
        }));

        const { data: routeId, error } = await supabase.rpc('save_generated_route', {
            p_city: normalize(route.city),
            p_name: route.name,
            p_description: route.description || '',
            p_duration: route.durationMinutes || 0,
            p_preferences: preferences || {},
            p_pois: poisForRpc
        });

        if (error) {
            console.error('[saveRouteToNewSchema] RPC Error:', error);
            // Fallback for debugging - remove later
            // return { routeId: 'temp-' + Date.now(), success: false }; 
            return null;
        }

        console.log(`[saveRouteToNewSchema] RPC Success! Route ID: ${routeId}`);
        return { routeId, success: true };

    } catch (e) {
        console.error('[saveRouteToNewSchema] CRITICAL FAILURE:', e);
        return null;
    }
};

/**
 * Retrieve a route from the new schema
 * Reconstructs the Route object from normalized tables
 */
export const getRouteFromNewSchema = async (routeId: string): Promise<Route | null> => {
    try {
        // Get route metadata
        const { data: routeData, error: routeError } = await supabase
            .from('routes')
            .select('*')
            .eq('id', routeId)
            .single();

        if (routeError || !routeData) {
            console.error('Route not found:', routeError);
            return null;
        }

        // Get POIs linked to this route
        const { data: routePois, error: poisError } = await supabase
            .from('route_pois')
            .select(`
        order_index,
        travel_data,
        pois (
          id,
          name,
          lat,
          lng,
          data
        )
      `)
            .eq('route_id', routeId)
            .order('order_index', { ascending: true });

        if (poisError || !routePois) {
            console.error('Error fetching POIs:', poisError);
            return null;
        }

        // Reconstruct POI objects
        const pois: POI[] = routePois.map((rp: any) => {
            const poiData = rp.pois;
            return {
                id: generateStableId(poiData.name, poiData.lat, poiData.lng),
                name: poiData.name,
                lat: poiData.lat,
                lng: poiData.lng,
                ...poiData.data,
                travelFromPrevious: rp.travel_data
            };
        });

        // Reconstruct Route object
        const route: Route = {
            id: routeId,
            name: routeData.name,
            city: routeData.city,
            description: routeData.description || '',
            durationMinutes: routeData.duration_minutes || 0,
            creator: routeData.user_id,
            pois
        };

        return route;

    } catch (e) {
        console.error('getRouteFromNewSchema failed:', e);
        return null;
    }
};

/**
 * Get all routes for a user from the new schema
 */
export const getUserRoutesFromNewSchema = async (userId: string): Promise<Route[]> => {
    try {
        const { data: routes, error } = await supabase
            .from('routes')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error || !routes) {
            console.error('Error fetching user routes:', error);
            return [];
        }

        // Fetch each route's full data
        const fullRoutes = await Promise.all(
            routes.map(r => getRouteFromNewSchema(r.id))
        );

        return fullRoutes.filter(r => r !== null) as Route[];

    } catch (e) {
        console.error('getUserRoutesFromNewSchema failed:', e);
        return [];
    }
};

/**
 * Delete a route from the new schema
 * CASCADE will automatically delete route_pois entries
 */
export const deleteRouteFromNewSchema = async (routeId: string, userId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('routes')
            .delete()
            .eq('id', routeId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting route:', error);
            return false;
        }

        return true;
    } catch (e) {
        console.error('deleteRouteFromNewSchema failed:', e);
        return false;
    }
};
