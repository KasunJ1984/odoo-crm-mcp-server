// Constants for context-aware data retrieval
export const CONTEXT_LIMITS = {
    // Maximum characters to return in a single response (keeps context manageable)
    MAX_RESPONSE_CHARS: 8000,
    // Default pagination limits (small to preserve context)
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50,
    // Summary thresholds
    SUMMARY_THRESHOLD: 20, // If more than 20 records, suggest using summary tools
    // Field limits for detailed views
    MAX_FIELDS_DETAIL: 15,
    MAX_FIELDS_LIST: 8,
};
// Export configuration
export const EXPORT_CONFIG = {
    // Default output directory for exports (Claude.ai compatible)
    DEFAULT_OUTPUT_DIR: '/mnt/user-data/outputs',
    // Environment variable name for custom output directory
    OUTPUT_DIR_ENV_VAR: 'MCP_EXPORT_DIR',
    // File size warning threshold in bytes (default: 50MB)
    MAX_SIZE_WARNING_BYTES: 50 * 1024 * 1024,
    // Environment variable name for max size threshold (in MB)
    MAX_SIZE_ENV_VAR: 'MCP_EXPORT_MAX_SIZE_MB',
    // Batch size for paginated exports (records per API call)
    BATCH_SIZE: 500,
    // Maximum records allowed in a single export
    MAX_EXPORT_RECORDS: 10000,
    // Default max records for export
    DEFAULT_EXPORT_RECORDS: 1000,
};
// Odoo CRM field mappings for context efficiency
export const CRM_FIELDS = {
    // Minimal fields for list views (context-efficient)
    LEAD_LIST: [
        'id', 'name', 'contact_name', 'email_from', 'phone',
        'expected_revenue', 'probability', 'stage_id', 'create_date',
        'user_id', 'team_id',
        'lead_source_id', 'sector', 'specification_id',
        'city', 'state_id'
    ],
    // Extended fields for lead list (includes address, source, tags)
    LEAD_LIST_EXTENDED: [
        'id', 'name', 'contact_name', 'email_from', 'phone',
        'expected_revenue', 'probability', 'stage_id', 'create_date',
        'user_id', 'team_id', 'street', 'city', 'state_id', 'country_id',
        'source_id', 'medium_id', 'campaign_id', 'tag_ids',
        'date_deadline', 'partner_id', 'description',
        'lead_source_id', 'sector', 'specification_id'
    ],
    // Detailed fields for single record views (including custom fields for embeddings)
    LEAD_DETAIL: [
        // Core fields
        'id', 'name', 'contact_name', 'email_from', 'phone', 'mobile',
        'street', 'city', 'state_id', 'country_id', 'expected_revenue', 'probability',
        'stage_id', 'user_id', 'team_id', 'source_id', 'medium_id',
        'campaign_id', 'description', 'create_date', 'write_date',
        'date_deadline', 'date_closed', 'lost_reason_id', 'tag_ids',
        'partner_id', 'company_id', 'priority', 'type', 'active',
        'lead_source_id', 'sector', 'specification_id', 'won_status',
        // Additional standard fields for embeddings
        'zip', 'function', 'partner_name',
        // Custom fields (will be undefined if not present in Odoo instance)
        'architect_id', 'client_id', 'estimator_id', 'project_manager_id',
        'spec_rep_id', 'design', 'quote', 'referred',
        'address_note', 'project_address', 'x_studio_building_owner',
    ],
    // Fields for pipeline analysis
    PIPELINE_SUMMARY: [
        'stage_id', 'expected_revenue', 'probability', 'user_id', 'team_id'
    ],
    // Contact minimal fields
    CONTACT_LIST: [
        'id', 'name', 'email', 'phone', 'mobile', 'company_id', 'city', 'state_id', 'country_id'
    ],
    // Activity fields
    ACTIVITY: [
        'id', 'summary', 'activity_type_id', 'date_deadline', 'user_id', 'res_id', 'state'
    ],
    // Lost opportunity fields
    LOST_OPPORTUNITY_LIST: [
        'id', 'name', 'contact_name', 'email_from', 'expected_revenue',
        'stage_id', 'user_id', 'lost_reason_id', 'date_closed', 'create_date',
        'lead_source_id', 'sector', 'specification_id',
        'city', 'state_id'
    ],
    // Lost opportunity detail fields (includes feedback if available)
    LOST_OPPORTUNITY_DETAIL: [
        'id', 'name', 'contact_name', 'email_from', 'phone', 'expected_revenue',
        'stage_id', 'user_id', 'team_id', 'partner_id', 'lost_reason_id',
        'date_closed', 'create_date', 'description',
        'lead_source_id', 'sector', 'specification_id',
        'city', 'state_id'
    ],
    // Lost reason fields
    LOST_REASON: [
        'id', 'name', 'active'
    ],
    // Won opportunity fields
    WON_OPPORTUNITY_LIST: [
        'id', 'name', 'contact_name', 'email_from', 'expected_revenue',
        'stage_id', 'user_id', 'team_id', 'date_closed', 'create_date',
        'lead_source_id', 'sector', 'specification_id',
        'city', 'state_id'
    ],
    // Won opportunity detail fields
    WON_OPPORTUNITY_DETAIL: [
        'id', 'name', 'contact_name', 'email_from', 'phone', 'expected_revenue',
        'stage_id', 'user_id', 'team_id', 'partner_id', 'source_id',
        'date_closed', 'create_date', 'description',
        'lead_source_id', 'sector', 'specification_id',
        'city', 'state_id'
    ],
    // Activity detail fields
    ACTIVITY_DETAIL: [
        'id', 'summary', 'activity_type_id', 'date_deadline', 'user_id',
        'res_id', 'state', 'note', 'res_name'
    ],
    // User fields
    USER_LIST: [
        'id', 'name', 'email', 'login', 'active'
    ],
    // Team fields
    TEAM_LIST: [
        'id', 'name', 'active', 'member_ids'
    ],
    // State/Territory fields (for geographic analysis)
    STATE_LIST: [
        'id', 'name', 'code', 'country_id'
    ]
};
// Response format options
export var ResponseFormat;
(function (ResponseFormat) {
    ResponseFormat["JSON"] = "json";
    ResponseFormat["MARKDOWN"] = "markdown";
    ResponseFormat["CSV"] = "csv";
})(ResponseFormat || (ResponseFormat = {}));
// =============================================================================
// FIELD PRESETS - Named field sets for dynamic column selection
// =============================================================================
/**
 * Map preset names to actual field arrays.
 * Users can specify preset names instead of listing individual fields.
 *
 * Usage in tools:
 *   fields: "basic"           -> Uses LEAD_LIST (14 fields)
 *   fields: "extended"        -> Uses LEAD_LIST_EXTENDED (21 fields)
 *   fields: "full"            -> Uses LEAD_DETAIL (all fields)
 *   fields: ["name", "email"] -> Uses custom array
 */
