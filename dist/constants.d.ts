export declare const CONTEXT_LIMITS: {
    readonly MAX_RESPONSE_CHARS: 8000;
    readonly DEFAULT_PAGE_SIZE: 10;
    readonly MAX_PAGE_SIZE: 50;
    readonly SUMMARY_THRESHOLD: 20;
    readonly MAX_FIELDS_DETAIL: 15;
    readonly MAX_FIELDS_LIST: 8;
};
export declare const EXPORT_CONFIG: {
    readonly DEFAULT_OUTPUT_DIR: "/mnt/user-data/outputs";
    readonly OUTPUT_DIR_ENV_VAR: "MCP_EXPORT_DIR";
    readonly MAX_SIZE_WARNING_BYTES: number;
    readonly MAX_SIZE_ENV_VAR: "MCP_EXPORT_MAX_SIZE_MB";
    readonly BATCH_SIZE: 500;
    readonly MAX_EXPORT_RECORDS: 10000;
    readonly DEFAULT_EXPORT_RECORDS: 1000;
};
export declare const CRM_FIELDS: {
    LEAD_LIST: string[];
    LEAD_LIST_EXTENDED: string[];
    LEAD_DETAIL: string[];
    PIPELINE_SUMMARY: string[];
    CONTACT_LIST: string[];
    ACTIVITY: string[];
    LOST_OPPORTUNITY_LIST: string[];
    LOST_OPPORTUNITY_DETAIL: string[];
    LOST_REASON: string[];
    WON_OPPORTUNITY_LIST: string[];
    WON_OPPORTUNITY_DETAIL: string[];
    ACTIVITY_DETAIL: string[];
    USER_LIST: string[];
    TEAM_LIST: string[];
    STATE_LIST: string[];
};
export declare enum ResponseFormat {
    JSON = "json",
    MARKDOWN = "markdown",
    CSV = "csv"
}
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
export declare const FIELD_PRESETS: Record<string, Record<string, string[]>>;
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
export declare function resolveFields(fieldsParam: string | string[] | undefined, modelType?: 'lead' | 'contact' | 'activity' | 'lost' | 'won', defaultPreset?: string): string[];
export declare const CIRCUIT_BREAKER_CONFIG: {
    readonly FAILURE_THRESHOLD: 5;
    readonly RESET_TIMEOUT_MS: 60000;
    readonly HALF_OPEN_MAX_ATTEMPTS: 1;
};
export declare const REDIS_CONFIG: {
    readonly CACHE_TYPE: "memory" | "redis";
    readonly REDIS_URL: string;
    readonly KEY_PREFIX: string;
};
export declare const POOL_CONFIG: {
    readonly MIN: number;
    readonly MAX: number;
    readonly ACQUIRE_TIMEOUT_MS: number;
    readonly IDLE_TIMEOUT_MS: number;
    readonly EVICTION_RUN_INTERVAL_MS: number;
    readonly TEST_ON_BORROW: boolean;
    readonly FIFO: true;
};
/**
 * Qdrant vector database configuration
 */
export declare const QDRANT_CONFIG: {
    readonly HOST: string;
    readonly API_KEY: string;
    readonly COLLECTION_NAME: string;
    readonly VECTOR_SIZE: number;
    readonly DISTANCE_METRIC: "Cosine";
    readonly HNSW_M: 16;
    readonly HNSW_EF_CONSTRUCT: 100;
    readonly PAYLOAD_INDEXES: readonly [{
        readonly field: "stage_id";
        readonly type: "integer";
    }, {
        readonly field: "user_id";
        readonly type: "integer";
    }, {
        readonly field: "team_id";
        readonly type: "integer";
    }, {
        readonly field: "expected_revenue";
        readonly type: "float";
    }, {
        readonly field: "is_won";
        readonly type: "bool";
    }, {
        readonly field: "is_lost";
        readonly type: "bool";
    }, {
        readonly field: "is_active";
        readonly type: "bool";
    }, {
        readonly field: "create_date";
        readonly type: "datetime";
    }, {
        readonly field: "sector";
        readonly type: "keyword";
    }, {
        readonly field: "lost_reason_id";
        readonly type: "integer";
    }];
    readonly ENABLED: boolean;
};
/**
 * Voyage AI embedding configuration
 */
export declare const VOYAGE_CONFIG: {
    readonly API_KEY: string;
    readonly MODEL: string;
    readonly DIMENSIONS: number;
    readonly INPUT_TYPE_DOCUMENT: "document";
    readonly INPUT_TYPE_QUERY: "query";
    readonly MAX_BATCH_SIZE: 128;
    readonly MAX_TOKENS_PER_BATCH: 120000;
    readonly MAX_WORDS: 2000;
    readonly TRUNCATION: true;
};
/**
 * Sync service configuration
 */
export declare const VECTOR_SYNC_CONFIG: {
    readonly ENABLED: boolean;
    readonly INTERVAL_MS: number;
    readonly BATCH_SIZE: number;
    readonly MAX_RECORDS_PER_SYNC: 10000;
};
/**
 * Similarity score thresholds
 * Research shows 0.5 is too low - use 0.6 as default
 */
export declare const SIMILARITY_THRESHOLDS: {
    readonly VERY_SIMILAR: 0.8;
    readonly MEANINGFULLY_SIMILAR: 0.6;
    readonly LOOSELY_RELATED: 0.4;
    readonly DEFAULT_MIN: 0.6;
};
/**
 * Circuit breaker for vector services
 */
export declare const VECTOR_CIRCUIT_BREAKER_CONFIG: {
    readonly FAILURE_THRESHOLD: 3;
    readonly RESET_TIMEOUT_MS: 30000;
    readonly HALF_OPEN_MAX_ATTEMPTS: 1;
};
//# sourceMappingURL=constants.d.ts.map