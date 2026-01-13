/**
 * Memory Client - Qdrant wrapper for conversation_memory collection
 *
 * This service manages the vector database operations for conversational memory.
 * It follows the pattern of vector-client.ts but for memory storage.
 *
 * Key features:
 * - Separate collection from CRM vectors
 * - Session-based message storage
 * - Multi-user isolation via user_id filtering
 */
import { QdrantClient } from '@qdrant/js-client-rest';
import { MemoryMetadata, MemoryQueryOptions, MemoryQueryResult, MemoryHealthStatus } from '../types.js';
/**
 * Initialize the Qdrant client for memory operations.
 * Uses the same connection as CRM vectors but different collection.
 */
export declare function initializeMemoryClient(): boolean;
/**
 * Get the memory client instance.
 */
export declare function getMemoryClient(): QdrantClient | null;
/**
 * Ensure the conversation_memory collection exists with proper indexes.
 * Creates the collection if it doesn't exist.
 */
export declare function ensureMemoryCollection(): Promise<boolean>;
/**
 * Upsert memory records (messages) to the collection.
 */
export declare function upsertMemoryPoints(records: Array<{
    id: string;
    vector: number[];
    metadata: MemoryMetadata;
}>): Promise<{
    upsertedCount: number;
}>;
/**
 * Search memory with semantic similarity and filters.
 * Always filters by user_id for isolation.
 */
export declare function searchMemory(options: MemoryQueryOptions & {
    vector: number[];
}): Promise<MemoryQueryResult>;
/**
 * Retrieve all messages from a specific session.
 * Returns messages sorted by sequence number.
 */
export declare function scrollMemoryBySession(sessionId: string, userId: string): Promise<MemoryMetadata[]>;
/**
 * Get list of saved sessions for a user.
 * Returns first message of each session (sequence_number = 1).
 */
export declare function getSessionList(userId: string, status?: string, limit?: number): Promise<Array<{
    sessionId: string;
    messageCount: number;
    created: string;
    description?: string;
}>>;
/**
 * Delete all messages from a specific session.
 */
export declare function deleteSession(sessionId: string, userId: string): Promise<number>;
/**
 * Check health of memory infrastructure.
 * Returns connection status, collection info, and active session.
 */
export declare function memoryHealthCheck(): Promise<MemoryHealthStatus>;
/**
 * Warm up the memory client.
 * Called during server startup to ensure collection exists.
 */
export declare function warmMemoryClient(): Promise<void>;
//# sourceMappingURL=memory-client.d.ts.map