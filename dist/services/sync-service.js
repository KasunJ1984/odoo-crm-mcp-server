/**
 * Sync Service - Odoo to Vector Database Synchronization
 *
 * Orchestrates data flow from Odoo CRM to Qdrant vector database.
 * Supports incremental sync and full rebuild with conflict handling.
 */
import { VECTOR_SYNC_CONFIG, CRM_FIELDS, QDRANT_CONFIG } from '../constants.js';
import { useClient } from './odoo-pool.js';
import { buildEmbeddingText, embedBatch, isEmbeddingServiceAvailable } from './embedding-service.js';
import { upsertPoints, getCircuitBreakerState, healthCheck } from './vector-client.js';
import { getRelationName } from './formatters.js';
// Sync state
let lastSyncTime = null;
let syncVersion = 0;
let isSyncing = false;
/**
 * Get last sync timestamp.
 */
export function getLastSyncTime() {
    return lastSyncTime;
}
/**
 * Get current sync version.
 */
export function getSyncVersion() {
    return syncVersion;
}
/**
 * Check if sync is currently in progress.
 */
export function isSyncInProgress() {
    return isSyncing;
}
/**
 * Build VectorMetadata from CrmLead.
 */
function buildMetadata(lead, embeddingText, truncated) {
    // Determine if opportunity is won (stage name contains 'won')
    const isWon = !!(lead.stage_id && typeof lead.stage_id !== 'number' &&
        lead.stage_id[1]?.toLowerCase().includes('won'));
    const isLost = !!lead.lost_reason_id;
    return {
        odoo_id: lead.id,
        name: lead.name || 'Untitled',
        stage_id: typeof lead.stage_id === 'number' ? lead.stage_id : (lead.stage_id?.[0] || 0),
        stage_name: getRelationName(lead.stage_id),
        user_id: typeof lead.user_id === 'number' ? lead.user_id : (lead.user_id?.[0] || 0),
        user_name: getRelationName(lead.user_id),
        team_id: typeof lead.team_id === 'number' ? lead.team_id : (lead.team_id?.[0] || undefined),
        team_name: lead.team_id ? getRelationName(lead.team_id) : undefined,
        expected_revenue: lead.expected_revenue || 0,
        probability: lead.probability || 0,
        is_won: isWon,
        is_lost: isLost,
        is_active: lead.active !== false,
        sector: lead.sector || undefined,
        specification_id: typeof lead.specification_id === 'number' ? lead.specification_id : (lead.specification_id?.[0] || undefined),
        specification_name: lead.specification_id ? getRelationName(lead.specification_id) : undefined,
        lead_source_id: typeof lead.lead_source_id === 'number' ? lead.lead_source_id : (lead.lead_source_id?.[0] || undefined),
        lead_source_name: lead.lead_source_id ? getRelationName(lead.lead_source_id) : undefined,
        city: lead.city || undefined,
        state_id: typeof lead.state_id === 'number' ? lead.state_id : (lead.state_id?.[0] || undefined),
        state_name: lead.state_id ? getRelationName(lead.state_id) : undefined,
        lost_reason_id: typeof lead.lost_reason_id === 'number' ? lead.lost_reason_id : (lead.lost_reason_id?.[0] || undefined),
        lost_reason_name: lead.lost_reason_id ? getRelationName(lead.lost_reason_id) : undefined,
        create_date: lead.create_date || new Date().toISOString(),
        write_date: lead.write_date || new Date().toISOString(),
        date_closed: lead.date_closed || undefined,
        sync_version: syncVersion + 1,
        last_synced: new Date().toISOString(),
        truncated,
        embedding_text: embeddingText,
    };
}
/**
 * Full sync - rebuild entire vector index.
 */
