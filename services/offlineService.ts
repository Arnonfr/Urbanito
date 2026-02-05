import { openDB, saveToDB, deleteFromDB, getAllFromDB, STORE_ROUTES, getFromDB } from './db';
import { Route } from '../types';

/**
 * Downloads a route and its assets (basic simulation of asset fetching for now).
 * Real implementation would convert images to Blobs.
 */
export const downloadRouteForOffline = async (route: Route, onProgress?: (p: number) => void) => {
    try {
        console.log(`[OfflineService] Starting download for ${route.name}`);
        const totalSteps = route.pois.length + 1; // pois + final save
        let completed = 0;

        // Clone the route to avoid mutating original
        // We add a 'offlineTimestamp' to mark it
        const offlineRoute = { ...route, isOffline: true, offlineTimestamp: Date.now() };

        // 1. Process POIs
        // Ideally we fetch images here. 
        // Note: CORS issues usually block direct fetch of Google Images.
        // We will store the data structure. Service Workers should handle HTTP caching.
        // But for "True Offline" without SW rely, we'd need to fetch via a proxy or backend.
        // For this implementation, we save the JSON data structure which covers TEXT coverage.

        for (const poi of offlineRoute.pois) {
            // Simulate asset processing time or fetch logic
            // await cacheImage(poi.imageUrl); // Placeholder
            await new Promise(r => setTimeout(r, 200)); // Simulating network
            completed++;
            if (onProgress) onProgress(Math.round((completed / totalSteps) * 100));
        }

        // 2. Save to IndexedDB
        await saveToDB(STORE_ROUTES, offlineRoute);
        if (onProgress) onProgress(100);

        console.log(`[OfflineService] Saved ${route.id} to offline storage`);
        return true;
    } catch (e) {
        console.error('[OfflineService] Download failed', e);
        return false;
    }
};

export const getOfflineRoutes = async (): Promise<Route[]> => {
    const routes = await getAllFromDB(STORE_ROUTES);
    return routes as Route[];
};

export const isRouteOffline = async (id: string): Promise<boolean> => {
    const route = await getFromDB(STORE_ROUTES, id);
    return !!route;
}

export const removeOfflineRoute = async (id: string) => {
    await deleteFromDB(STORE_ROUTES, id);
};
