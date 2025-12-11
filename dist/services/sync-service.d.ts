/**
 * Sync Service - Odoo to Vector Database Synchronization
 *
 * Orchestrates data flow from Odoo CRM to Qdrant vector database.
 * Supports incremental sync and full rebuild with conflict handling.
 */
import { SyncProgress, SyncResult, VectorStatus } from '../types.js';
/**
 * Get last sync timestamp.
 */
export declare function getLastSyncTime(): string | null;
/**
 * Get current sync version.
 */
export declare function getSyncVersion(): number;
/**
 * Check if sync is currently in progress.
 */
export declare function isSyncInProgress(): boolean;
/**
 * Full sync - rebuild entire vector index.
 */
export declare function fullSync(onProgress?: (progress: SyncProgress) => void): Promise<SyncResult>;
/**
 * Incremental sync - only sync changed records.
 */
export declare function incrementalSync(since?: string, onProgress?: (progress: SyncProgress) => void): Promise<SyncResult>;
/**
 * Sync a single record by ID.
 */
export declare function syncRecord(leadId: number): Promise<SyncResult>;
/**
 * Get comprehensive vector status.
 */
export declare function getVectorStatus(): Promise<VectorStatus>;
//# sourceMappingURL=sync-service.d.ts.map