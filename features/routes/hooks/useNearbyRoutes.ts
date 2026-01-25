
import { useState, useCallback } from 'react';
import { getAllRecentRoutes } from '@/services/supabase';
import { Route } from '@/types';

// google is declared globally in types/globals.d.ts

export interface RouteWithDistance extends Route {
    dist?: number;
}

export const useNearbyRoutes = () => {
    const [nearbyRoutes, setNearbyRoutes] = useState<RouteWithDistance[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchNearby = useCallback(async (centerLat: number, centerLng: number) => {
        setIsSearching(true);
        setError(null);
        setNearbyRoutes([]);

        try {
            if (typeof google === 'undefined' || !google.maps || !google.maps.geometry) {
                throw new Error("Google Maps API not loaded");
            }

            const center = new google.maps.LatLng(centerLat, centerLng);
            const allRoutes = await getAllRecentRoutes(150);

            if (!allRoutes) {
                throw new Error("Failed to fetch routes");
            }

            const routesWithDist = allRoutes.map((route: any) => {
                if (!route.pois || route.pois.length === 0) return { ...route, dist: Infinity };

                const startPoi = route.pois[0];
                const dist = google.maps.geometry.spherical.computeDistanceBetween(
                    center,
                    new google.maps.LatLng(startPoi.lat, startPoi.lng)
                );
                return { ...route, dist };
            });

            const sorted = routesWithDist.sort((a: any, b: any) => (a.dist || 0) - (b.dist || 0));
            const top10 = sorted.slice(0, 10);

            setNearbyRoutes(top10);
            return top10;
        } catch (err) {
            console.error("Error searching nearby routes:", err);
            setError("Error searching for tours");
            return [];
        } finally {
            setIsSearching(false);
        }
    }, []);

    return { nearbyRoutes, isSearching, error, searchNearby };
};
