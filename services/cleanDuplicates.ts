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

        // Group routes by normalized city + name (matching App.tsx logic)
        const routeGroups = new Map<string, typeof routes>();

        for (const route of routes) {
            const key = `${normalize(route.city || '')}:${normalize(route.name || '')}`.toLowerCase();
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

                // Priority:
                // 1. Routes with a proper UUID (persistent) over temp IDs (gen- or r-)
                // 2. Private routes over public routes (usually user's own version)
                // 3. Oldest routes over newer ones

                const sortedGroup = [...group].sort((a, b) => {
                    const aIsTemp = a.id.startsWith('gen-') || a.id.startsWith('r-');
                    const bIsTemp = b.id.startsWith('gen-') || b.id.startsWith('r-');
                    if (aIsTemp && !bIsTemp) return 1;
                    if (!aIsTemp && bIsTemp) return -1;

                    if (a.is_public && !b.is_public) return 1;
                    if (!a.is_public && b.is_public) return -1;

                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                });

                const toKeep = sortedGroup[0];
                const toDelete = sortedGroup.slice(1);

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
