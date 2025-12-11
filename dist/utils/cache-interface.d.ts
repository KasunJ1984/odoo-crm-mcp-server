/**
 * Cache Provider Interface
 *
 * Common interface for cache backends (Memory or Redis).
 * All methods return Promises for Redis compatibility.
 *
 * Implementations:
 * - MemoryCache (cache-memory.ts) - Default, uses LRU cache in memory
 * - RedisCache (cache-redis.ts) - Optional, for multi-instance deployments
 */
/**
 * Cache entry structure with TTL metadata
 * Used internally by cache implementations
 */
export interface CacheEntry<T> {
    data: T;
    createdAt: number;
    expiresAt: number;
}
/**
 * Cache statistics returned by stats()
 */
export interface CacheStats {
    size: number;
    keys: string[];
}
/**
 * Cache metrics returned by getMetrics()
 */
export interface CacheMetrics {
    hits: number;
    misses: number;
    hitRate: number;
}
/**
 * Common interface for all cache providers
 */
export interface CacheProvider {
    /**
     * Get a value from cache
     * @returns The cached value or null if not found/expired
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Store a value in cache with TTL
     * @param key - Cache key
     * @param data - Value to store (must be JSON-serializable)
     * @param ttlMs - Time to live in milliseconds
     */
    set<T>(key: string, data: T, ttlMs: number): Promise<void>;
    /**
     * Check if a key exists and is not expired
     */
    has(key: string): Promise<boolean>;
    /**
     * Delete a specific key from cache
     * @returns true if the key existed
     */
    delete(key: string): Promise<boolean>;
    /**
     * Clear all entries from cache
     */
    clear(): Promise<void>;
    /**
     * Get value with automatic background refresh (stale-while-revalidate pattern)
     *
     * How it works:
     * 1. If cache is empty → fetch and cache
     * 2. If cache is fresh → return cached value
     * 3. If cache is stale (past refresh threshold) → return stale value AND refresh in background
     * 4. If cache is expired → fetch and cache
     *
     * @param key - Cache key
     * @param refreshFn - Function to fetch fresh data
     * @param ttlMs - Time to live in milliseconds
     * @param refreshThresholdPercent - Trigger refresh at this % of TTL (default: 80%)
     */
    getWithRefresh<T>(key: string, refreshFn: () => Promise<T>, ttlMs: number, refreshThresholdPercent?: number): Promise<T>;
    /**
     * Get cache statistics (size and keys)
     */
    stats(): Promise<CacheStats>;
    /**
     * Get hit/miss metrics
     */
    getMetrics(): CacheMetrics;
    /**
     * Reset hit/miss counters
     */
    resetMetrics(): void;
}
//# sourceMappingURL=cache-interface.d.ts.map