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
} as const;

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
} as const;

// Odoo CRM field mappings for context efficiency
export const CRM_FIELDS = {
  // Minimal fields for list views (context-efficient)
  LEAD_LIST: [
    'id', 'name', 'contact_name', 'email_from', 'phone',
    'expected_revenue', 'probability', 'stage_id', 'create_date',
    'user_id', 'team_id',
    'lead_source_id', 'sector', 'specification_id',
    'city', 'state_id'
  ] as string[],

  // Extended fields for lead list (includes address, source, tags)
  LEAD_LIST_EXTENDED: [
    'id', 'name', 'contact_name', 'email_from', 'phone',
    'expected_revenue', 'probability', 'stage_id', 'create_date',
    'user_id', 'team_id', 'street', 'city', 'state_id', 'country_id',
    'source_id', 'medium_id', 'campaign_id', 'tag_ids',
    'date_deadline', 'partner_id', 'description',
    'lead_source_id', 'sector', 'specification_id'
  ] as string[],
  
  // Detailed fields for single record views
  LEAD_DETAIL: [
    'id', 'name', 'contact_name', 'email_from', 'phone', 'mobile',
    'street', 'city', 'state_id', 'country_id', 'expected_revenue', 'probability',
    'stage_id', 'user_id', 'team_id', 'source_id', 'medium_id',
    'campaign_id', 'description', 'create_date', 'write_date',
    'date_deadline', 'date_closed', 'lost_reason_id', 'tag_ids',
    'partner_id', 'company_id', 'priority', 'type', 'active',
    'lead_source_id', 'sector', 'specification_id'
  ] as string[],
  
  // Fields for pipeline analysis
  PIPELINE_SUMMARY: [
    'stage_id', 'expected_revenue', 'probability', 'user_id', 'team_id'
  ] as string[],
  
  // Contact minimal fields
  CONTACT_LIST: [
    'id', 'name', 'email', 'phone', 'mobile', 'company_id', 'city', 'state_id', 'country_id'
  ] as string[],
  
  // Activity fields
  ACTIVITY: [
    'id', 'summary', 'activity_type_id', 'date_deadline', 'user_id', 'res_id', 'state'
  ] as string[],

  // Lost opportunity fields
  LOST_OPPORTUNITY_LIST: [
    'id', 'name', 'contact_name', 'email_from', 'expected_revenue',
    'stage_id', 'user_id', 'lost_reason_id', 'date_closed', 'create_date',
    'lead_source_id', 'sector', 'specification_id',
    'city', 'state_id'
  ] as string[],

  // Lost opportunity detail fields (includes feedback if available)
  LOST_OPPORTUNITY_DETAIL: [
    'id', 'name', 'contact_name', 'email_from', 'phone', 'expected_revenue',
    'stage_id', 'user_id', 'team_id', 'partner_id', 'lost_reason_id',
    'date_closed', 'create_date', 'description',
    'lead_source_id', 'sector', 'specification_id',
    'city', 'state_id'
  ] as string[],

  // Lost reason fields
  LOST_REASON: [
    'id', 'name', 'active'
  ] as string[],

  // Won opportunity fields
  WON_OPPORTUNITY_LIST: [
    'id', 'name', 'contact_name', 'email_from', 'expected_revenue',
    'stage_id', 'user_id', 'team_id', 'date_closed', 'create_date',
    'lead_source_id', 'sector', 'specification_id',
    'city', 'state_id'
  ] as string[],

  // Won opportunity detail fields
  WON_OPPORTUNITY_DETAIL: [
    'id', 'name', 'contact_name', 'email_from', 'phone', 'expected_revenue',
    'stage_id', 'user_id', 'team_id', 'partner_id', 'source_id',
    'date_closed', 'create_date', 'description',
    'lead_source_id', 'sector', 'specification_id',
    'city', 'state_id'
  ] as string[],

  // Activity detail fields
  ACTIVITY_DETAIL: [
    'id', 'summary', 'activity_type_id', 'date_deadline', 'user_id',
    'res_id', 'state', 'note', 'res_name'
  ] as string[],

  // User fields
  USER_LIST: [
    'id', 'name', 'email', 'login', 'active'
  ] as string[],

  // Team fields
  TEAM_LIST: [
    'id', 'name', 'active', 'member_ids'
  ] as string[],

  // State/Territory fields (for geographic analysis)
  STATE_LIST: [
    'id', 'name', 'code', 'country_id'
  ] as string[],

  // RFQ/Color fields for tender analysis
  RFQ_COLOR_FIELDS: [
    'id', 'name', 'contact_name', 'email_from', 'expected_revenue',
    'stage_id', 'user_id', 'team_id', 'description', 'tender_rfq_date',
    'create_date', 'date_closed', 'city', 'state_id', 'partner_id'
  ] as string[]
};

