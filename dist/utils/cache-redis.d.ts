/**
 * Redis cache implementation for multi-instance deployments
 *
 * Features:
 * - Shared cache across multiple server instances
 * - Uses Redis native TTL for expiration
 * - Stale-while-revalidate pattern (per-instance tracking)
 * - JSON serialization for data storage
 *
 * Enable by setting CACHE_TYPE=redis in environment.
 */
import type { CacheProvider, CacheStats, CacheMetrics } from './cache-interface.js';
/**
 * Redis-backed cache implementation
 * Implements CacheProvider interface for pluggable cache backends
 */
export declare class RedisCache implements CacheProvider {
    private client;
    private hits;
    private misses;
    private refreshingKeys;
    private isConnected;
    constructor();
    /**
     * Add prefix to key for namespace isolation
     */
    private prefixKey;
    /**
     * Get cached value if exists
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Store value with TTL
     */
    set<T>(key: string, data: T, ttlMs: number): Promise<void>;
    /**
     * Check if key exists
     */
    has(key: string): Promise<boolean>;
    /**
     * Delete specific key
     */
    delete(key: string): Promise<boolean>;
    /**
     * Clear all cache entries with our prefix
     */
    clear(): Promise<void>;
    /**
     * Get cached data with background refresh when stale (stale-while-revalidate)
     *
     * Note: Uses per-instance tracking for refreshingKeys. In multi-instance
     * deployments, multiple instances might refresh simultaneously. This is
     * acceptable for most use cases. For high-traffic scenarios, consider
     * adding distributed locking with Redis SETNX.
     */
    getWithRefresh<T>(key: string, refreshFn: () => Promise<T>, ttlMs: number, refreshThresholdPercent?: number): Promise<T>;
    /**
     * Get cache statistics
     */
    stats(): Promise<CacheStats>;
    /**
     * Get cache hit/miss metrics (per-instance)
     */
    getMetrics(): CacheMetrics;
    /**
     * Reset hit/miss counters (per-instance)
     */
    resetMetrics(): void;
    /**
     * Check if Redis is connected
     */
    isReady(): boolean;
    /**
     * Gracefully close Redis connection
     */
    close(): Promise<void>;
}
//# sourceMappingURL=cache-redis.d.ts.map