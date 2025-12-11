/**
 * Vector Client - Qdrant Integration
 *
 * Wraps Qdrant client with circuit breaker for resilience.
 * Handles collection management, upserts, and similarity search.
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { QDRANT_CONFIG, VECTOR_CIRCUIT_BREAKER_CONFIG } from '../constants.js';
import { VectorRecord, VectorQueryOptions, VectorQueryResult, VectorMetadata, CircuitBreakerState } from '../types.js';

// Singleton client
let qdrantClient: QdrantClient | null = null;

// Circuit breaker state
const circuitBreaker: CircuitBreakerState = {
  state: 'CLOSED',
  failures: 0,
  lastFailure: null,
  lastStateChange: Date.now(),
};

/**
 * Initialize Qdrant client connection.
 */
export function initializeVectorClient(): boolean {
  if (!QDRANT_CONFIG.ENABLED) {
    console.error('[Vector] Vector features disabled (VECTOR_ENABLED=false)');
    return false;
  }

  try {
    const config: { url: string; apiKey?: string } = {
      url: QDRANT_CONFIG.HOST,
    };

    if (QDRANT_CONFIG.API_KEY) {
      config.apiKey = QDRANT_CONFIG.API_KEY;
    }

    qdrantClient = new QdrantClient(config);
    console.error(`[Vector] Connected to Qdrant at ${QDRANT_CONFIG.HOST}`);
    return true;
  } catch (error) {
    console.error('[Vector] Failed to initialize Qdrant client:', error);
    return false;
  }
}

/**
 * Get the Qdrant client instance.
 */
export function getVectorClient(): QdrantClient | null {
  return qdrantClient;
}

/**
 * Get current circuit breaker state.
 */
export function getCircuitBreakerState(): CircuitBreakerState {
  // Check if circuit should transition from OPEN to HALF_OPEN
  if (circuitBreaker.state === 'OPEN' && circuitBreaker.lastFailure) {
    const elapsed = Date.now() - circuitBreaker.lastFailure;
    if (elapsed >= VECTOR_CIRCUIT_BREAKER_CONFIG.RESET_TIMEOUT_MS) {
      circuitBreaker.state = 'HALF_OPEN';
      circuitBreaker.lastStateChange = Date.now();
      console.error('[Vector] Circuit breaker: OPEN -> HALF_OPEN');
    }
  }

  return {
    ...circuitBreaker,
    secondsUntilRetry: circuitBreaker.state === 'OPEN' && circuitBreaker.lastFailure
      ? Math.max(0, Math.ceil((VECTOR_CIRCUIT_BREAKER_CONFIG.RESET_TIMEOUT_MS - (Date.now() - circuitBreaker.lastFailure)) / 1000))
      : undefined,
  };
}

function recordSuccess(): void {
  if (circuitBreaker.state === 'HALF_OPEN') {
    circuitBreaker.state = 'CLOSED';
    circuitBreaker.failures = 0;
    circuitBreaker.lastStateChange = Date.now();
    console.error('[Vector] Circuit breaker: HALF_OPEN -> CLOSED');
  }
  circuitBreaker.failures = 0;
}

function recordFailure(): void {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();

  if (circuitBreaker.failures >= VECTOR_CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD) {
    circuitBreaker.state = 'OPEN';
    circuitBreaker.lastStateChange = Date.now();
    console.error(`[Vector] Circuit breaker: -> OPEN (${circuitBreaker.failures} failures)`);
  }
}

async function executeWithCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
  const state = getCircuitBreakerState();

  if (state.state === 'OPEN') {
    throw new Error(`Vector service unavailable. Retry in ${state.secondsUntilRetry}s`);
  }

  try {
    const result = await operation();
    recordSuccess();
    return result;
  } catch (error) {
    recordFailure();
    throw error;
  }
}

/**
 * Ensure collection exists with proper configuration.
 * Creates indexes BEFORE any data is uploaded (per Qdrant best practices).
 */
