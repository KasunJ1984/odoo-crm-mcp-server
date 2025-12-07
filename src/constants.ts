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

// Odoo CRM field mappings for context efficiency
export const CRM_FIELDS = {
  // Minimal fields for list views (context-efficient)
  LEAD_LIST: [
    'id', 'name', 'contact_name', 'email_from', 'phone',
    'expected_revenue', 'probability', 'stage_id', 'create_date',
    'user_id', 'team_id'
  ] as string[],

  // Extended fields for lead list (includes address, source, tags)
  LEAD_LIST_EXTENDED: [
    'id', 'name', 'contact_name', 'email_from', 'phone',
    'expected_revenue', 'probability', 'stage_id', 'create_date',
    'user_id', 'team_id', 'street', 'city', 'country_id',
    'source_id', 'medium_id', 'campaign_id', 'tag_ids',
    'date_deadline', 'partner_id', 'description'
  ] as string[],
  
  // Detailed fields for single record views
  LEAD_DETAIL: [
    'id', 'name', 'contact_name', 'email_from', 'phone', 'mobile',
    'street', 'city', 'country_id', 'expected_revenue', 'probability',
    'stage_id', 'user_id', 'team_id', 'source_id', 'medium_id',
    'campaign_id', 'description', 'create_date', 'write_date',
    'date_deadline', 'date_closed', 'lost_reason_id', 'tag_ids',
    'partner_id', 'company_id', 'priority', 'type', 'active'
  ] as string[],
  
  // Fields for pipeline analysis
  PIPELINE_SUMMARY: [
    'stage_id', 'expected_revenue', 'probability', 'user_id', 'team_id'
  ] as string[],
  
  // Contact minimal fields
  CONTACT_LIST: [
    'id', 'name', 'email', 'phone', 'mobile', 'company_id', 'city', 'country_id'
  ] as string[],
  
  // Activity fields
  ACTIVITY: [
    'id', 'summary', 'activity_type_id', 'date_deadline', 'user_id', 'res_id', 'state'
  ] as string[],

  // Lost opportunity fields
  LOST_OPPORTUNITY_LIST: [
    'id', 'name', 'contact_name', 'email_from', 'expected_revenue',
    'stage_id', 'user_id', 'lost_reason_id', 'date_closed', 'create_date'
  ] as string[],

  // Lost opportunity detail fields (includes feedback if available)
  LOST_OPPORTUNITY_DETAIL: [
    'id', 'name', 'contact_name', 'email_from', 'phone', 'expected_revenue',
    'stage_id', 'user_id', 'team_id', 'partner_id', 'lost_reason_id',
    'date_closed', 'create_date', 'description'
  ] as string[],

  // Lost reason fields
  LOST_REASON: [
    'id', 'name', 'active'
  ] as string[],

  // Won opportunity fields
  WON_OPPORTUNITY_LIST: [
    'id', 'name', 'contact_name', 'email_from', 'expected_revenue',
    'stage_id', 'user_id', 'team_id', 'date_closed', 'create_date'
  ] as string[],

  // Won opportunity detail fields
  WON_OPPORTUNITY_DETAIL: [
    'id', 'name', 'contact_name', 'email_from', 'phone', 'expected_revenue',
    'stage_id', 'user_id', 'team_id', 'partner_id', 'source_id',
    'date_closed', 'create_date', 'description'
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
  ] as string[]
};

// Response format options
export enum ResponseFormat {
  JSON = 'json',
  MARKDOWN = 'markdown'
}
