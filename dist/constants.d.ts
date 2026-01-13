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
    RFQ_COLOR_FIELDS: string[];
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
 * Color taxonomy mapping raw color names to standard categories.
 * Used to normalize extracted colors for consistent trend analysis.
 */
export declare const COLOR_TAXONOMY: Record<string, string[]>;
/**
 * Regex patterns for extracting colors from description text.
 * SPECIFIED patterns are highest priority (industry specs like "9610 Pure Ash")
 * EXPLICIT patterns are reliable (e.g., "Color: Navy Blue")
 * CONTEXTUAL patterns catch standalone color words.
 */
export declare const COLOR_PATTERNS: {
    readonly SPECIFIED_COLORS: RegExp;
    readonly EXPLICIT: RegExp;
    readonly CONTEXTUAL: RegExp;
};
/**
 * Known product color codes mapped to color names and categories.
 * This lookup is used when only a numeric code is provided (e.g., "9610").
 * Can be extended or loaded from external source in future.
 */
export declare const PRODUCT_COLOR_CODES: Record<string, {
    name: string;
    category: string;
}>;
/**
 * Color categories enum for schema validation
 */
export declare const COLOR_CATEGORIES: readonly ["White", "Black", "Grey", "Blue", "Brown", "Green", "Red", "Yellow", "Orange", "Pink", "Purple", "Other", "Unknown"];
export type ColorCategory = typeof COLOR_CATEGORIES[number];
//# sourceMappingURL=constants.d.ts.map