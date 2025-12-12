/**
 * Embedding Service - Voyage AI Integration
 *
 * Generates embeddings for CRM records using Voyage AI's voyage-3-lite model.
 * Supports single and batch embedding with input_type optimization.
 */
import { VoyageAIClient } from 'voyageai';
import { CrmLead } from '../types.js';
/**
 * Initialize the Voyage AI client.
 * Call this on server startup.
 */
export declare function initializeEmbeddingService(): VoyageAIClient | null;
/**
 * Get the Voyage client instance.
 */
export declare function getEmbeddingClient(): VoyageAIClient | null;
/**
 * Check if embedding service is available.
 */
export declare function isEmbeddingServiceAvailable(): boolean;
/**
 * Build embedding document text from CRM lead.
 * Combines multiple fields into a semantic document.
 *
 * Format:
 * ```
 * Opportunity: {name}
 * Customer: {contact_name} | Sector: {sector}
 * Location: {city}, {state}
 * Specification: {specification_name}
 * Lead Source: {lead_source_name}
 * Revenue: ${expected_revenue} | Stage: {stage_name}
 * Status: Won/Lost/Active {lost_reason if applicable}
 * Description: {description}
 * ```
 */
export declare function buildEmbeddingText(lead: CrmLead): {
    text: string;
    truncated: boolean;
};
/**
 * Generate embedding for a single text.
 *
 * @param text - The text to embed
 * @param inputType - "document" for CRM records, "query" for search queries
 * @returns 512-dimensional embedding vector (voyage-3-lite)
 */
export declare function embed(text: string, inputType?: 'document' | 'query'): Promise<number[]>;
/**
 * Generate embeddings for multiple texts in batches.
 * More efficient than calling embed() repeatedly.
 *
 * @param texts - Array of texts to embed
 * @param inputType - "document" for CRM records, "query" for search queries
 * @param onProgress - Optional progress callback
 * @returns Array of embedding vectors (same order as input)
 */
export declare function embedBatch(texts: string[], inputType?: 'document' | 'query', onProgress?: (current: number, total: number) => void): Promise<number[][]>;
/**
 * Estimate token count for cost planning.
 * Rough estimate: ~4 characters per token for English.
 */
export declare function estimateTokens(text: string): number;
/**
 * Health check for embedding service.
 */
export declare function checkEmbeddingHealth(): Promise<{
    available: boolean;
    model: string;
    dimensions: number;
    error?: string;
}>;
//# sourceMappingURL=embedding-service.d.ts.map