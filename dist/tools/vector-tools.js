/**
 * Vector Tools - MCP Tool Registration
 *
 * Registers 5 new vector-powered tools:
 * - odoo_crm_semantic_search
 * - odoo_crm_find_similar_deals
 * - odoo_crm_discover_patterns
 * - odoo_crm_sync_embeddings
 * - odoo_crm_vector_status
 */
import { SemanticSearchSchema, FindSimilarDealsSchema, DiscoverPatternsSchema, SyncEmbeddingsSchema, VectorStatusSchema, } from '../schemas/index.js';
import { QDRANT_CONFIG, SIMILARITY_THRESHOLDS, CRM_FIELDS } from '../constants.js';
import { embed, isEmbeddingServiceAvailable } from '../services/embedding-service.js';
import { search, getPoint, getCircuitBreakerState } from '../services/vector-client.js';
import { fullSync, incrementalSync, syncRecord, getVectorStatus, isSyncInProgress } from '../services/sync-service.js';
import { discoverPatterns } from '../services/clustering-service.js';
import { useClient } from '../services/odoo-pool.js';
import { formatSemanticSearchResults, formatSimilarDeals, formatPatternDiscovery, formatSyncResult, formatVectorStatus, } from '../services/formatters.js';
import { isMemoryRecording, captureInteraction } from '../services/memory-service.js';
// Error message templates
const ERROR_TEMPLATES = {
    QDRANT_UNAVAILABLE: (retrySeconds) => `**Semantic Search Unavailable**

The vector database is temporarily unreachable. This can happen if:
- Qdrant service is restarting
- Network connectivity issue

**Alternative**: Use \`odoo_crm_search_leads\` with the \`query\` parameter for keyword-based search.

${retrySeconds ? `Retry in: ${retrySeconds}s` : ''}`,
    NO_EMBEDDINGS: (recordCount) => `**No Embeddings Found**

Vector search requires embeddings to be generated first.

**Action Required**: Run \`odoo_crm_sync_embeddings\` with action="full_rebuild" to generate embeddings for your CRM data.

Estimated time: ~5 minutes for ${recordCount} opportunities.`,
    VOYAGE_ERROR: (message) => `**Embedding Service Error**

Unable to generate search embedding. API error: ${message}

**Fallback**: Try again in a few minutes, or use \`odoo_crm_search_leads\` for keyword search.`,
};
/**
 * Register all vector tools with the MCP server.
 */
