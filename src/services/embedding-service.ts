/**
 * Embedding Service - Voyage AI Integration
 *
 * Generates embeddings for CRM records using Voyage AI's voyage-3-lite model.
 * Supports single and batch embedding with input_type optimization.
 */

import { VoyageAIClient } from 'voyageai';
import { VOYAGE_CONFIG } from '../constants.js';
import { CrmLead } from '../types.js';
import { stripHtml } from '../utils/html-utils.js';
import { getRelationName } from './formatters.js';

// Singleton client
let voyageClient: VoyageAIClient | null = null;

/**
 * Initialize the Voyage AI client.
 * Call this on server startup.
 */
export function initializeEmbeddingService(): VoyageAIClient | null {
  const apiKey = VOYAGE_CONFIG.API_KEY;

  if (!apiKey) {
    console.error('[Embedding] VOYAGE_API_KEY not set - embedding service disabled');
    return null;
  }

  try {
    voyageClient = new VoyageAIClient({ apiKey });
    console.error('[Embedding] Voyage AI service initialized');
    return voyageClient;
  } catch (error) {
    console.error('[Embedding] Failed to initialize:', error);
    return null;
  }
}

/**
 * Get the Voyage client instance.
 */
export function getEmbeddingClient(): VoyageAIClient | null {
  return voyageClient;
}

/**
 * Check if embedding service is available.
 */
export function isEmbeddingServiceAvailable(): boolean {
  return voyageClient !== null;
}

/**
 * Truncate text to maximum word count.
 * Returns { text, truncated } tuple.
 */
function truncateText(text: string, maxWords: number): { text: string; truncated: boolean } {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) {
    return { text, truncated: false };
  }
  return {
    text: words.slice(0, maxWords).join(' ') + '...',
    truncated: true,
  };
}

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
export function buildEmbeddingText(lead: CrmLead): { text: string; truncated: boolean } {
  const parts: string[] = [];

  // Core identity
  parts.push(`Opportunity: ${lead.name || 'Untitled'}`);

  // Customer info
  const customerParts: string[] = [];
  if (lead.contact_name) customerParts.push(`Customer: ${lead.contact_name}`);
  if (lead.sector) customerParts.push(`Sector: ${lead.sector}`);
  if (customerParts.length > 0) parts.push(customerParts.join(' | '));

  // Location
  const city = lead.city || '';
  const state = lead.state_id ? getRelationName(lead.state_id) : '';
  if (city || state) {
    parts.push(`Location: ${[city, state].filter(Boolean).join(', ')}`);
  }

  // Classification
  if (lead.specification_id) {
    parts.push(`Specification: ${getRelationName(lead.specification_id)}`);
  }
  if (lead.lead_source_id) {
    parts.push(`Lead Source: ${getRelationName(lead.lead_source_id)}`);
  }

  // Business metrics
  const revenue = lead.expected_revenue
    ? `$${lead.expected_revenue.toLocaleString()}`
    : 'Not specified';
  const stage = lead.stage_id ? getRelationName(lead.stage_id) : 'Unknown';
  parts.push(`Revenue: ${revenue} | Stage: ${stage}`);

  // Status
  const isWon = lead.stage_id && typeof lead.stage_id !== 'number' &&
                lead.stage_id[1]?.toLowerCase().includes('won');
  const isLost = !!lead.lost_reason_id;

  let status = 'Active';
  if (isWon) {
    status = 'Won';
  } else if (isLost) {
    const lostReason = getRelationName(lead.lost_reason_id);
    status = `Lost - ${lostReason}`;
  }
  parts.push(`Status: ${status}`);

  // Description (most semantic content)
  let truncated = false;
  if (lead.description) {
    const cleanDesc = stripHtml(lead.description);
    const result = truncateText(cleanDesc, VOYAGE_CONFIG.MAX_WORDS);
    truncated = result.truncated;
    parts.push(`Description: ${result.text}`);
  }

  return {
    text: parts.join('\n'),
    truncated,
  };
}

/**
 * Generate embedding for a single text.
 *
 * @param text - The text to embed
 * @param inputType - "document" for CRM records, "query" for search queries
 * @returns 512-dimensional embedding vector (voyage-3-lite)
 */
export async function embed(
  text: string,
  inputType: 'document' | 'query' = 'document'
): Promise<number[]> {
  if (!voyageClient) {
    throw new Error('Embedding service not initialized. Call initializeEmbeddingService() first.');
  }

  const response = await voyageClient.embed({
    input: text,
    model: VOYAGE_CONFIG.MODEL,
    inputType: inputType,
    outputDimension: VOYAGE_CONFIG.DIMENSIONS,
  });

  // Voyage returns embeddings in response.data[0].embedding
  if (!response.data || !response.data[0] || !response.data[0].embedding) {
    throw new Error('Invalid embedding response from Voyage AI');
  }
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batches.
 * More efficient than calling embed() repeatedly.
 *
 * @param texts - Array of texts to embed
 * @param inputType - "document" for CRM records, "query" for search queries
 * @param onProgress - Optional progress callback
 * @returns Array of embedding vectors (same order as input)
 */
export async function embedBatch(
  texts: string[],
  inputType: 'document' | 'query' = 'document',
  onProgress?: (current: number, total: number) => void
): Promise<number[][]> {
  if (!voyageClient) {
    throw new Error('Embedding service not initialized');
  }

  const results: number[][] = [];
  const batchSize = VOYAGE_CONFIG.MAX_BATCH_SIZE;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await voyageClient.embed({
      input: batch,
      model: VOYAGE_CONFIG.MODEL,
      inputType: inputType,
      outputDimension: VOYAGE_CONFIG.DIMENSIONS,
    });

    if (!response.data) {
      throw new Error('Invalid batch embedding response from Voyage AI');
    }

    for (const item of response.data) {
      if (!item.embedding) {
        throw new Error('Missing embedding in batch response');
      }
      results.push(item.embedding);
    }

    if (onProgress) {
      onProgress(Math.min(i + batchSize, texts.length), texts.length);
    }
  }

  return results;
}

/**
 * Estimate token count for cost planning.
 * Rough estimate: ~4 characters per token for English.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Health check for embedding service.
 */
export async function checkEmbeddingHealth(): Promise<{
  available: boolean;
  model: string;
  dimensions: number;
  error?: string;
}> {
  if (!voyageClient) {
    return {
      available: false,
      model: VOYAGE_CONFIG.MODEL,
      dimensions: VOYAGE_CONFIG.DIMENSIONS,
      error: 'Voyage client not initialized',
    };
  }

  try {
    // Small test embedding
    const testVec = await embed('test', 'query');
    return {
      available: true,
      model: VOYAGE_CONFIG.MODEL,
      dimensions: testVec.length,
    };
  } catch (error) {
    return {
      available: false,
      model: VOYAGE_CONFIG.MODEL,
      dimensions: VOYAGE_CONFIG.DIMENSIONS,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
