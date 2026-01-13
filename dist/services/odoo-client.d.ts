import type { OdooConfig, OdooRecord, ExportProgress, CrmStage, CrmLostReason, CrmTeam, ResUsers, ResCountryState } from '../types.js';
import { CircuitBreaker, CircuitState, CircuitBreakerMetrics } from '../utils/circuit-breaker.js';
export type ExportProgressCallback = (progress: ExportProgress) => void;
export declare class OdooClient {
    private config;
    private uid;
    private commonClient;
    private objectClient;
    private circuitBreaker;
    /**
     * Create a new OdooClient instance
     * @param config - Odoo connection configuration (url, db, username, password)
     * @param circuitBreaker - Optional external circuit breaker to use.
     *                         If not provided, creates a new one.
     *                         Pass a shared breaker when using connection pooling.
     */
    constructor(config: OdooConfig, circuitBreaker?: CircuitBreaker);
    authenticate(): Promise<number>;
    private _doAuthenticate;
    private execute;
    private _doExecute;
    searchRead<T extends OdooRecord>(model: string, domain?: unknown[], fields?: string[], options?: {
        offset?: number;
        limit?: number;
        order?: string;
    }): Promise<T[]>;
    searchCount(model: string, domain?: unknown[]): Promise<number>;
    read<T extends OdooRecord>(model: string, ids: number[], fields?: string[]): Promise<T[]>;
    readGroup(model: string, domain?: unknown[], fields?: string[], groupby?: string[], options?: {
        offset?: number;
        limit?: number;
        orderby?: string;
        lazy?: boolean;
    }): Promise<Array<Record<string, unknown>>>;
    fieldsGet(model: string, attributes?: string[]): Promise<Record<string, unknown>>;
    /**
     * Fetch records in batches with progress tracking
     * Designed for large exports to avoid timeout issues
     */
    searchReadPaginated<T extends OdooRecord>(model: string, domain: unknown[] | undefined, fields: string[] | undefined, options: {
        maxRecords: number;
        batchSize?: number;
        order?: string;
        onProgress?: ExportProgressCallback;
    }): Promise<{
        records: T[];
        totalFetched: number;
        totalAvailable: number;
    }>;
    /**
     * Search and read with export batch timeout (longer than regular API timeout)
     */
    private searchReadWithTimeout;
    /**
     * Get CRM stages with caching (30 minute TTL)
     * Uses stale-while-revalidate: returns stale data while refreshing in background
     */
    getStagesCached(): Promise<CrmStage[]>;
    /**
     * Get lost reasons with caching (30 minute TTL)
     * Uses stale-while-revalidate: returns stale data while refreshing in background
     */
    getLostReasonsCached(includeInactive?: boolean): Promise<CrmLostReason[]>;
    /**
     * Get sales teams with caching (15 minute TTL)
     * Uses stale-while-revalidate: returns stale data while refreshing in background
     */
    getTeamsCached(): Promise<CrmTeam[]>;
    /**
     * Get salespeople with caching (15 minute TTL)
     * Uses stale-while-revalidate: returns stale data while refreshing in background
     */
    getSalespeopleCached(teamId?: number): Promise<ResUsers[]>;
    /**
     * Get states/territories with caching (1 hour TTL)
     * Uses stale-while-revalidate: returns stale data while refreshing in background
     * @param countryCode - Country code to filter states (default: AU for Australia)
     */
    getStatesCached(countryCode?: string): Promise<ResCountryState[]>;
    /**
     * Invalidate specific cache entries or all cache
     * @param keys - Specific cache keys to invalidate, or undefined to clear all
     */
    invalidateCache(keys?: string[]): Promise<void>;
    /**
     * Get cache statistics for monitoring
     */
    getCacheStats(): Promise<{
        size: number;
        keys: string[];
        metrics: {
            hits: number;
            misses: number;
            hitRate: number;
        };
    }>;
    /**
     * Reset the cached UID to force a fresh authentication test.
     * Used by health check to verify current connectivity.
     */
    resetAuthCache(): void;
    /**
     * Get current circuit breaker state
     * @returns 'CLOSED' (normal), 'OPEN' (failing fast), or 'HALF_OPEN' (testing)
     */
    getCircuitBreakerState(): CircuitState;
    /**
     * Get circuit breaker metrics for monitoring
     */
    getCircuitBreakerMetrics(): CircuitBreakerMetrics;
    /**
     * Manually reset circuit breaker to CLOSED state
     * Use after confirming Odoo is back online
     */
    resetCircuitBreaker(): void;
    /**
     * Pre-populate cache with frequently accessed data.
     * Called on startup to eliminate cold-start latency.
     */
    warmCache(): Promise<{
        success: string[];
        failed: string[];
    }>;
}
export declare function getOdooClient(): OdooClient;
export declare function resetOdooClient(): void;
export declare function warmCache(): Promise<void>;
//# sourceMappingURL=odoo-client.d.ts.map