export function registerVectorTools(server) {
    // Skip if vector features disabled
    if (!QDRANT_CONFIG.ENABLED) {
        console.error('[VectorTools] Vector features disabled - skipping tool registration');
        return;
    }
    // =========================================================================
    // Tool: odoo_crm_semantic_search
    // =========================================================================
    server.tool('odoo_crm_semantic_search', `Semantic search across CRM opportunities using natural language.

    Examples:
    - "Find education projects similar to university jobs"
    - "Large commercial HVAC projects we lost to competitors"
    - "Projects in Victoria with complex installation requirements"

    Returns opportunities ranked by semantic similarity (min 60% match by default).`, SemanticSearchSchema.shape, async (args) => {
        try {
            const input = SemanticSearchSchema.parse(args);
            // Check services
            const cbState = getCircuitBreakerState();
            if (cbState.state === 'OPEN') {
                return {
                    content: [{ type: 'text', text: ERROR_TEMPLATES.QDRANT_UNAVAILABLE(cbState.secondsUntilRetry) }],
                };
            }
            if (!isEmbeddingServiceAvailable()) {
                return {
                    content: [{ type: 'text', text: ERROR_TEMPLATES.VOYAGE_ERROR('Service not initialized') }],
                };
            }
            // Generate query embedding
            const queryEmbedding = await embed(input.query, 'query');
            // Build filter
            const filter = {};
            if (input.stage_id)
                filter.stage_id = input.stage_id;
            if (input.user_id)
                filter.user_id = input.user_id;
            if (input.team_id)
                filter.team_id = input.team_id;
            if (input.is_won !== undefined)
                filter.is_won = input.is_won;
            if (input.is_lost !== undefined)
                filter.is_lost = input.is_lost;
            if (input.state_id)
                filter.state_id = input.state_id;
            if (input.sector)
                filter.sector = input.sector;
            if (input.min_revenue || input.max_revenue) {
                const revenueFilter = {};
                if (input.min_revenue)
                    revenueFilter.$gte = input.min_revenue;
                if (input.max_revenue)
                    revenueFilter.$lte = input.max_revenue;
                filter.expected_revenue = revenueFilter;
            }
            // Vector search
            const searchResult = await search({
                vector: queryEmbedding,
                topK: input.limit,
                filter: Object.keys(filter).length > 0 ? filter : undefined,
                minScore: input.min_similarity,
                includeMetadata: true,
            });
            if (searchResult.matches.length === 0) {
                return {
                    content: [{
                            type: 'text',
                            text: `No opportunities found matching "${input.query}" with similarity >= ${Math.round(input.min_similarity * 100)}%.

Try:
- Lowering min_similarity (e.g., 0.5)
- Broadening your query
- Removing filters`,
                        }],
                };
            }
            // Enrich with full Odoo data
            const leadIds = searchResult.matches.map(m => parseInt(m.id));
            const leads = await useClient(async (client) => {
                return client.searchRead('crm.lead', [['id', 'in', leadIds]], CRM_FIELDS.LEAD_DETAIL);
            });
            // Format output
            const output = formatSemanticSearchResults(searchResult.matches, leads, input.query, input.response_format);
            // Auto-capture if memory recording is active
            if (isMemoryRecording()) {
                captureInteraction('odoo_crm_semantic_search', input, output);
            }
            return { content: [{ type: 'text', text: output }] };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    }],
            };
        }
    });
    // =========================================================================
    // Tool: odoo_crm_find_similar_deals
    // =========================================================================
    server.tool('odoo_crm_find_similar_deals', `Find opportunities similar to a reference deal.

    Use cases:
    - Proposal preparation (find similar won deals)
    - Pattern analysis (find similar lost deals)
    - Relationship discovery`, FindSimilarDealsSchema.shape, async (args) => {
        try {
            const input = FindSimilarDealsSchema.parse(args);
            // Get reference deal embedding
            const refPoint = await getPoint(String(input.lead_id));
            if (!refPoint) {
                return {
                    content: [{
                            type: 'text',
                            text: `Lead ID ${input.lead_id} not found in vector database. Run sync first.`,
                        }],
                };
            }
            // Build filter for outcomes
            const outcomeFilter = {};
            if (!input.include_outcomes.includes('won'))
                outcomeFilter.is_won = false;
            if (!input.include_outcomes.includes('lost'))
                outcomeFilter.is_lost = false;
            if (!input.include_outcomes.includes('active'))
                outcomeFilter.is_active = false;
            // Search for similar
            const searchResult = await search({
                vector: refPoint.values,
                topK: input.limit + 1, // +1 to exclude self
                filter: Object.keys(outcomeFilter).length > 0 ? outcomeFilter : undefined,
                minScore: SIMILARITY_THRESHOLDS.LOOSELY_RELATED,
                includeMetadata: true,
            });
            // Exclude self
            const matches = searchResult.matches.filter(m => m.id !== String(input.lead_id));
            // Get full lead data
            const leadIds = matches.map(m => parseInt(m.id));
            const leads = await useClient(async (client) => {
                return client.searchRead('crm.lead', [['id', 'in', leadIds]], CRM_FIELDS.LEAD_DETAIL);
            });
            const output = formatSimilarDeals(matches, leads, refPoint.metadata, input.response_format);
            // Auto-capture if memory recording is active
            if (isMemoryRecording()) {
                captureInteraction('odoo_crm_find_similar_deals', input, output);
            }
            return { content: [{ type: 'text', text: output }] };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    }],
            };
        }
    });
    // =========================================================================
    // Tool: odoo_crm_discover_patterns
    // =========================================================================
    server.tool('odoo_crm_discover_patterns', `Discover patterns in CRM data using clustering analysis.

    Analysis types:
    - lost_reasons: Patterns in lost opportunities
    - winning_factors: Patterns in won opportunities
    - deal_segments: Segment all opportunities
    - objection_themes: Group by objection patterns`, DiscoverPatternsSchema.shape, async (args) => {
        try {
            const input = DiscoverPatternsSchema.parse(args);
            const result = await discoverPatterns(input.analysis_type, {
                sector: input.sector,
                min_revenue: input.min_revenue,
            }, input.num_clusters);
            const output = formatPatternDiscovery(result, input.response_format);
            // Auto-capture if memory recording is active
            if (isMemoryRecording()) {
                captureInteraction('odoo_crm_discover_patterns', input, output);
            }
            return { content: [{ type: 'text', text: output }] };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    }],
            };
        }
    });
    // =========================================================================
    // Tool: odoo_crm_sync_embeddings
    // =========================================================================
    server.tool('odoo_crm_sync_embeddings', `Manage vector database synchronization.

    Actions:
    - status: Check sync state
    - sync_new: Sync changed records since last sync
    - full_rebuild: Rebuild entire index (~5 min for 6K records)
    - sync_record: Sync a specific record by ID`, SyncEmbeddingsSchema.shape, async (args) => {
        try {
            const input = SyncEmbeddingsSchema.parse(args);
            if (input.action === 'status') {
                const status = await getVectorStatus();
                return {
                    content: [{ type: 'text', text: formatVectorStatus(status) }],
                };
            }
            if (isSyncInProgress()) {
                return {
                    content: [{ type: 'text', text: 'Sync already in progress. Please wait.' }],
                };
            }
            let result;
            if (input.action === 'full_rebuild') {
                result = await fullSync((progress) => {
                    console.error(`[Sync] ${progress.phase}: ${progress.percentComplete}%`);
                });
            }
            else if (input.action === 'sync_new') {
                result = await incrementalSync();
            }
            else if (input.action === 'sync_record') {
                if (!input.lead_id) {
                    return {
                        content: [{ type: 'text', text: 'lead_id required for sync_record action' }],
                    };
                }
                result = await syncRecord(input.lead_id);
            }
            const output = formatSyncResult(result);
            // Auto-capture if memory recording is active
            if (isMemoryRecording()) {
                captureInteraction('odoo_crm_sync_embeddings', input, output);
            }
            return {
                content: [{ type: 'text', text: output }],
            };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    }],
            };
        }
    });
    // =========================================================================
    // Tool: odoo_crm_vector_status
    // =========================================================================
    server.tool('odoo_crm_vector_status', `Health check for vector infrastructure.

    Returns connection status, vector count, sync state, and circuit breaker status.`, VectorStatusSchema.shape, async (args) => {
        try {
            const input = VectorStatusSchema.parse(args);
            const status = await getVectorStatus();
            const output = formatVectorStatus(status);
            // Auto-capture if memory recording is active
            if (isMemoryRecording()) {
                captureInteraction('odoo_crm_vector_status', input, output);
            }
            return { content: [{ type: 'text', text: output }] };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    }],
            };
        }
    });
    console.error('[VectorTools] 5 vector tools registered');
}
//# sourceMappingURL=vector-tools.js.map