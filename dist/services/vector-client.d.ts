/**
 * Vector Client - Qdrant Integration
 *
 * Wraps Qdrant client with circuit breaker for resilience.
 * Handles collection management, upserts, and similarity search.
 */
import { QdrantClient } from '@qdrant/js-client-rest';
import { VectorRecord, VectorQueryOptions, VectorQueryResult, CircuitBreakerState } from '../types.js';
/**
 * Initialize Qdrant client connection.
 */
export declare function initializeVectorClient(): boolean;
/**
 * Get the Qdrant client instance.
 */
export declare function getVectorClient(): QdrantClient | null;
/**
 * Get current circuit breaker state.
 */
export declare function getCircuitBreakerState(): CircuitBreakerState;
/**
 * Ensure collection exists with proper configuration.
 * Creates indexes BEFORE any data is uploaded (per Qdrant best practices).
 */
export declare function ensureCollection(): Promise<boolean>;
/**
 * Get collection statistics.
 */
export declare function getCollectionInfo(): Promise<{
    vectorCount: number;
    indexedVectorCount: number;
    segmentsCount: number;
    status: string;
}>;
/**
 * Upsert vectors into collection.
 */
export declare function upsertPoints(records: VectorRecord[]): Promise<{
    upsertedCount: number;
}>;
/**
 * Delete vectors by IDs.
 */
export declare function deletePoints(ids: string[]): Promise<void>;
/**
 * Get a single point by ID.
 */
export declare function getPoint(id: string): Promise<VectorRecord | null>;
/**
 * Search for similar vectors.
 */
export declare function search(options: VectorQueryOptions): Promise<VectorQueryResult>;
/**
 * Search within a specific set of IDs.
 */
export declare function searchWithinIds(vector: number[], ids: string[], topK: number, minScore?: number): Promise<VectorQueryResult>;
/**
 * Health check for vector service.
 */
export declare function healthCheck(): Promise<{
    connected: boolean;
    collectionName: string;
    vectorCount: number;
    circuitBreakerState: string;
    error?: string;
}>;
/**
 * Warm up vector client on startup.
 */
export declare function warmVectorClient(): Promise<void>;
//# sourceMappingURL=vector-client.d.ts.map