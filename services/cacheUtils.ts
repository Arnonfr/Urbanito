
/**
 * A generic query cache to deduplicate inflight promises and store results in memory.
 */
class QueryCache {
    private cache = new Map<string, { data: any; timestamp: number }>();
    private inflight = new Map<string, Promise<any>>();
    private ttl: number;
    private storageKeyPrefix: string | null;

    constructor(ttlMs: number = 300000, storageKeyPrefix: string | null = null) { // Default 5 minutes
        this.ttl = ttlMs;
        this.storageKeyPrefix = storageKeyPrefix;

        // Load from storage if available
        if (this.storageKeyPrefix && typeof window !== 'undefined' && window.localStorage) {
            try {
                const stored = localStorage.getItem(this.storageKeyPrefix);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const now = Date.now();
                    // Load only non-expired items
                    Object.entries(parsed).forEach(([key, value]: [string, any]) => {
                        if (now - value.timestamp < this.ttl) {
                            this.cache.set(key, value);
                        }
                    });
                }
            } catch (e) {
                console.warn("[QueryCache] Failed to load from localStorage", e);
            }
        }
    }

    private persist() {
        if (!this.storageKeyPrefix || typeof window === 'undefined' || !window.localStorage) return;
        try {
            const currentCache: Record<string, any> = {};
            this.cache.forEach((val, key) => {
                currentCache[key] = val;
            });
            localStorage.setItem(this.storageKeyPrefix, JSON.stringify(currentCache));
        } catch (e) {
            console.warn("[QueryCache] Failed to persist to localStorage", e);
        }
    }

    async fetch<T>(key: string, fetcher: () => Promise<T>, options?: { ttl?: number; persist?: boolean }): Promise<T> {
        const now = Date.now();
        const currentTtl = options?.ttl ?? this.ttl;

        // 1. Check if we have valid cached data
        const cached = this.cache.get(key);
        if (cached && now - cached.timestamp < currentTtl) {
            return cached.data as T;
        }

        // 2. Check if a request for this key is already in flight
        if (this.inflight.has(key)) {
            return this.inflight.get(key) as Promise<T>;
        }

        // 3. Otherwise, perform the fetch
        const promise = fetcher().then((data) => {
            this.cache.set(key, { data, timestamp: Date.now() });
            this.inflight.delete(key);
            if (options?.persist || this.storageKeyPrefix) {
                this.persist();
            }
            return data;
        }).catch((err) => {
            this.inflight.delete(key);
            throw err;
        });

        this.inflight.set(key, promise);
        return promise;
    }

    invalidate(key: string) {
        this.cache.delete(key);
        this.persist();
    }

    invalidatePattern(pattern: string) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
        this.persist();
    }

    clear() {
        this.cache.clear();
        this.inflight.clear();
        if (this.storageKeyPrefix) {
            localStorage.removeItem(this.storageKeyPrefix);
        }
    }
}

export const globalCache = new QueryCache(300000, 'urbanito_query_cache');
export const cityCache = new QueryCache(3600000 * 2, 'urbanito_city_cache'); // Reduced to 2 hours for better user responsiveness