export async function ensureCollection(): Promise<boolean> {
  if (!qdrantClient) {
    throw new Error('Vector client not initialized');
  }

  return executeWithCircuitBreaker(async () => {
    const collections = await qdrantClient!.getCollections();
    const exists = collections.collections.some(c => c.name === QDRANT_CONFIG.COLLECTION_NAME);

    if (!exists) {
      console.error(`[Vector] Creating collection: ${QDRANT_CONFIG.COLLECTION_NAME}`);

      // Create collection with HNSW config
      await qdrantClient!.createCollection(QDRANT_CONFIG.COLLECTION_NAME, {
        vectors: {
          size: QDRANT_CONFIG.VECTOR_SIZE,
          distance: QDRANT_CONFIG.DISTANCE_METRIC,
        },
        hnsw_config: {
          m: QDRANT_CONFIG.HNSW_M,
          ef_construct: QDRANT_CONFIG.HNSW_EF_CONSTRUCT,
        },
      });

      // Create payload indexes BEFORE data upload
      console.error('[Vector] Creating payload indexes...');
      for (const index of QDRANT_CONFIG.PAYLOAD_INDEXES) {
        await qdrantClient!.createPayloadIndex(QDRANT_CONFIG.COLLECTION_NAME, {
          field_name: index.field,
          field_schema: index.type,
        });
      }

      console.error('[Vector] Collection and indexes created successfully');
    }

    return true;
  });
}

/**
 * Get collection statistics.
 */
export async function getCollectionInfo(): Promise<{
  vectorCount: number;
  indexedVectorCount: number;
  segmentsCount: number;
  status: string;
}> {
  if (!qdrantClient) {
    throw new Error('Vector client not initialized');
  }

  return executeWithCircuitBreaker(async () => {
    const info = await qdrantClient!.getCollection(QDRANT_CONFIG.COLLECTION_NAME);
    return {
      vectorCount: info.points_count || 0,
      indexedVectorCount: info.indexed_vectors_count || 0,
      segmentsCount: info.segments_count || 0,
      status: info.status,
    };
  });
}

/**
 * Upsert vectors into collection.
 */
export async function upsertPoints(records: VectorRecord[]): Promise<{ upsertedCount: number }> {
  if (!qdrantClient) {
    throw new Error('Vector client not initialized');
  }

  return executeWithCircuitBreaker(async () => {
    const points = records.map(r => ({
      id: r.id,
      vector: r.values,
      payload: r.metadata as unknown as Record<string, unknown>,
    }));

    await qdrantClient!.upsert(QDRANT_CONFIG.COLLECTION_NAME, {
      wait: true,
      points,
    });

    return { upsertedCount: points.length };
  });
}

/**
 * Delete vectors by IDs.
 */
export async function deletePoints(ids: string[]): Promise<void> {
  if (!qdrantClient) {
    throw new Error('Vector client not initialized');
  }

  return executeWithCircuitBreaker(async () => {
    await qdrantClient!.delete(QDRANT_CONFIG.COLLECTION_NAME, {
      wait: true,
      points: ids,
    });
  });
}

/**
 * Get a single point by ID.
 */
export async function getPoint(id: string): Promise<VectorRecord | null> {
  if (!qdrantClient) {
    throw new Error('Vector client not initialized');
  }

  return executeWithCircuitBreaker(async () => {
    const result = await qdrantClient!.retrieve(QDRANT_CONFIG.COLLECTION_NAME, {
      ids: [id],
      with_vector: true,
      with_payload: true,
    });

    if (result.length === 0) return null;

    const point = result[0];
    return {
      id: String(point.id),
      values: point.vector as number[],
      metadata: point.payload as unknown as VectorMetadata,
    };
  });
}

/**
 * Build Qdrant filter from VectorFilter.
 */