// Response format options
export enum ResponseFormat {
  JSON = 'json',
  MARKDOWN = 'markdown',
  CSV = 'csv'
}

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
export const FIELD_PRESETS: Record<string, Record<string, string[]>> = {
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
export function resolveFields(
  fieldsParam: string | string[] | undefined,
  modelType: 'lead' | 'contact' | 'activity' | 'lost' | 'won' = 'lead',
  defaultPreset: string = 'basic'
): string[] {
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
  RESET_TIMEOUT_MS: 60000,  // 60 seconds

  // Number of test requests allowed in HALF_OPEN state
  HALF_OPEN_MAX_ATTEMPTS: 1,
} as const;

// Redis cache configuration (optional - for multi-instance deployments)
export const REDIS_CONFIG = {
  // Cache backend: 'memory' (default) or 'redis'
  CACHE_TYPE: (process.env.CACHE_TYPE || 'memory') as 'memory' | 'redis',

  // Redis connection URL (only used when CACHE_TYPE='redis')
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Prefix for all cache keys (to avoid conflicts with other apps)
  KEY_PREFIX: process.env.CACHE_KEY_PREFIX || 'odoo-crm:',
} as const;

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
} as const;

// =============================================================================
// COLOR EXTRACTION - Taxonomy and patterns for RFQ color analysis
// =============================================================================

/**
 * Color taxonomy mapping raw color names to standard categories.
 * Used to normalize extracted colors for consistent trend analysis.
 */
export const COLOR_TAXONOMY: Record<string, string[]> = {
  'White': ['white', 'off-white', 'ivory', 'cream', 'pearl', 'snow', 'alabaster'],
  'Black': ['black', 'charcoal', 'onyx', 'ebony', 'jet', 'midnight'],
  'Grey': ['grey', 'gray', 'silver', 'slate', 'ash', 'graphite', 'pewter', 'steel'],
  'Blue': ['blue', 'navy', 'navy blue', 'cobalt', 'azure', 'teal', 'turquoise', 'sapphire', 'indigo', 'cyan', 'royal blue', 'sky blue'],
  'Brown': ['brown', 'tan', 'beige', 'chocolate', 'coffee', 'espresso', 'mocha', 'taupe', 'bronze', 'copper', 'caramel', 'walnut'],
  'Green': ['green', 'olive', 'sage', 'mint', 'forest', 'emerald', 'lime', 'hunter', 'moss', 'seafoam'],
  'Red': ['red', 'maroon', 'burgundy', 'crimson', 'scarlet', 'ruby', 'wine', 'cherry', 'brick'],
  'Yellow': ['yellow', 'gold', 'golden', 'amber', 'mustard', 'lemon', 'canary', 'honey'],
  'Orange': ['orange', 'terracotta', 'rust', 'coral', 'peach', 'apricot', 'tangerine', 'burnt orange'],
  'Pink': ['pink', 'rose', 'blush', 'magenta', 'fuchsia', 'salmon', 'hot pink', 'dusty pink'],
  'Purple': ['purple', 'violet', 'lavender', 'plum', 'mauve', 'lilac', 'grape', 'amethyst'],
  'Other': [] // Catch-all for unrecognized colors
} as const;

/**
 * Regex patterns for extracting colors from description text.
 * SPECIFIED patterns are highest priority (industry specs like "9610 Pure Ash")
 * EXPLICIT patterns are reliable (e.g., "Color: Navy Blue")
 * CONTEXTUAL patterns catch standalone color words.
 */
export const COLOR_PATTERNS = {
  // NEW: Industry specification pattern - "Specified Colours = 9610 Pure Ash, White Pearl"
  SPECIFIED_COLORS: /Specified\s+Colou?rs?\s*[=:]\s*([^\n\r]+)/gi,
  // Match "color:" or "colour:" or "paint:" followed by color name
  EXPLICIT: /(?:colou?r|paint|finish|shade|panel|panels)[\s:]+([a-zA-Z\s-]+?)(?:[,\.\n\r]|$)/gi,
  // Match common color words as standalone terms
  CONTEXTUAL: /\b(white|off-white|black|charcoal|grey|gray|silver|blue|navy|teal|brown|tan|beige|green|olive|red|maroon|burgundy|yellow|gold|orange|coral|pink|rose|purple|violet|lavender|cream|ivory)\b/gi
} as const;

/**
 * Known product color codes mapped to color names and categories.
 * This lookup is used when only a numeric code is provided (e.g., "9610").
 * Can be extended or loaded from external source in future.
 */
export const PRODUCT_COLOR_CODES: Record<string, { name: string; category: string }> = {
  '9610': { name: 'Pure Ash', category: 'Grey' },
  '2440': { name: 'Deep Ocean', category: 'Blue' },
  '1001': { name: 'Classic White', category: 'White' },
  '2001': { name: 'Night Sky', category: 'Black' },
  // Add more codes as discovered from RFQ data
} as const;

/**
 * Color categories enum for schema validation
 */
export const COLOR_CATEGORIES = [
  'White', 'Black', 'Grey', 'Blue', 'Brown', 'Green',
  'Red', 'Yellow', 'Orange', 'Pink', 'Purple', 'Other', 'Unknown'
] as const;

export type ColorCategory = typeof COLOR_CATEGORIES[number];
