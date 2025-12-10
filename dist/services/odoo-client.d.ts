import type { OdooConfig, OdooRecord, ExportProgress, CrmStage, CrmLostReason, CrmTeam, ResUsers } from '../types.js';
export type ExportProgressCallback = (progress: ExportProgress) => void;
export declare class OdooClient {
    private config;
    private uid;
    private commonClient;
    private objectClient;
    constructor(config: OdooConfig);
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
     * Stages rarely change, so caching significantly reduces API calls
     */
    getStagesCached(): Promise<CrmStage[]>;
    /**
     * Get lost reasons with caching (30 minute TTL)
     * Lost reasons rarely change, so caching significantly reduces API calls
     */
    getLostReasonsCached(includeInactive?: boolean): Promise<CrmLostReason[]>;
    /**
     * Get sales teams with caching (15 minute TTL)
     * Teams change occasionally, so shorter cache duration
     */
    getTeamsCached(): Promise<CrmTeam[]>;
    /**
     * Get salespeople with caching (15 minute TTL)
     * User list changes occasionally, so shorter cache duration
     */
    getSalespeopleCached(teamId?: number): Promise<ResUsers[]>;
    /**
     * Invalidate specific cache entries or all cache
     * @param keys - Specific cache keys to invalidate, or undefined to clear all
     */
    invalidateCache(keys?: string[]): void;
    /**
     * Get cache statistics for monitoring
     */
    getCacheStats(): {
        size: number;
        keys: string[];
    };
}
export declare function getOdooClient(): OdooClient;
export declare function resetOdooClient(): void;
//# sourceMappingURL=odoo-client.d.ts.map