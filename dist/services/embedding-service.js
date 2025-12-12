/**
 * Embedding Service - Voyage AI Integration
 *
 * Generates embeddings for CRM records using Voyage AI's voyage-3-lite model.
 * Supports single and batch embedding with input_type optimization.
 */
import { VoyageAIClient } from 'voyageai';
import { VOYAGE_CONFIG, PRIORITY_LABELS, getSelectionLabel } from '../constants.js';
import { stripHtml } from '../utils/html-utils.js';
import { getRelationName } from './formatters.js';
// Singleton client
let voyageClient = null;
/**
 * Initialize the Voyage AI client.
 * Call this on server startup.
 */
export function initializeEmbeddingService() {
    const apiKey = VOYAGE_CONFIG.API_KEY;
    if (!apiKey) {
        console.error('[Embedding] VOYAGE_API_KEY not set - embedding service disabled');
        return null;
    }
    try {
        voyageClient = new VoyageAIClient({ apiKey });
        console.error('[Embedding] Voyage AI service initialized');
        return voyageClient;
    }
    catch (error) {
        console.error('[Embedding] Failed to initialize:', error);
        return null;
    }
}
/**
 * Get the Voyage client instance.
 */
export function getEmbeddingClient() {
    return voyageClient;
}
/**
 * Check if embedding service is available.
 */
export function isEmbeddingServiceAvailable() {
    return voyageClient !== null;
}
/**
 * Truncate text to maximum word count.
 * Returns { text, truncated } tuple.
 */