export const FIELD_PRESETS = {
    // Lead/Opportunity presets
    lead: {
        basic: CRM_FIELDS.LEAD_LIST,
        extended: CRM_FIELDS.LEAD_LIST_EXTENDED,
        full: CRM_FIELDS.LEAD_DETAIL,
    },
    // Contact presets
    contact: {
        basic: CRM_FIELDS.CONTACT_LIST,
        full: CRM_FIELDS.CONTACT_LIST,
    },
    // Activity presets
    activity: {
        basic: CRM_FIELDS.ACTIVITY,
        full: CRM_FIELDS.ACTIVITY_DETAIL,
    },
    // Lost opportunity presets
    lost: {
        basic: CRM_FIELDS.LOST_OPPORTUNITY_LIST,
        full: CRM_FIELDS.LOST_OPPORTUNITY_DETAIL,
    },
    // Won opportunity presets
    won: {
        basic: CRM_FIELDS.WON_OPPORTUNITY_LIST,
        full: CRM_FIELDS.WON_OPPORTUNITY_DETAIL,
    },
};
/**
 * Resolve a fields parameter to an actual array of field names.
 *
 * This function handles three cases:
 * 1. undefined/null -> Returns the default preset for the model type
 * 2. string (preset name) -> Returns the preset's field array
 * 3. string[] (custom fields) -> Returns as-is
 *
 * @param fieldsParam - The fields parameter from the API call
 * @param modelType - The type of model: 'lead', 'contact', 'activity', 'lost', 'won'
 * @param defaultPreset - Which preset to use when fieldsParam is undefined (default: 'basic')
 * @returns Array of field names to fetch from Odoo
 *
 * @example
 * // No fields specified - use default preset
 * resolveFields(undefined, 'lead', 'basic')
 * // Returns: ['id', 'name', 'contact_name', 'email_from', ...]
 *
 * @example
 * // Preset name specified
 * resolveFields('extended', 'lead', 'basic')
 * // Returns: LEAD_LIST_EXTENDED fields
 *
 * @example
 * // Custom array specified
 * resolveFields(['name', 'email_from', 'expected_revenue'], 'lead')
 * // Returns: ['name', 'email_from', 'expected_revenue']
 */
