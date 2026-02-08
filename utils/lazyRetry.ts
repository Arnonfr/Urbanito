import { lazy, ComponentType } from 'react';

export const lazyRetry = <T extends ComponentType<any>>(
    componentImport: () => Promise<{ default: T }>,
    name: string = 'Component'
): React.LazyExoticComponent<T> => {
    return lazy(async () => {
        try {
            return await componentImport();
        } catch (error: any) {
            console.error(`Failed to load ${name}:`, error);

            // Check if it's a chunk load error (network error or 404 returning HTML)
            const isChunkError =
                error.message?.includes('Failed to fetch dynamically imported module') ||
                error.message?.includes('Importing a module script failed') ||
                error.name === 'ChunkLoadError';

            // Check if we already tried to reload for this specific error to avoid infinite loops
            const storageKey = `retry_reload_${name}`;
            const hasRetried = sessionStorage.getItem(storageKey);

            if (isChunkError && !hasRetried) {
                console.warn(`Chunk load error for ${name}. Reloading page to fetch fresh chunks...`);
                sessionStorage.setItem(storageKey, 'true');
                // Force reload to get new index.html with correct hashes
                window.location.reload();
                // Return a promise that never resolves (to keep Suspense fallback shown while reloading)
                return new Promise(() => { });
            }

            // If we already retried or it's a different error, clear the flag and throw
            sessionStorage.removeItem(storageKey);
            throw error;
        }
    });
};
