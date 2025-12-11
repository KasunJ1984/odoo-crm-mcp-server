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
export {};
//# sourceMappingURL=cache-interface.js.map