export function resolveFields(fieldsParam, modelType = 'lead', defaultPreset = 'basic') {
    // Case 1: No parameter provided - use default preset
    if (fieldsParam === undefined || fieldsParam === null) {
        const presets = FIELD_PRESETS[modelType];
        return presets?.[defaultPreset] || CRM_FIELDS.LEAD_LIST;
    }
    // Case 2: String provided - it's a preset name
    if (typeof fieldsParam === 'string') {
        const presets = FIELD_PRESETS[modelType];
        const preset = presets?.[fieldsParam];
        if (preset) {
            return preset;
        }
        // Unknown preset name - log warning and use default
        console.error(`[resolveFields] Unknown preset "${fieldsParam}" for ${modelType}, using default`);
        return FIELD_PRESETS[modelType]?.[defaultPreset] || CRM_FIELDS.LEAD_LIST;
    }
    // Case 3: Array provided - use as-is (custom fields)
    if (Array.isArray(fieldsParam)) {
        return fieldsParam;
    }
    // Fallback (shouldn't reach here, but just in case)
    return FIELD_PRESETS[modelType]?.[defaultPreset] || CRM_FIELDS.LEAD_LIST;
}
// Circuit breaker configuration for graceful degradation
export const CIRCUIT_BREAKER_CONFIG = {
    // Number of consecutive failures before circuit opens (stops trying)
    FAILURE_THRESHOLD: 5,
    // Time to wait before testing if Odoo is back (milliseconds)
    RESET_TIMEOUT_MS: 60000, // 60 seconds
    // Number of test requests allowed in HALF_OPEN state
    HALF_OPEN_MAX_ATTEMPTS: 1,
};
// Redis cache configuration (optional - for multi-instance deployments)
export const REDIS_CONFIG = {
    // Cache backend: 'memory' (default) or 'redis'
    CACHE_TYPE: (process.env.CACHE_TYPE || 'memory'),
    // Redis connection URL (only used when CACHE_TYPE='redis')
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    // Prefix for all cache keys (to avoid conflicts with other apps)
    KEY_PREFIX: process.env.CACHE_KEY_PREFIX || 'odoo-crm:',
};
// Connection pool configuration (for high concurrency - 50+ simultaneous users)
export const POOL_CONFIG = {
    // Minimum clients to keep in pool (pre-warmed and ready)
    MIN: parseInt(process.env.ODOO_POOL_MIN || '2'),
    // Maximum clients allowed in pool (concurrency limit)
    MAX: parseInt(process.env.ODOO_POOL_MAX || '10'),
    // Maximum time to wait for a client from pool (milliseconds)
    ACQUIRE_TIMEOUT_MS: parseInt(process.env.ODOO_POOL_ACQUIRE_TIMEOUT || '30000'),
    // Evict idle clients after this time (milliseconds) - 0 = no eviction
    IDLE_TIMEOUT_MS: parseInt(process.env.ODOO_POOL_IDLE_TIMEOUT || '300000'),
    // How often to run eviction checks (milliseconds) - 0 = disabled
    EVICTION_RUN_INTERVAL_MS: parseInt(process.env.ODOO_POOL_EVICTION_INTERVAL || '60000'),
    // Validate clients before returning from pool (checks circuit breaker)
    TEST_ON_BORROW: process.env.ODOO_POOL_TEST_ON_BORROW !== 'false',
    // Use FIFO (queue) for client allocation - ensures fair distribution
    FIFO: true,
};
// =============================================================================
// VECTOR DATABASE CONFIGURATION (Qdrant + Voyage AI)
// =============================================================================
/**
 * Qdrant vector database configuration
 */
