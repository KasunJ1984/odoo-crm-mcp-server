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
// Odoo CRM field mappings for context efficiency
export const CRM_FIELDS = {
    // Minimal fields for list views (context-efficient)
    LEAD_LIST: [
        'id', 'name', 'contact_name', 'email_from', 'phone',
        'expected_revenue', 'probability', 'stage_id', 'create_date',
        'user_id', 'team_id'
    ],
    // Extended fields for lead list (includes address, source, tags)
    LEAD_LIST_EXTENDED: [
        'id', 'name', 'contact_name', 'email_from', 'phone',
        'expected_revenue', 'probability', 'stage_id', 'create_date',
        'user_id', 'team_id', 'street', 'city', 'country_id',
        'source_id', 'medium_id', 'campaign_id', 'tag_ids',
        'date_deadline', 'partner_id', 'description'
    ],
    // Detailed fields for single record views
    LEAD_DETAIL: [
        'id', 'name', 'contact_name', 'email_from', 'phone', 'mobile',
        'street', 'city', 'country_id', 'expected_revenue', 'probability',
        'stage_id', 'user_id', 'team_id', 'source_id', 'medium_id',
        'campaign_id', 'description', 'create_date', 'write_date',
        'date_deadline', 'date_closed', 'lost_reason_id', 'tag_ids',
        'partner_id', 'company_id', 'priority', 'type', 'active'
    ],
    // Fields for pipeline analysis
    PIPELINE_SUMMARY: [
        'stage_id', 'expected_revenue', 'probability', 'user_id', 'team_id'
    ],
    // Contact minimal fields
    CONTACT_LIST: [
        'id', 'name', 'email', 'phone', 'mobile', 'company_id', 'city', 'country_id'
    ],
    // Activity fields
    ACTIVITY: [
        'id', 'summary', 'activity_type_id', 'date_deadline', 'user_id', 'res_id', 'state'
    ],
    // Lost opportunity fields
    LOST_OPPORTUNITY_LIST: [
        'id', 'name', 'contact_name', 'email_from', 'expected_revenue',
        'stage_id', 'user_id', 'lost_reason_id', 'date_closed', 'create_date'
    ],
    // Lost opportunity detail fields (includes feedback if available)
    LOST_OPPORTUNITY_DETAIL: [
        'id', 'name', 'contact_name', 'email_from', 'phone', 'expected_revenue',
        'stage_id', 'user_id', 'team_id', 'partner_id', 'lost_reason_id',
        'date_closed', 'create_date', 'description'
    ],
    // Lost reason fields
    LOST_REASON: [
        'id', 'name', 'active'
    ],
    // Won opportunity fields
    WON_OPPORTUNITY_LIST: [
        'id', 'name', 'contact_name', 'email_from', 'expected_revenue',
        'stage_id', 'user_id', 'team_id', 'date_closed', 'create_date'
    ],
    // Won opportunity detail fields
    WON_OPPORTUNITY_DETAIL: [
        'id', 'name', 'contact_name', 'email_from', 'phone', 'expected_revenue',
        'stage_id', 'user_id', 'team_id', 'partner_id', 'source_id',
        'date_closed', 'create_date', 'description'
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
    ]
};
// Response format options
export var ResponseFormat;
(function (ResponseFormat) {
    ResponseFormat["JSON"] = "json";
    ResponseFormat["MARKDOWN"] = "markdown";
})(ResponseFormat || (ResponseFormat = {}));
//# sourceMappingURL=constants.js.map