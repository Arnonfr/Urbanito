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
const upsertPoi = async (poi: POI): Promise<string | null> => {
    try {
        const contentHash = await generateContentHash(poi);

        // Check if POI already exists
        const { data: existing } = await supabase
            .from('pois')
            .select('id')
            .eq('content_hash', contentHash)
            .maybeSingle();

        if (existing) {
            console.log(`POI already exists: ${poi.name} (${existing.id})`);
            return existing.id;
        }

        // Insert new POI
        const { data, error } = await supabase
            .from('pois')
            .insert([{
                content_hash: contentHash,
                name: poi.name,
                lat: poi.lat,
                lng: poi.lng,
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
            }])
            .select('id')
            .single();

        if (error) {
            console.error('Error inserting POI:', error);
            return null;
        }

        console.log(`POI created: ${poi.name} (${data.id})`);
        return data.id;
    } catch (e) {
        console.error('upsertPoi failed:', e);
        return null;
    }
};

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
    parentRouteId?: string
): Promise<{ routeId: string; success: boolean } | null> => {
    try {
        console.log(`Saving route "${route.name}" for user ${userId}`);

        // Step 1: Upsert all POIs and collect their database IDs
        const poiIds: { frontendId: string; dbId: string; order: number }[] = [];

        for (let i = 0; i < route.pois.length; i++) {
            const poi = route.pois[i];
            const dbId = await upsertPoi(poi);

            if (dbId) {
                poiIds.push({
                    frontendId: poi.id,
                    dbId,
                    order: i
                });
            } else {
                console.warn(`Failed to save POI: ${poi.name}`);
            }
        }

        if (poiIds.length === 0) {
            console.error('No POIs were saved successfully');
            return null;
        }

        // Step 2: Create route entry
        const { data: routeData, error: routeError } = await supabase
            .from('routes')
            .insert([{
                user_id: userId,
                parent_route_id: parentRouteId || null,
                city: normalize(route.city),
                name: route.name,
                description: route.description,
                preferences: preferences || {},
                is_public: false, // Default to private
                duration_minutes: route.durationMinutes
            }])
            .select('id')
            .single();

        if (routeError || !routeData) {
            console.error('Error creating route:', routeError);
            return null;
        }

        const routeId = routeData.id;
        console.log(`Route created with ID: ${routeId}`);

        // Step 3: Link POIs to route via junction table
        const junctionInserts = poiIds.map(({ dbId, order }) => ({
            route_id: routeId,
            poi_id: dbId,
            order_index: order,
            travel_data: route.pois[order].travelFromPrevious || null
        }));

        const { error: junctionError } = await supabase
            .from('route_pois')
            .insert(junctionInserts);

        if (junctionError) {
            console.error('Error linking POIs to route:', junctionError);
            // Try to clean up the route entry
            await supabase.from('routes').delete().eq('id', routeId);
            return null;
        }

        console.log(`Successfully saved route with ${poiIds.length} POIs`);
        return { routeId, success: true };

    } catch (e) {
        console.error('saveRouteToNewSchema failed:', e);
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
