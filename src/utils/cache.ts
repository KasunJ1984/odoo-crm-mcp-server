/**
 * In-memory cache with TTL (Time To Live) and LRU eviction
 * - Uses lru-cache for automatic eviction when max size reached
 * - Stale-while-revalidate pattern for background refresh
 * - Type-safe
 */

import { LRUCache } from 'lru-cache';

// Cache configuration
export const CACHE_CONFIG = {
  MAX_SIZE: 500,  // Maximum cache entries before LRU eviction
} as const;

interface CacheEntry<T> {
  data: T;
  createdAt: number;   // When entry was created (for stale-while-revalidate)
  expiresAt: number;   // When entry fully expires
}

export class MemoryCache {
  private cache: LRUCache<string, CacheEntry<unknown>>;
  private hits: number = 0;    // Count successful cache retrievals
  private misses: number = 0;  // Count failed cache retrievals (missing or expired)
  private refreshingKeys: Set<string> = new Set();  // Track keys being refreshed (prevent duplicates)

  constructor() {
    this.cache = new LRUCache({
      max: CACHE_CONFIG.MAX_SIZE,
    });
  }

  /**
   * Get cached value if exists and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;  // Track miss when key not found
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;  // Track miss when data expired
      return null;
    }

    this.hits++;  // Track hit on successful retrieval
    return entry.data as T;
  }

  /**
   * Get cached data with background refresh when stale.
   * Returns stale data immediately while refreshing in background.
   *
   * @param key - Cache key
   * @param refreshFn - Async function to fetch fresh data
   * @param ttlMs - Time to live in milliseconds
   * @param refreshThresholdPercent - Percentage of TTL after which to trigger background refresh (default: 80)
   */
  async getWithRefresh<T>(
    key: string,
    refreshFn: () => Promise<T>,
    ttlMs: number,
    refreshThresholdPercent: number = 80
  ): Promise<T> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
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
            .catch(err => console.error(`Background refresh failed for ${key}:`, err))
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
    this.set(key, freshData, ttlMs);
    return freshData;
  }

  /**
   * Set value with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      createdAt: now,
      expiresAt: now + ttlMs
    });
  }

  /**
   * Check if key exists and is not expired
   * Note: Does not increment hit/miss counters
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries and reset metrics
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Clear expired entries (housekeeping)
   */
  clearExpired(): number {
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
  stats(): { size: number; keys: string[] } {
    // Clean up expired entries first
    this.clearExpired();
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Get cache hit/miss metrics
   * @returns Object containing hits, misses, and calculated hitRate (0-100%)
   */
  getMetrics(): { hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    // Avoid division by zero - if no requests yet, return 0% hit rate
    const hitRate = total > 0 ? Math.round((this.hits / total) * 100) : 0;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate
    };
  }

  /**
   * Reset hit/miss counters (useful for testing or periodic reset)
   */
  resetMetrics(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

// Singleton cache instance
export const cache = new MemoryCache();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  STAGES: 30 * 60 * 1000,        // 30 minutes - stages rarely change
  LOST_REASONS: 30 * 60 * 1000,  // 30 minutes - lost reasons rarely change
  TEAMS: 15 * 60 * 1000,         // 15 minutes - teams change occasionally
  SALESPEOPLE: 15 * 60 * 1000,   // 15 minutes - salespeople change occasionally
  FIELD_METADATA: 60 * 60 * 1000 // 1 hour - for future use
} as const;

// Cache key generators (prevent typos, ensure consistency)
export const CACHE_KEYS = {
  stages: () => 'crm:stages',
  lostReasons: (includeInactive: boolean) => `crm:lost_reasons:${includeInactive}`,
  teams: () => 'crm:teams',
  salespeople: (teamId?: number) => teamId ? `crm:salespeople:team:${teamId}` : 'crm:salespeople:all',
  fieldMetadata: (model: string) => `fields:${model}`
} as const;
