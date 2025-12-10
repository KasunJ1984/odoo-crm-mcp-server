/**
 * Simple in-memory cache with TTL (Time To Live)
 * - No external dependencies
 * - Automatic expiration
 * - Type-safe
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private hits: number = 0;    // Count successful cache retrievals
  private misses: number = 0;  // Count failed cache retrievals (missing or expired)

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
   * Set value with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs
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
