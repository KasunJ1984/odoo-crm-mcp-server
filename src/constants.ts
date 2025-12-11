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
  ] as string[]
};

// Response format options
export enum ResponseFormat {
  JSON = 'json',
  MARKDOWN = 'markdown'
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
