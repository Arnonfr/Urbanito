
/**
 * A generic query cache to deduplicate inflight promises and store results in memory.
 */
class QueryCache {
    private cache = new Map<string, { data: any; timestamp: number }>();
    private inflight = new Map<string, Promise<any>>();
    private ttl: number;

    constructor(ttlMs: number = 300000) { // Default 5 minutes
        this.ttl = ttlMs;
    }

    async fetch<T>(key: string, fetcher: () => Promise<T>, options?: { ttl?: number }): Promise<T> {
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
    }

    clear() {
        this.cache.clear();
        this.inflight.clear();
    }
}

export const globalCache = new QueryCache();
