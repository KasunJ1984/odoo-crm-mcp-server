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

import { Redis } from 'ioredis';
import type { CacheProvider, CacheEntry, CacheStats, CacheMetrics } from './cache-interface.js';
import { REDIS_CONFIG } from '../constants.js';

/**
 * Redis-backed cache implementation
 * Implements CacheProvider interface for pluggable cache backends
 */
export class RedisCache implements CacheProvider {
  private client: Redis;
  private hits: number = 0;
  private misses: number = 0;
  private refreshingKeys: Set<string> = new Set();  // Per-instance tracking
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis(REDIS_CONFIG.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.error('[RedisCache] Max retries reached, giving up');
          return null;  // Stop retrying
        }
        return Math.min(times * 200, 2000);  // Exponential backoff: 200ms, 400ms, 600ms
      },
      lazyConnect: true,  // Don't connect until first command
    });

    // Connection event handlers
    this.client.on('connect', () => {
      this.isConnected = true;
      console.error('[RedisCache] Connected to Redis');
    });

    this.client.on('error', (err: Error) => {
      this.isConnected = false;
      console.error('[RedisCache] Redis error:', err.message);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      console.error('[RedisCache] Redis connection closed');
    });
  }

  /**
   * Add prefix to key for namespace isolation
   */
  private prefixKey(key: string): string {
    return `${REDIS_CONFIG.KEY_PREFIX}${key}`;
  }

  /**
   * Get cached value if exists
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const prefixedKey = this.prefixKey(key);
      const raw = await this.client.get(prefixedKey);

      if (!raw) {
        this.misses++;
        return null;
      }

      // Parse the stored entry
      const entry: CacheEntry<T> = JSON.parse(raw);

      // Check if expired (backup check - Redis TTL should handle this)
      if (Date.now() > entry.expiresAt) {
        await this.client.del(prefixedKey);
        this.misses++;
        return null;
      }

      this.hits++;
      return entry.data;
    } catch (error) {
      console.error('[RedisCache] Get error:', error instanceof Error ? error.message : error);
      this.misses++;
      return null;
    }
  }

  /**
   * Store value with TTL
   */
  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    try {
      const now = Date.now();
      const entry: CacheEntry<T> = {
        data,
        createdAt: now,
        expiresAt: now + ttlMs
      };

      const prefixedKey = this.prefixKey(key);
      await this.client.set(
        prefixedKey,
        JSON.stringify(entry),
        'PX',
        ttlMs  // Set Redis TTL in milliseconds
      );
    } catch (error) {
      console.error('[RedisCache] Set error:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(this.prefixKey(key));
      return exists === 1;
    } catch (error) {
      console.error('[RedisCache] Has error:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * Delete specific key
   */
  async delete(key: string): Promise<boolean> {
    try {
      const deleted = await this.client.del(this.prefixKey(key));
      return deleted === 1;
    } catch (error) {
      console.error('[RedisCache] Delete error:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * Clear all cache entries with our prefix
   */
  async clear(): Promise<void> {
    try {
      const pattern = `${REDIS_CONFIG.KEY_PREFIX}*`;
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(...keys);
      }

      this.hits = 0;
      this.misses = 0;
    } catch (error) {
      console.error('[RedisCache] Clear error:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Get cached data with background refresh when stale (stale-while-revalidate)
   *
   * Note: Uses per-instance tracking for refreshingKeys. In multi-instance
   * deployments, multiple instances might refresh simultaneously. This is
   * acceptable for most use cases. For high-traffic scenarios, consider
   * adding distributed locking with Redis SETNX.
   */
  async getWithRefresh<T>(
    key: string,
    refreshFn: () => Promise<T>,
    ttlMs: number,
    refreshThresholdPercent: number = 80
  ): Promise<T> {
    try {
      const prefixedKey = this.prefixKey(key);
      const raw = await this.client.get(prefixedKey);
      const now = Date.now();

      if (raw) {
        const entry: CacheEntry<T> = JSON.parse(raw);
        const refreshThreshold = entry.createdAt + (ttlMs * refreshThresholdPercent / 100);

        // Still fresh - return cached data
        if (now < refreshThreshold) {
          this.hits++;
          return entry.data;
        }

        // Stale but valid - return stale data, trigger background refresh
        if (now < entry.expiresAt) {
          this.hits++;

          // Prevent duplicate refreshes (per-instance)
          if (!this.refreshingKeys.has(key)) {
            this.refreshingKeys.add(key);
            refreshFn()
              .then(freshData => this.set(key, freshData, ttlMs))
              .catch(err => console.error(`[RedisCache] Background refresh failed for ${key}:`, err))
              .finally(() => this.refreshingKeys.delete(key));
          }

          return entry.data;
        }
      }

      // Cache miss or hard expired - fetch fresh
      this.misses++;
      const freshData = await refreshFn();
      await this.set(key, freshData, ttlMs);
      return freshData;
    } catch (error) {
      // On Redis error, fall back to direct fetch
      console.error('[RedisCache] getWithRefresh error, fetching directly:', error instanceof Error ? error.message : error);
      this.misses++;
      const freshData = await refreshFn();
      // Try to cache it, but don't fail if Redis is down
      this.set(key, freshData, ttlMs).catch(() => {});
      return freshData;
    }
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<CacheStats> {
    try {
      const pattern = `${REDIS_CONFIG.KEY_PREFIX}*`;
      const keys = await this.client.keys(pattern);

      // Remove prefix from keys for display
      const prefixLen = REDIS_CONFIG.KEY_PREFIX.length;
      const cleanKeys = keys.map((k: string) => k.substring(prefixLen));

      return {
        size: keys.length,
        keys: cleanKeys
      };
    } catch (error) {
      console.error('[RedisCache] Stats error:', error instanceof Error ? error.message : error);
      return { size: 0, keys: [] };
    }
  }

  /**
   * Get cache hit/miss metrics (per-instance)
   */
  getMetrics(): CacheMetrics {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? Math.round((this.hits / total) * 100) : 0;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate
    };
  }

  /**
   * Reset hit/miss counters (per-instance)
   */
  resetMetrics(): void {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Gracefully close Redis connection
   */
  async close(): Promise<void> {
    await this.client.quit();
  }
}