function buildQdrantFilter(filter: VectorQueryOptions['filter']): object | undefined {
  if (!filter) return undefined;

  const must: object[] = [];

  // Simple equality filters
  if (filter.stage_id !== undefined) {
    if (typeof filter.stage_id === 'number') {
      must.push({ key: 'stage_id', match: { value: filter.stage_id } });
    } else if (filter.stage_id.$in) {
      must.push({ key: 'stage_id', match: { any: filter.stage_id.$in } });
    }
  }

  if (filter.user_id !== undefined) {
    if (typeof filter.user_id === 'number') {
      must.push({ key: 'user_id', match: { value: filter.user_id } });
    } else if (filter.user_id.$in) {
      must.push({ key: 'user_id', match: { any: filter.user_id.$in } });
    }
  }

  if (filter.team_id !== undefined) {
    must.push({ key: 'team_id', match: { value: filter.team_id } });
  }

  if (filter.is_won !== undefined) {
    must.push({ key: 'is_won', match: { value: filter.is_won } });
  }

  if (filter.is_lost !== undefined) {
    must.push({ key: 'is_lost', match: { value: filter.is_lost } });
  }

  if (filter.is_active !== undefined) {
    must.push({ key: 'is_active', match: { value: filter.is_active } });
  }

  if (filter.state_id !== undefined) {
    must.push({ key: 'state_id', match: { value: filter.state_id } });
  }

  if (filter.sector !== undefined) {
    must.push({ key: 'sector', match: { value: filter.sector } });
  }

  if (filter.lost_reason_id !== undefined) {
    must.push({ key: 'lost_reason_id', match: { value: filter.lost_reason_id } });
  }

  // Range filters
  if (filter.expected_revenue) {
    const range: { gte?: number; lte?: number } = {};
    if (filter.expected_revenue.$gte) range.gte = filter.expected_revenue.$gte;
    if (filter.expected_revenue.$lte) range.lte = filter.expected_revenue.$lte;
    must.push({ key: 'expected_revenue', range });
  }

  if (must.length === 0) return undefined;

  return { must };
}

/**
 * Search for similar vectors.
 */
export async function search(options: VectorQueryOptions): Promise<VectorQueryResult> {
  if (!qdrantClient) {
    throw new Error('Vector client not initialized');
  }

  return executeWithCircuitBreaker(async () => {
    const startTime = Date.now();

    const result = await qdrantClient!.search(QDRANT_CONFIG.COLLECTION_NAME, {
      vector: options.vector,
      limit: options.topK,
      filter: buildQdrantFilter(options.filter),
      score_threshold: options.minScore,
      with_payload: options.includeMetadata ?? true,
    });

    return {
      matches: result.map(m => ({
        id: String(m.id),
        score: m.score,
        metadata: m.payload as unknown as VectorMetadata | undefined,
      })),
      searchTimeMs: Date.now() - startTime,
    };
  });
}

/**
 * Search within a specific set of IDs.
 */
export async function searchWithinIds(
  vector: number[],
  ids: string[],
  topK: number,
  minScore?: number
): Promise<VectorQueryResult> {
  if (!qdrantClient) {
    throw new Error('Vector client not initialized');
  }

  return executeWithCircuitBreaker(async () => {
    const startTime = Date.now();

    const result = await qdrantClient!.search(QDRANT_CONFIG.COLLECTION_NAME, {
      vector,
      limit: topK,
      filter: {
        must: [{ has_id: ids }],
      },
      score_threshold: minScore,
      with_payload: true,
    });

    return {
      matches: result.map(m => ({
        id: String(m.id),
        score: m.score,
        metadata: m.payload as unknown as VectorMetadata | undefined,
      })),
      searchTimeMs: Date.now() - startTime,
    };
  });
}

/**
 * Health check for vector service.
 */
export async function healthCheck(): Promise<{
  connected: boolean;
  collectionName: string;
  vectorCount: number;
  circuitBreakerState: string;
  error?: string;
}> {
  const cbState = getCircuitBreakerState();

  if (!qdrantClient) {
    return {
      connected: false,
      collectionName: QDRANT_CONFIG.COLLECTION_NAME,
      vectorCount: 0,
      circuitBreakerState: cbState.state,
      error: 'Client not initialized',
    };
  }

  try {
    const info = await getCollectionInfo();
    return {
      connected: true,
      collectionName: QDRANT_CONFIG.COLLECTION_NAME,
      vectorCount: info.vectorCount,
      circuitBreakerState: cbState.state,
    };
  } catch (error) {
    return {
      connected: false,
      collectionName: QDRANT_CONFIG.COLLECTION_NAME,
      vectorCount: 0,
      circuitBreakerState: cbState.state,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Warm up vector client on startup.
 */
export async function warmVectorClient(): Promise<void> {
  if (!QDRANT_CONFIG.ENABLED) {
    console.error('[Vector] Vector features disabled');
    return;
  }

  const initialized = initializeVectorClient();
  if (!initialized) return;

  try {
    await ensureCollection();
    const info = await getCollectionInfo();
    console.error(`[Vector] Collection ready: ${info.vectorCount} vectors`);
  } catch (error) {
    console.error('[Vector] Warm-up failed:', error);
  }
}
