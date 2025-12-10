/**
 * Simple in-memory cache with TTL (Time To Live)
 * - No external dependencies
 * - Automatic expiration
 * - Type-safe
 */
export declare class MemoryCache {
    private cache;
    private hits;
    private misses;
    private refreshingKeys;
    /**
     * Get cached value if exists and not expired
     */
    get<T>(key: string): T | null;
    /**
     * Get cached data with background refresh when stale.
     * Returns stale data immediately while refreshing in background.
     *
     * @param key - Cache key
     * @param refreshFn - Async function to fetch fresh data
     * @param ttlMs - Time to live in milliseconds
     * @param refreshThresholdPercent - Percentage of TTL after which to trigger background refresh (default: 80)
     */
    getWithRefresh<T>(key: string, refreshFn: () => Promise<T>, ttlMs: number, refreshThresholdPercent?: number): Promise<T>;
    /**
     * Set value with TTL in milliseconds
     */
    set<T>(key: string, data: T, ttlMs: number): void;
    /**
     * Check if key exists and is not expired
     * Note: Does not increment hit/miss counters
     */
    has(key: string): boolean;
    /**
     * Delete specific key
     */
    delete(key: string): boolean;
    /**
     * Clear all cache entries and reset metrics
     */
    clear(): void;
    /**
     * Clear expired entries (housekeeping)
     */
    clearExpired(): number;
    /**
     * Get cache stats
     */
    stats(): {
        size: number;
        keys: string[];
    };
    /**
     * Get cache hit/miss metrics
     * @returns Object containing hits, misses, and calculated hitRate (0-100%)
     */
    getMetrics(): {
        hits: number;
        misses: number;
        hitRate: number;
    };
    /**
     * Reset hit/miss counters (useful for testing or periodic reset)
     */
    resetMetrics(): void;
}
export declare const cache: MemoryCache;
export declare const CACHE_TTL: {
    readonly STAGES: number;
    readonly LOST_REASONS: number;
    readonly TEAMS: number;
    readonly SALESPEOPLE: number;
    readonly FIELD_METADATA: number;
};
export declare const CACHE_KEYS: {
    readonly stages: () => string;
    readonly lostReasons: (includeInactive: boolean) => string;
    readonly teams: () => string;
    readonly salespeople: (teamId?: number) => string;
    readonly fieldMetadata: (model: string) => string;
};
//# sourceMappingURL=cache.d.ts.map