export const QDRANT_CONFIG = {
    // Connection settings
    HOST: process.env.QDRANT_HOST || 'http://localhost:6333',
    API_KEY: process.env.QDRANT_API_KEY || '',
    COLLECTION_NAME: process.env.QDRANT_COLLECTION || 'odoo_crm_leads',
    // Vector settings (voyage-3-lite supports 512 dims only)
    VECTOR_SIZE: parseInt(process.env.EMBEDDING_DIMENSIONS || '512'),
    DISTANCE_METRIC: 'Cosine',
    // HNSW index settings (create BEFORE data upload)
    HNSW_M: 16, // Number of bi-directional links
    HNSW_EF_CONSTRUCT: 100, // Size of dynamic candidate list
    // Payload indexes to create
    PAYLOAD_INDEXES: [
        // Existing indexes
        { field: 'stage_id', type: 'integer' },
        { field: 'user_id', type: 'integer' },
        { field: 'team_id', type: 'integer' },
        { field: 'expected_revenue', type: 'float' },
        { field: 'is_won', type: 'bool' },
        { field: 'is_lost', type: 'bool' },
        { field: 'is_active', type: 'bool' },
        { field: 'create_date', type: 'datetime' },
        { field: 'sector', type: 'keyword' },
        { field: 'lost_reason_id', type: 'integer' },
        // NEW indexes for common filtering (Phase 2)
        { field: 'partner_id', type: 'integer' },
        { field: 'country_id', type: 'integer' },
        { field: 'priority', type: 'keyword' },
        { field: 'architect_id', type: 'integer' },
        { field: 'source_id', type: 'integer' },
    ],
    // Enabled flag
    ENABLED: process.env.VECTOR_ENABLED !== 'false',
};
/**
 * Voyage AI embedding configuration
 */
export const VOYAGE_CONFIG = {
    API_KEY: process.env.VOYAGE_API_KEY || '',
    MODEL: process.env.EMBEDDING_MODEL || 'voyage-3-lite',
    DIMENSIONS: parseInt(process.env.EMBEDDING_DIMENSIONS || '512'), // voyage-3-lite max
    // Input types (improves retrieval quality)
    INPUT_TYPE_DOCUMENT: 'document',
    INPUT_TYPE_QUERY: 'query',
    // Batch settings
    MAX_BATCH_SIZE: 128,
    MAX_TOKENS_PER_BATCH: 120000,
    // Text handling
    MAX_WORDS: 2000, // Truncate descriptions longer than this
    TRUNCATION: true,
};
/**
 * Sync service configuration
 */
export const VECTOR_SYNC_CONFIG = {
    ENABLED: process.env.VECTOR_SYNC_ENABLED !== 'false',
    INTERVAL_MS: parseInt(process.env.VECTOR_SYNC_INTERVAL_MS || '900000'), // 15 min
    BATCH_SIZE: parseInt(process.env.VECTOR_SYNC_BATCH_SIZE || '200'),
    MAX_RECORDS_PER_SYNC: 10000,
};
/**
 * Similarity score thresholds
 * Research shows 0.5 is too low - use 0.6 as default
 */
export const SIMILARITY_THRESHOLDS = {
    VERY_SIMILAR: 0.8, // Near duplicate
    MEANINGFULLY_SIMILAR: 0.6, // Good match (default min)
    LOOSELY_RELATED: 0.4, // Weak match
    DEFAULT_MIN: 0.6, // Default minimum score
};
/**
 * Circuit breaker for vector services
 */
export const VECTOR_CIRCUIT_BREAKER_CONFIG = {
    FAILURE_THRESHOLD: 3, // Open after 3 failures
    RESET_TIMEOUT_MS: 30000, // Try again after 30s
    HALF_OPEN_MAX_ATTEMPTS: 1,
};
// =============================================================================
// SELECTION FIELD LABEL MAPPINGS (for embedding text generation)
// =============================================================================
/**
 * Priority field labels.
 * Odoo stores priority as '0', '1', '2', '3' strings.
 */
export const PRIORITY_LABELS = {
    '0': 'Low',
    '1': 'Medium',
    '2': 'High',
    '3': 'Very High',
    'false': '',
};
/**
 * Won status labels.
 * Maps Odoo's won_status selection field values.
 */
export const WON_STATUS_LABELS = {
    'won': 'Won',
    'lost': 'Lost',
    'pending': 'In Progress',
    'false': '',
};
/**
 * Helper to get human-readable label from selection field.
 * Returns empty string if value not found (graceful handling).
 */
export function getSelectionLabel(mappings, value) {
    if (value === undefined || value === null || value === false) {
        return '';
    }
    return mappings[String(value)] || String(value);
}
//# sourceMappingURL=constants.js.map