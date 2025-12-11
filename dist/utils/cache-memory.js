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
import { LRUCache } from 'lru-cache';
// Cache configuration
export const CACHE_CONFIG = {
    MAX_SIZE: 500, // Maximum cache entries before LRU eviction
};
/**
 * Memory-based cache using LRU eviction
 * Implements CacheProvider interface for compatibility with RedisCache
 */
export class MemoryCache {
    cache;
    hits = 0;
    misses = 0;
    refreshingKeys = new Set();
    constructor() {
        this.cache = new LRUCache({
            max: CACHE_CONFIG.MAX_SIZE,
        });
    }
    /**
     * Get cached value if exists and not expired
     */
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.misses++;
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }
        this.hits++;
        return entry.data;
    }
    /**
     * Store value with TTL in milliseconds
     */
    async set(key, data, ttlMs) {
        const now = Date.now();
        this.cache.set(key, {
            data,
            createdAt: now,
            expiresAt: now + ttlMs
        });
    }
    /**
     * Check if key exists and is not expired
     */
    async has(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Delete specific key
     */
    async delete(key) {
        return this.cache.delete(key);
    }
    /**
     * Clear all cache entries and reset metrics
     */
    async clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }
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
    async getWithRefresh(key, refreshFn, ttlMs, refreshThresholdPercent = 80) {
        const entry = this.cache.get(key);
        const now = Date.now();
        if (entry) {
            const refreshThreshold = entry.createdAt + (ttlMs * refreshThresholdPercent / 100);
            // Still fresh - return cached data
            if (now < refreshThreshold) {
                this.hits++;
                return entry.data;
            }
            // Stale but valid - return stale data, trigger background refresh
            if (now < entry.expiresAt) {
                this.hits++;
                // Prevent duplicate refreshes for same key
                if (!this.refreshingKeys.has(key)) {
                    this.refreshingKeys.add(key);
                    refreshFn()
                        .then(freshData => this.set(key, freshData, ttlMs))
                        .catch(err => console.error(`[MemoryCache] Background refresh failed for ${key}:`, err))
                        .finally(() => this.refreshingKeys.delete(key));
                }
                return entry.data;
            }
            // Hard expired - delete stale entry
            this.cache.delete(key);
        }
        // Cache miss or hard expired - fetch fresh
        this.misses++;
        const freshData = await refreshFn();
        await this.set(key, freshData, ttlMs);
        return freshData;
    }
    /**
     * Clear expired entries (housekeeping)
     */
    clearExpired() {
        const now = Date.now();
        let cleared = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleared++;
            }
        }
        return cleared;
    }
    /**
     * Get cache statistics
     */
    async stats() {
        this.clearExpired();
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
    /**
     * Get cache hit/miss metrics
     */
    getMetrics() {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? Math.round((this.hits / total) * 100) : 0;
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate
        };
    }
    /**
     * Reset hit/miss counters
     */
    resetMetrics() {
        this.hits = 0;
        this.misses = 0;
    }
}
// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
    STAGES: 30 * 60 * 1000, // 30 minutes - stages rarely change
    LOST_REASONS: 30 * 60 * 1000, // 30 minutes - lost reasons rarely change
    TEAMS: 15 * 60 * 1000, // 15 minutes - teams change occasionally
    SALESPEOPLE: 15 * 60 * 1000, // 15 minutes - salespeople change occasionally
    STATES: 60 * 60 * 1000, // 1 hour - states/territories rarely change
    FIELD_METADATA: 60 * 60 * 1000 // 1 hour - for future use
};
// Cache key generators (prevent typos, ensure consistency)
export const CACHE_KEYS = {
    stages: () => 'crm:stages',
    lostReasons: (includeInactive) => `crm:lost_reasons:${includeInactive}`,
    teams: () => 'crm:teams',
    salespeople: (teamId) => teamId ? `crm:salespeople:team:${teamId}` : 'crm:salespeople:all',
    states: (countryCode = 'AU') => `crm:states:${countryCode}`,
    fieldMetadata: (model) => `fields:${model}`
};
//# sourceMappingURL=cache-memory.js.map