function truncateText(text, maxWords) {
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
 * Combines multiple fields into a semantic document for vector search.
 *
 * DESIGN PRINCIPLES:
 * 1. Include fields with SEMANTIC MEANING (not just IDs)
 * 2. Use human-readable labels for selection fields
 * 3. Handle missing/custom fields gracefully (undefined check)
 * 4. Format consistently for vector similarity
 *
 * OUTPUT FORMAT:
 * ```
 * Opportunity: {name}
 * Partner: {partner_name}
 * Contact: {contact_name} | Role: {function}
 * Email: {email} | Phone: {phone}
 * Sector: {sector}
 * Location: {street}, {city}, {state}, {country} {zip}
 * Salesperson: {user_name} | Team: {team_name}
 * Lead Source: {lead_source_name}
 * UTM: Source: {source} | Medium: {medium} | Campaign: {campaign}
 * Referred by: {referred}
 * Specification: {specification_name}
 * Revenue: ${expected_revenue} | Stage: {stage_name} | Priority: {label}
 * Status: Won/Lost/Active - {lost_reason}
 * Project Roles: Architect: {name} | PM: {name} | ...
 * Description: {description}
 * ```
 */
export function buildEmbeddingText(lead) {
    const parts = [];
    // ==========================================================================
    // SECTION 1: CORE IDENTITY (Highest semantic value)
    // ==========================================================================
    // Opportunity name - most important field
    parts.push(`Opportunity: ${lead.name || 'Untitled'}`);
    // Partner/Company name - CRITICAL for B2B search
    if (lead.partner_id) {
        parts.push(`Partner: ${getRelationName(lead.partner_id)}`);
    }
    else if (lead.partner_name) {
        // Fallback to partner_name field if available
        parts.push(`Partner: ${lead.partner_name}`);
    }
    // ==========================================================================
    // SECTION 2: CONTACT INFORMATION
    // ==========================================================================
    // Customer contact with job position
    const contactParts = [];
    if (lead.contact_name) {
        contactParts.push(`Contact: ${lead.contact_name}`);
    }
    if (lead.function) {
        contactParts.push(`Role: ${lead.function}`);
    }
    if (contactParts.length > 0) {
        parts.push(contactParts.join(' | '));
    }
    // Contact details (email, phone) - useful for deduplication and search
    const contactDetailParts = [];
    if (lead.email_from) {
        contactDetailParts.push(`Email: ${lead.email_from}`);
    }
    if (lead.phone) {
        contactDetailParts.push(`Phone: ${lead.phone}`);
    }
    if (lead.mobile && lead.mobile !== lead.phone) {
        contactDetailParts.push(`Mobile: ${lead.mobile}`);
    }
    if (contactDetailParts.length > 0) {
        parts.push(contactDetailParts.join(' | '));
    }
    // ==========================================================================
    // SECTION 3: CLASSIFICATION
    // ==========================================================================
    // Sector - critical for industry-based search
    if (lead.sector) {
        parts.push(`Sector: ${lead.sector}`);
    }
    // ==========================================================================
    // SECTION 4: LOCATION (Full address for geographic similarity)
    // ==========================================================================
    const locationParts = [];
    if (lead.street)
        locationParts.push(lead.street);
    if (lead.city)
        locationParts.push(lead.city);
    if (lead.state_id)
        locationParts.push(getRelationName(lead.state_id));
    if (lead.country_id) {
        const countryName = getRelationName(lead.country_id);
        // Only include country if it's not Australia (default)
        if (countryName && countryName !== 'Australia') {
            locationParts.push(countryName);
        }
    }
    if (lead.zip)
        locationParts.push(lead.zip);
    if (locationParts.length > 0) {
        parts.push(`Location: ${locationParts.join(', ')}`);
    }
    // Custom project address (if different from main address)
    if (lead.project_address) {
        parts.push(`Project Address: ${lead.project_address}`);
    }
    // ==========================================================================
    // SECTION 5: ASSIGNMENT & TEAM
    // ==========================================================================
    const assignmentParts = [];
    if (lead.user_id) {
        assignmentParts.push(`Salesperson: ${getRelationName(lead.user_id)}`);
    }
    if (lead.team_id) {
        assignmentParts.push(`Team: ${getRelationName(lead.team_id)}`);
    }
    if (assignmentParts.length > 0) {
        parts.push(assignmentParts.join(' | '));
    }
    // ==========================================================================
    // SECTION 6: LEAD SOURCES (Attribution)
    // ==========================================================================
    // Custom lead source (primary source tracking)
    if (lead.lead_source_id) {
        parts.push(`Lead Source: ${getRelationName(lead.lead_source_id)}`);
    }
    // UTM parameters (marketing attribution)
    const utmParts = [];
    if (lead.source_id) {
        utmParts.push(`Source: ${getRelationName(lead.source_id)}`);
    }
    if (lead.medium_id) {
        utmParts.push(`Medium: ${getRelationName(lead.medium_id)}`);
    }
    if (lead.campaign_id) {
        utmParts.push(`Campaign: ${getRelationName(lead.campaign_id)}`);
    }
    if (utmParts.length > 0) {
        parts.push(`UTM: ${utmParts.join(' | ')}`);
    }
    // Referral source
    if (lead.referred) {
        parts.push(`Referred by: ${lead.referred}`);
    }
    // ==========================================================================
    // SECTION 7: SPECIFICATION & CLASSIFICATION
    // ==========================================================================
    if (lead.specification_id) {
        parts.push(`Specification: ${getRelationName(lead.specification_id)}`);
    }
    // ==========================================================================
    // SECTION 8: BUSINESS METRICS
    // ==========================================================================
    const metricsParts = [];
    // Revenue
    const revenue = lead.expected_revenue
        ? `$${lead.expected_revenue.toLocaleString()}`
        : 'Not specified';
    metricsParts.push(`Revenue: ${revenue}`);
    // Stage
    const stage = lead.stage_id ? getRelationName(lead.stage_id) : 'Unknown';
    metricsParts.push(`Stage: ${stage}`);
    // Priority (with human-readable label)
    const priorityLabel = getSelectionLabel(PRIORITY_LABELS, lead.priority);
    if (priorityLabel) {
        metricsParts.push(`Priority: ${priorityLabel}`);
    }
    parts.push(metricsParts.join(' | '));
    // ==========================================================================
    // SECTION 9: STATUS (Won/Lost/Active)
    // ==========================================================================
    // Determine status from won_status field or stage name patterns
    const stageName = (lead.stage_id && typeof lead.stage_id !== 'number')
        ? lead.stage_id[1]?.toLowerCase() || ''
        : '';
    const isWon = lead.won_status === 'won' ||
        stageName.includes('invoiced') ||
        stageName.includes('signed oc') ||
        stageName.includes('in production') ||
        stageName.includes('won');
    const isLost = !!lead.lost_reason_id;
    let status = 'Active';
    if (isWon) {
        status = 'Won';
    }
    else if (isLost) {
        const lostReason = getRelationName(lead.lost_reason_id);
        status = `Lost - ${lostReason}`;
    }
    parts.push(`Status: ${status}`);
    // ==========================================================================
    // SECTION 10: CUSTOM FIELDS (graceful handling if undefined)
    // ==========================================================================
    // Custom role fields (may not exist in all Odoo instances)
    const customRoleParts = [];
    if (lead.architect_id) {
        customRoleParts.push(`Architect: ${getRelationName(lead.architect_id)}`);
    }
    if (lead.client_id) {
        customRoleParts.push(`Client: ${getRelationName(lead.client_id)}`);
    }
    if (lead.estimator_id) {
        customRoleParts.push(`Estimator: ${getRelationName(lead.estimator_id)}`);
    }
    if (lead.project_manager_id) {
        customRoleParts.push(`PM: ${getRelationName(lead.project_manager_id)}`);
    }
    if (lead.spec_rep_id) {
        customRoleParts.push(`Spec Rep: ${getRelationName(lead.spec_rep_id)}`);
    }
    if (customRoleParts.length > 0) {
        parts.push(`Project Roles: ${customRoleParts.join(' | ')}`);
    }
    // Custom text fields
    if (lead.x_studio_building_owner) {
        parts.push(`Building Owner: ${lead.x_studio_building_owner}`);
    }
    if (lead.design) {
        // Limit design notes to 300 words
        const designResult = truncateText(lead.design, 300);
        parts.push(`Design: ${designResult.text}`);
    }
    if (lead.quote) {
        parts.push(`Quote: ${lead.quote}`);
    }
    // ==========================================================================
    // SECTION 11: DESCRIPTION (Most semantic content - truncated if needed)
    // ==========================================================================
    let truncated = false;
    if (lead.description) {
        const cleanDesc = stripHtml(lead.description);
        if (cleanDesc.trim()) {
            const result = truncateText(cleanDesc, VOYAGE_CONFIG.MAX_WORDS);
            truncated = result.truncated;
            parts.push(`Description: ${result.text}`);
        }
    }
    // Address notes (often contains useful project context)
    if (lead.address_note) {
        const cleanNote = stripHtml(lead.address_note);
        if (cleanNote.trim()) {
            // Limit address notes to 200 words to avoid overwhelming
            const noteResult = truncateText(cleanNote, 200);
            parts.push(`Notes: ${noteResult.text}`);
        }
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
export async function embed(text, inputType = 'document') {
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
export async function embedBatch(texts, inputType = 'document', onProgress) {
    if (!voyageClient) {
        throw new Error('Embedding service not initialized');
    }
    const results = [];
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
export function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}
/**
 * Health check for embedding service.
 */
export async function checkEmbeddingHealth() {
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
    }
    catch (error) {
        return {
            available: false,
            model: VOYAGE_CONFIG.MODEL,
            dimensions: VOYAGE_CONFIG.DIMENSIONS,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
//# sourceMappingURL=embedding-service.js.map