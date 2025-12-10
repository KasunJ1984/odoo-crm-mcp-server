/**
 * Simple in-memory cache with TTL (Time To Live)
 * - No external dependencies
 * - Automatic expiration
 * - Type-safe
 */
export declare class MemoryCache {
    private cache;
    /**
     * Get cached value if exists and not expired
     */
    get<T>(key: string): T | null;
    /**
     * Set value with TTL in milliseconds
     */
    set<T>(key: string, data: T, ttlMs: number): void;
    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean;
    /**
     * Delete specific key
     */
    delete(key: string): boolean;
    /**
     * Clear all cache entries
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