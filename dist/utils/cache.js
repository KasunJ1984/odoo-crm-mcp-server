/**
 * Simple in-memory cache with TTL (Time To Live)
 * - No external dependencies
 * - Automatic expiration
 * - Type-safe
 */
export class MemoryCache {
    cache = new Map();
    /**
     * Get cached value if exists and not expired
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    /**
     * Set value with TTL in milliseconds
     */
    set(key, data, ttlMs) {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttlMs
        });
    }
    /**
     * Check if key exists and is not expired
     */
    has(key) {
        return this.get(key) !== null;
    }
    /**
     * Delete specific key
     */
    delete(key) {
        return this.cache.delete(key);
    }
    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
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
     * Get cache stats
     */
    stats() {
        // Clean up expired entries first
        this.clearExpired();
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}
// Singleton cache instance
export const cache = new MemoryCache();
// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
    STAGES: 30 * 60 * 1000, // 30 minutes - stages rarely change
    LOST_REASONS: 30 * 60 * 1000, // 30 minutes - lost reasons rarely change
    TEAMS: 15 * 60 * 1000, // 15 minutes - teams change occasionally
    SALESPEOPLE: 15 * 60 * 1000, // 15 minutes - salespeople change occasionally
    FIELD_METADATA: 60 * 60 * 1000 // 1 hour - for future use
};
// Cache key generators (prevent typos, ensure consistency)
export const CACHE_KEYS = {
    stages: () => 'crm:stages',
    lostReasons: (includeInactive) => `crm:lost_reasons:${includeInactive}`,
    teams: () => 'crm:teams',
    salespeople: (teamId) => teamId ? `crm:salespeople:team:${teamId}` : 'crm:salespeople:all',
    fieldMetadata: (model) => `fields:${model}`
};
//# sourceMappingURL=cache.js.map