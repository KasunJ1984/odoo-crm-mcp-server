/**
 * Cache Factory - Exports the active cache provider
 *
 * Supports two cache backends:
 * - Memory (default): Fast, single-instance, uses LRU eviction
 * - Redis (optional): Shared cache across multiple instances
 *
 * Configuration via environment variables:
 * - CACHE_TYPE: 'memory' (default) or 'redis'
 * - REDIS_URL: Redis connection URL (default: redis://localhost:6379)
 * - CACHE_KEY_PREFIX: Prefix for Redis keys (default: odoo-crm:)
 *
 * Usage:
 *   import { cache, CACHE_TTL, CACHE_KEYS } from './utils/cache.js';
 *   const data = await cache.get<MyType>('key');
 */
import type { CacheProvider } from './cache-interface.js';
import { CACHE_TTL, CACHE_KEYS, CACHE_CONFIG } from './cache-memory.js';
/**
 * Get the singleton cache instance
 */
export declare function getCache(): CacheProvider;
/**
 * Reset the cache instance (useful for testing)
 */
export declare function resetCache(): void;
export declare const cache: CacheProvider;
export { CACHE_TTL, CACHE_KEYS, CACHE_CONFIG };
export type { CacheProvider, CacheEntry, CacheStats, CacheMetrics } from './cache-interface.js';
//# sourceMappingURL=cache.d.ts.map