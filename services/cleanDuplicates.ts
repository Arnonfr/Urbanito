/**
 * Utility to clean duplicate routes from the database
 * Keeps the oldest route and deletes newer duplicates
 */

import { supabase, normalize } from './supabase';

export const cleanDuplicateRoutes = async (userId: string): Promise<number> => {
    try {
        console.log('[cleanDuplicateRoutes] Starting cleanup for user:', userId);

        // Get all routes for the user (both private AND public)
        const { data: routes, error } = await supabase
            .from('routes')
            .select('id, name, city, created_at, is_public')
            .eq('user_id', userId)
            .order('created_at', { ascending: true }); // Oldest first

        if (error || !routes) {
            console.error('[cleanDuplicateRoutes] Error fetching routes:', error);
            return 0;
        }

        console.log(`[cleanDuplicateRoutes] Found ${routes.length} total routes`);

        // Group routes by normalized name + city
        const routeGroups = new Map<string, typeof routes>();

        for (const route of routes) {
            const key = `${route.name}|${normalize(route.city)}`;
            if (!routeGroups.has(key)) {
                routeGroups.set(key, []);
            }
            routeGroups.get(key)!.push(route);
        }

        // Find duplicates and delete them
        let deletedCount = 0;

        for (const [key, group] of routeGroups.entries()) {
            if (group.length > 1) {
                console.log(`[cleanDuplicateRoutes] Found ${group.length} duplicates for: ${key}`);

                // Keep the first PRIVATE route if exists, otherwise keep the oldest
                const privateRoute = group.find(r => !r.is_public);
                const toKeep = privateRoute || group[0];

                // Delete all others
                const toDelete = group.filter(r => r.id !== toKeep.id);

                for (const duplicate of toDelete) {
                    console.log(`[cleanDuplicateRoutes] Deleting duplicate: ${duplicate.id} (public: ${duplicate.is_public})`);
                    const { error: deleteError } = await supabase
                        .from('routes')
                        .delete()
                        .eq('id', duplicate.id)
                        .eq('user_id', userId);

                    if (!deleteError) {
                        deletedCount++;
                    } else {
                        console.error('[cleanDuplicateRoutes] Error deleting:', deleteError);
                    }
                }
            }
        }

        console.log(`[cleanDuplicateRoutes] Cleanup complete. Deleted ${deletedCount} duplicates.`);
        return deletedCount;

    } catch (e) {
        console.error('[cleanDuplicateRoutes] CRITICAL FAILURE:', e);
        return 0;
    }
};
