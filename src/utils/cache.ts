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
import { MemoryCache, CACHE_TTL, CACHE_KEYS, CACHE_CONFIG } from './cache-memory.js';
import { REDIS_CONFIG } from '../constants.js';

// Singleton cache instance
let cacheInstance: CacheProvider | null = null;

/**
 * Get or create the cache instance based on configuration
 */
function createCache(): CacheProvider {
  if (REDIS_CONFIG.CACHE_TYPE === 'redis') {
    try {
      // Dynamic import to avoid loading ioredis when not needed
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { RedisCache } = require('./cache-redis.js');
      console.error('[Cache] Initializing Redis cache...');
      return new RedisCache();
    } catch (error) {
      console.error('[Cache] Failed to initialize Redis cache, falling back to memory:',
        error instanceof Error ? error.message : error);
      return new MemoryCache();
    }
  }

  console.error('[Cache] Using memory cache');
  return new MemoryCache();
}

/**
 * Get the singleton cache instance
 */
export function getCache(): CacheProvider {
  if (!cacheInstance) {
    cacheInstance = createCache();
  }
  return cacheInstance;
}

/**
 * Reset the cache instance (useful for testing)
 */
export function resetCache(): void {
  cacheInstance = null;
}

// Export singleton for convenient access
export const cache = getCache();

// Re-export TTL constants and key generators for backward compatibility
export { CACHE_TTL, CACHE_KEYS, CACHE_CONFIG };

// Re-export types
export type { CacheProvider, CacheEntry, CacheStats, CacheMetrics } from './cache-interface.js';