export async function fullSync(onProgress) {
    if (isSyncing) {
        return {
            success: false,
            recordsSynced: 0,
            recordsFailed: 0,
            recordsDeleted: 0,
            durationMs: 0,
            syncVersion,
            errors: ['Sync already in progress'],
        };
    }
    isSyncing = true;
    const startTime = Date.now();
    const errors = [];
    let recordsSynced = 0;
    let recordsFailed = 0;
    try {
        // Phase 1: Fetch all active opportunities from Odoo
        const leads = await useClient(async (client) => {
            const domain = [['active', '=', true]];
            const total = await client.searchCount('crm.lead', domain);
            const allLeads = [];
            const batchSize = VECTOR_SYNC_CONFIG.BATCH_SIZE;
            const totalBatches = Math.ceil(total / batchSize);
            for (let i = 0; i < total; i += batchSize) {
                const batch = await client.searchRead('crm.lead', domain, CRM_FIELDS.LEAD_DETAIL, { offset: i, limit: batchSize });
                allLeads.push(...batch);
                if (onProgress) {
                    onProgress({
                        phase: 'fetching',
                        currentBatch: Math.floor(i / batchSize) + 1,
                        totalBatches,
                        recordsProcessed: allLeads.length,
                        totalRecords: total,
                        percentComplete: Math.round((allLeads.length / total) * 33),
                        elapsedMs: Date.now() - startTime,
                    });
                }
            }
            return allLeads;
        });
        // Phase 2: Generate embeddings
        const embeddingData = leads.map(lead => buildEmbeddingText(lead));
        const documents = embeddingData.map(d => d.text);
        const embeddings = await embedBatch(documents, 'document', (current, total) => {
            if (onProgress) {
                onProgress({
                    phase: 'embedding',
                    currentBatch: current,
                    totalBatches: total,
                    recordsProcessed: current,
                    totalRecords: total,
                    percentComplete: 33 + Math.round((current / total) * 33),
                    elapsedMs: Date.now() - startTime,
                });
            }
        });
        // Phase 3: Upsert to Qdrant in batches
        const vectorBatchSize = 100;
        for (let i = 0; i < leads.length; i += vectorBatchSize) {
            const batchLeads = leads.slice(i, i + vectorBatchSize);
            const batchEmbeddings = embeddings.slice(i, i + vectorBatchSize);
            const batchEmbeddingData = embeddingData.slice(i, i + vectorBatchSize);
            const records = batchLeads.map((lead, idx) => ({
                id: String(lead.id),
                values: batchEmbeddings[idx],
                metadata: buildMetadata(lead, batchEmbeddingData[idx].text, batchEmbeddingData[idx].truncated),
            }));
            try {
                await upsertPoints(records);
                recordsSynced += records.length;
            }
            catch (error) {
                recordsFailed += records.length;
                errors.push(`Batch ${Math.floor(i / vectorBatchSize) + 1}: ${error}`);
            }
            if (onProgress) {
                const processed = Math.min(i + vectorBatchSize, leads.length);
                onProgress({
                    phase: 'upserting',
                    currentBatch: Math.floor(i / vectorBatchSize) + 1,
                    totalBatches: Math.ceil(leads.length / vectorBatchSize),
                    recordsProcessed: processed,
                    totalRecords: leads.length,
                    percentComplete: 66 + Math.round((processed / leads.length) * 34),
                    elapsedMs: Date.now() - startTime,
                });
            }
        }
        syncVersion++;
        lastSyncTime = new Date().toISOString();
        return {
            success: recordsFailed === 0,
            recordsSynced,
            recordsFailed,
            recordsDeleted: 0,
            durationMs: Date.now() - startTime,
            syncVersion,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    catch (error) {
        return {
            success: false,
            recordsSynced,
            recordsFailed,
            recordsDeleted: 0,
            durationMs: Date.now() - startTime,
            syncVersion,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
    }
    finally {
        isSyncing = false;
    }
}
/**
 * Incremental sync - only sync changed records.
 */
export async function incrementalSync(since, onProgress) {
    if (isSyncing) {
        return {
            success: false,
            recordsSynced: 0,
            recordsFailed: 0,
            recordsDeleted: 0,
            durationMs: 0,
            syncVersion,
            errors: ['Sync already in progress'],
        };
    }
    isSyncing = true;
    const startTime = Date.now();
    const sinceDate = since || lastSyncTime || new Date(0).toISOString();
    const errors = [];
    let recordsSynced = 0;
    let recordsFailed = 0;
    try {
        // Fetch changed records from Odoo
        const leads = await useClient(async (client) => {
            const domain = [
                ['write_date', '>=', sinceDate],
                ['active', '=', true],
            ];
            return client.searchRead('crm.lead', domain, CRM_FIELDS.LEAD_DETAIL);
        });
        if (leads.length === 0) {
            return {
                success: true,
                recordsSynced: 0,
                recordsFailed: 0,
                recordsDeleted: 0,
                durationMs: Date.now() - startTime,
                syncVersion,
            };
        }
        // Generate embeddings and upsert
        const embeddingData = leads.map(lead => buildEmbeddingText(lead));
        const documents = embeddingData.map(d => d.text);
        const embeddings = await embedBatch(documents, 'document');
        const records = leads.map((lead, idx) => ({
            id: String(lead.id),
            values: embeddings[idx],
            metadata: buildMetadata(lead, embeddingData[idx].text, embeddingData[idx].truncated),
        }));
        try {
            await upsertPoints(records);
            recordsSynced = records.length;
        }
        catch (error) {
            recordsFailed = records.length;
            errors.push(String(error));
        }
        if (recordsSynced > 0) {
            syncVersion++;
            lastSyncTime = new Date().toISOString();
        }
        return {
            success: recordsFailed === 0,
            recordsSynced,
            recordsFailed,
            recordsDeleted: 0,
            durationMs: Date.now() - startTime,
            syncVersion,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    catch (error) {
        return {
            success: false,
            recordsSynced,
            recordsFailed,
            recordsDeleted: 0,
            durationMs: Date.now() - startTime,
            syncVersion,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
    }
    finally {
        isSyncing = false;
    }
}
/**
 * Sync a single record by ID.
 */
export async function syncRecord(leadId) {
    const startTime = Date.now();
    try {
        const leads = await useClient(async (client) => {
            return client.searchRead('crm.lead', [['id', '=', leadId]], CRM_FIELDS.LEAD_DETAIL);
        });
        if (leads.length === 0) {
            return {
                success: false,
                recordsSynced: 0,
                recordsFailed: 0,
                recordsDeleted: 0,
                durationMs: Date.now() - startTime,
                syncVersion,
                errors: [`Lead ID ${leadId} not found`],
            };
        }
        const lead = leads[0];
        const { text, truncated } = buildEmbeddingText(lead);
        const [embedding] = await embedBatch([text], 'document');
        const record = {
            id: String(lead.id),
            values: embedding,
            metadata: buildMetadata(lead, text, truncated),
        };
        await upsertPoints([record]);
        return {
            success: true,
            recordsSynced: 1,
            recordsFailed: 0,
            recordsDeleted: 0,
            durationMs: Date.now() - startTime,
            syncVersion,
        };
    }
    catch (error) {
        return {
            success: false,
            recordsSynced: 0,
            recordsFailed: 1,
            recordsDeleted: 0,
            durationMs: Date.now() - startTime,
            syncVersion,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
    }
}
/**
 * Get comprehensive vector status.
 */
export async function getVectorStatus() {
    const cbState = getCircuitBreakerState();
    if (!QDRANT_CONFIG.ENABLED) {
        return {
            enabled: false,
            qdrantConnected: false,
            voyageConnected: false,
            collectionName: '',
            totalVectors: 0,
            lastSync: null,
            syncVersion: 0,
            circuitBreakerState: 'CLOSED',
            errorMessage: 'Vector features disabled',
        };
    }
    const qdrantHealth = await healthCheck();
    const voyageAvailable = isEmbeddingServiceAvailable();
    return {
        enabled: true,
        qdrantConnected: qdrantHealth.connected,
        voyageConnected: voyageAvailable,
        collectionName: qdrantHealth.collectionName,
        totalVectors: qdrantHealth.vectorCount,
        lastSync: lastSyncTime,
        syncVersion,
        circuitBreakerState: cbState.state,
        errorMessage: qdrantHealth.error,
    };
}
//# sourceMappingURL=sync-service.js.map