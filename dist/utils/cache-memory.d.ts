/**
 * In-memory cache implementation with LRU eviction
 *
 * Features:
 * - Uses lru-cache for automatic eviction when max size reached
 * - Stale-while-revalidate pattern for background refresh
 * - Type-safe with generics
 * - Implements CacheProvider interface for pluggable cache backends
 *
 * This is the default cache backend. For multi-instance deployments,
 * use RedisCache instead by setting CACHE_TYPE=redis.
 */
import type { CacheProvider, CacheStats, CacheMetrics } from './cache-interface.js';
export declare const CACHE_CONFIG: {
    readonly MAX_SIZE: 500;
};
/**
 * Memory-based cache using LRU eviction
 * Implements CacheProvider interface for compatibility with RedisCache
 */
export declare class MemoryCache implements CacheProvider {
    private cache;
    private hits;
    private misses;
    private refreshingKeys;
    constructor();
    /**
     * Get cached value if exists and not expired
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Store value with TTL in milliseconds
     */
    set<T>(key: string, data: T, ttlMs: number): Promise<void>;
    /**
     * Check if key exists and is not expired
     */
    has(key: string): Promise<boolean>;
    /**
     * Delete specific key
     */
    delete(key: string): Promise<boolean>;
    /**
     * Clear all cache entries and reset metrics
     */
    clear(): Promise<void>;
    /**
     * Get cached data with background refresh when stale (stale-while-revalidate).
     *
     * How it works:
     * 1. Cache empty → fetch and cache
     * 2. Cache fresh (< 80% TTL) → return cached value
     * 3. Cache stale (> 80% TTL but not expired) → return cached value AND refresh in background
     * 4. Cache expired → fetch and cache
     *
     * @param key - Cache key
     * @param refreshFn - Async function to fetch fresh data
     * @param ttlMs - Time to live in milliseconds
     * @param refreshThresholdPercent - Trigger refresh at this % of TTL (default: 80)
     */
    getWithRefresh<T>(key: string, refreshFn: () => Promise<T>, ttlMs: number, refreshThresholdPercent?: number): Promise<T>;
    /**
     * Clear expired entries (housekeeping)
     */
    clearExpired(): number;
    /**
     * Get cache statistics
     */
    stats(): Promise<CacheStats>;
    /**
     * Get cache hit/miss metrics
     */
    getMetrics(): CacheMetrics;
    /**
     * Reset hit/miss counters
     */
    resetMetrics(): void;
}
export declare const CACHE_TTL: {
    readonly STAGES: number;
    readonly LOST_REASONS: number;
    readonly TEAMS: number;
    readonly SALESPEOPLE: number;
    readonly STATES: number;
    readonly FIELD_METADATA: number;
};
export declare const CACHE_KEYS: {
    readonly stages: () => string;
    readonly lostReasons: (includeInactive: boolean) => string;
    readonly teams: () => string;
    readonly salespeople: (teamId?: number) => string;
    readonly states: (countryCode?: string) => string;
    readonly fieldMetadata: (model: string) => string;
};
//# sourceMappingURL=cache-memory.d.ts.map