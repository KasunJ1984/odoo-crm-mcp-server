import { z } from 'zod';
import { CONTEXT_LIMITS, ResponseFormat } from '../constants.js';
// Common pagination schema
export const PaginationSchema = z.object({
    limit: z.number()
        .int()
        .min(1)
        .max(CONTEXT_LIMITS.MAX_PAGE_SIZE)
        .default(CONTEXT_LIMITS.DEFAULT_PAGE_SIZE)
        .describe(`Number of records to return (1-${CONTEXT_LIMITS.MAX_PAGE_SIZE}, default: ${CONTEXT_LIMITS.DEFAULT_PAGE_SIZE})`),
    offset: z.number()
        .int()
        .min(0)
        .default(0)
        .describe('Number of records to skip for pagination'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' for human-readable or 'json' for structured data")
}).strict();
// Lead/Opportunity search schema
export const LeadSearchSchema = PaginationSchema.extend({
    query: z.string()
        .max(200)
        .optional()
        .describe('Search text to match against lead name, contact, or email'),
    stage_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by specific stage ID'),
    stage_name: z.string()
        .optional()
        .describe('Filter by stage name (partial match)'),
    user_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by salesperson user ID'),
    type: z.enum(['lead', 'opportunity'])
        .optional()
        .describe("Filter by type: 'lead' or 'opportunity'"),
    min_revenue: z.number()
        .min(0)
        .optional()
        .describe('Minimum expected revenue'),
    max_revenue: z.number()
        .min(0)
        .optional()
        .describe('Maximum expected revenue'),
    min_probability: z.number()
        .min(0)
        .max(100)
        .optional()
        .describe('Minimum probability (0-100)'),
    active_only: z.boolean()
        .default(true)
        .describe('Include only active records (default: true)'),
    date_from: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Filter leads on or after this date (YYYY-MM-DD), applies to date_field'),
    date_to: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Filter leads on or before this date (YYYY-MM-DD), applies to date_field'),
    date_closed_from: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Closed on or after this date (YYYY-MM-DD)'),
    date_closed_to: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Closed on or before this date (YYYY-MM-DD)'),
    date_field: z.enum(['create_date', 'date_closed'])
        .default('create_date')
        .describe("Which date field date_from/date_to applies to: 'create_date' or 'date_closed'"),
    team_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by sales team ID'),
    lead_source_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by lead source ID'),
    sector: z.string()
        .optional()
        .describe('Filter by sector (partial match)'),
    specification_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by specification ID'),
    state_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by Australian state/territory ID'),
    state_name: z.string()
        .max(100)
        .optional()
        .describe("Filter by state name (partial match). Examples: 'Victoria', 'NSW', 'Queensland'"),
    city: z.string()
        .max(100)
        .optional()
        .describe("Filter by city name (partial match). Examples: 'Melbourne', 'Sydney'"),
    order_by: z.enum(['create_date', 'expected_revenue', 'probability', 'name', 'date_closed'])
        .default('create_date')
        .describe('Field to sort by'),
    order_dir: z.enum(['asc', 'desc'])
        .default('desc')
        .describe('Sort direction')
}).strict();
// Single lead detail schema
export const LeadDetailSchema = z.object({
    lead_id: z.number()
        .int()
        .positive()
        .describe('The ID of the lead/opportunity to retrieve'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Pipeline summary schema
export const PipelineSummarySchema = z.object({
    team_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by sales team ID'),
    user_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by salesperson user ID'),
    include_lost: z.boolean()
        .default(false)
        .describe('Include lost opportunities in summary'),
    max_opps_per_stage: z.number()
        .int()
        .min(0)
        .max(10)
        .default(3)
        .describe('Max opportunities to list per stage (0-10, set 0 for counts only)'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Sales analytics schema
export const SalesAnalyticsSchema = z.object({
    date_from: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Start date for analysis period (YYYY-MM-DD)'),
    date_to: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('End date for analysis period (YYYY-MM-DD)'),
    team_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by sales team ID'),
    include_by_salesperson: z.boolean()
        .default(true)
        .describe('Include breakdown by salesperson'),
    top_opportunities_count: z.number()
        .int()
        .min(0)
        .max(10)
        .default(5)
        .describe('Number of top opportunities to include (0-10)'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Contact search schema
export const ContactSearchSchema = PaginationSchema.extend({
    query: z.string()
        .max(200)
        .optional()
        .describe('Search text to match against name, email, or phone'),
    is_company: z.boolean()
        .optional()
        .describe('Filter: true for companies only, false for individuals only'),
    has_opportunities: z.boolean()
        .optional()
        .describe('Filter contacts that have associated opportunities'),
    country: z.string()
        .optional()
        .describe('Filter by country name (partial match)'),
    state_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by Australian state/territory ID'),
    state_name: z.string()
        .max(100)
        .optional()
        .describe("Filter by state name (partial match). Examples: 'Victoria', 'NSW', 'Queensland'"),
    city: z.string()
        .optional()
        .describe('Filter by city name (partial match)')
}).strict();
// Activity summary schema
export const ActivitySummarySchema = z.object({
    user_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter activities by assigned user ID'),
    days_ahead: z.number()
        .int()
        .min(1)
        .max(90)
        .default(7)
        .describe('Number of days ahead to include for upcoming activities'),
    include_completed: z.boolean()
        .default(false)
        .describe('Include completed activities in summary'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Stage list schema
export const StageListSchema = z.object({
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Lost reasons list schema
export const LostReasonsListSchema = z.object({
    include_inactive: z.boolean()
        .default(false)
        .describe('Include inactive/archived reasons'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Lost analysis schema
export const LostAnalysisSchema = z.object({
    date_from: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Start date filter (YYYY-MM-DD)'),
    date_to: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('End date filter (YYYY-MM-DD)'),
    user_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by salesperson user ID'),
    team_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by sales team ID'),
    lost_reason_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by specific lost reason ID'),
    stage_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by stage when lost'),
    min_revenue: z.number()
        .min(0)
        .optional()
        .describe('Minimum revenue threshold'),
    group_by: z.enum(['reason', 'salesperson', 'team', 'stage', 'month', 'sector', 'specification', 'lead_source', 'state', 'city'])
        .default('reason')
        .describe("Group results by: 'reason', 'salesperson', 'team', 'stage', 'month', 'sector', 'specification', 'lead_source', 'state', or 'city'"),
    include_top_lost: z.number()
        .int()
        .min(0)
        .max(20)
        .default(5)
        .describe('Number of top lost opportunities to include (0-20)'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Lost opportunities search schema
export const LostOpportunitiesSearchSchema = PaginationSchema.extend({
    query: z.string()
        .max(200)
        .optional()
        .describe('Search text to match against opportunity name, contact, or email'),
    lost_reason_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by lost reason ID'),
    lost_reason_name: z.string()
        .optional()
        .describe('Filter by lost reason name (partial match)'),
    user_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by salesperson user ID'),
    team_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by sales team ID'),
    stage_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by stage when lost'),
    date_from: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Lost after this date (YYYY-MM-DD). Defaults to 90 days ago if neither date_from nor date_to specified.'),
    date_to: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Lost before this date (YYYY-MM-DD). If neither date specified, defaults to last 90 days.'),
    min_revenue: z.number()
        .min(0)
        .optional()
        .describe('Minimum expected revenue'),
    max_revenue: z.number()
        .min(0)
        .optional()
        .describe('Maximum expected revenue'),
    lead_source_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by lead source ID'),
    sector: z.string()
        .optional()
        .describe('Filter by sector (partial match)'),
    specification_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by specification ID'),
    state_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by Australian state/territory ID'),
    state_name: z.string()
        .max(100)
        .optional()
        .describe("Filter by state name (partial match). Examples: 'Victoria', 'NSW', 'Queensland'"),
    city: z.string()
        .max(100)
        .optional()
        .describe("Filter by city name (partial match). Examples: 'Melbourne', 'Sydney'"),
    order_by: z.enum(['date_closed', 'expected_revenue', 'name', 'create_date'])
        .default('date_closed')
        .describe('Field to sort by'),
    order_dir: z.enum(['asc', 'desc'])
        .default('desc')
        .describe('Sort direction')
}).strict();
// Lost trends schema
export const LostTrendsSchema = z.object({
    date_from: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Start date (YYYY-MM-DD)'),
    date_to: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('End date (YYYY-MM-DD)'),
    granularity: z.enum(['week', 'month', 'quarter'])
        .default('month')
        .describe("Time period granularity: 'week', 'month', or 'quarter'"),
    user_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by salesperson user ID'),
    team_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by sales team ID'),
    compare_to_won: z.boolean()
        .default(true)
        .describe('Include won comparison for win/loss ratio'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Won opportunities search schema
export const WonOpportunitiesSearchSchema = PaginationSchema.extend({
    query: z.string()
        .max(200)
        .optional()
        .describe('Search text to match against opportunity name, contact, or email'),
    user_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by salesperson user ID'),
    team_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by sales team ID'),
    date_from: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Won after this date (YYYY-MM-DD), filter on date_closed'),
    date_to: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Won before this date (YYYY-MM-DD), filter on date_closed'),
    min_revenue: z.number()
        .min(0)
        .optional()
        .describe('Minimum expected revenue'),
    max_revenue: z.number()
        .min(0)
        .optional()
        .describe('Maximum expected revenue'),
    stage_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by final stage when won'),
    lead_source_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by lead source ID'),
    sector: z.string()
        .optional()
        .describe('Filter by sector (partial match)'),
    specification_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by specification ID'),
    state_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by Australian state/territory ID'),
    state_name: z.string()
        .max(100)
        .optional()
        .describe("Filter by state name (partial match). Examples: 'Victoria', 'NSW', 'Queensland'"),
    city: z.string()
        .max(100)
        .optional()
        .describe("Filter by city name (partial match). Examples: 'Melbourne', 'Sydney'"),
    order_by: z.enum(['date_closed', 'expected_revenue', 'name', 'create_date'])
        .default('date_closed')
        .describe('Field to sort by'),
    order_dir: z.enum(['asc', 'desc'])
        .default('desc')
        .describe('Sort direction')
}).strict();
// Won analysis schema
export const WonAnalysisSchema = z.object({
    group_by: z.enum(['salesperson', 'team', 'stage', 'month', 'source', 'sector', 'specification', 'lead_source', 'state', 'city'])
        .default('salesperson')
        .describe("Group results by: 'salesperson', 'team', 'stage', 'month', 'source', 'sector', 'specification', 'lead_source', 'state', or 'city'"),
    date_from: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Start date (YYYY-MM-DD)'),
    date_to: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('End date (YYYY-MM-DD)'),
    user_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by salesperson'),
    team_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by team'),
    min_revenue: z.number()
        .min(0)
        .optional()
        .describe('Minimum revenue threshold'),
    include_top_won: z.number()
        .int()
        .min(0)
        .max(20)
        .default(5)
        .describe('Number of top won deals to include (0-20)'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Won trends schema
export const WonTrendsSchema = z.object({
    granularity: z.enum(['week', 'month', 'quarter'])
        .default('month')
        .describe("Time period granularity: 'week', 'month', or 'quarter'"),
    date_from: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Start date (YYYY-MM-DD)'),
    date_to: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('End date (YYYY-MM-DD)'),
    user_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by salesperson user ID'),
    team_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by sales team ID'),
    compare_to_lost: z.boolean()
        .default(true)
        .describe('Include lost comparison for win/loss ratio'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Salespeople list schema
export const SalespeopleListSchema = z.object({
    include_inactive: z.boolean()
        .default(false)
        .describe('Include users with no active opportunities'),
    include_stats: z.boolean()
        .default(true)
        .describe('Include opportunity count per user'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Sales teams list schema
export const TeamsListSchema = z.object({
    include_stats: z.boolean()
        .default(true)
        .describe('Include member count and opportunity stats'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Compare performance schema
export const ComparePerformanceSchema = z.object({
    compare_type: z.enum(['salespeople', 'teams', 'periods'])
        .describe("Comparison type: 'salespeople', 'teams', or 'periods'"),
    entity_ids: z.array(z.number().int().positive())
        .max(10)
        .optional()
        .describe('Specific user_ids or team_ids to compare (max 10)'),
    period1_start: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('First period start (YYYY-MM-DD), for period comparison'),
    period1_end: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('First period end (YYYY-MM-DD)'),
    period2_start: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Second period start (YYYY-MM-DD)'),
    period2_end: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Second period end (YYYY-MM-DD)'),
    metrics: z.array(z.enum(['won_count', 'won_revenue', 'win_rate', 'avg_deal_size', 'avg_cycle_days']))
        .default(['won_count', 'won_revenue', 'win_rate', 'avg_deal_size', 'avg_cycle_days'])
        .describe('Metrics to compare'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Activity search schema
export const ActivitySearchSchema = PaginationSchema.extend({
    activity_type: z.enum(['call', 'meeting', 'task', 'email', 'all'])
        .default('all')
        .describe("Filter by activity type or 'all'"),
    status: z.enum(['overdue', 'today', 'upcoming', 'done', 'all'])
        .default('all')
        .describe("Filter by status: 'overdue', 'today', 'upcoming', 'done', or 'all'"),
    user_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by assigned user'),
    lead_id: z.number()
        .int()
        .positive()
        .optional()
        .describe('Filter by linked opportunity'),
    date_from: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Activity due date from (YYYY-MM-DD)'),
    date_to: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Activity due date to (YYYY-MM-DD)')
}).strict();
// Export data schema - writes directly to filesystem (no base64)
export const ExportDataSchema = z.object({
    export_type: z.enum(['leads', 'won', 'lost', 'contacts', 'activities'])
        .describe("Type of data to export: 'leads', 'won', 'lost', 'contacts', or 'activities'"),
    format: z.enum(['csv', 'json', 'xlsx'])
        .default('xlsx')
        .describe("Export format: 'xlsx' (Excel, recommended), 'csv', or 'json'"),
    filters: z.object({
        user_id: z.number().int().positive().optional(),
        team_id: z.number().int().positive().optional(),
        stage_id: z.number().int().positive().optional(),
        date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        min_revenue: z.number().min(0).optional(),
        max_revenue: z.number().min(0).optional(),
        query: z.string().max(200).optional(),
        state_id: z.number().int().positive().optional(),
        state_name: z.string().max(100).optional(),
        city: z.string().max(100).optional()
    }).optional()
        .describe('Filters to apply (same as respective search tools)'),
    fields: z.array(z.string())
        .optional()
        .describe('Specific fields to include (default: all available for export type)'),
    max_records: z.number()
        .int()
        .min(1)
        .max(10000)
        .default(1000)
        .describe('Maximum records to export (1-10000). Large exports are fetched in batches.'),
    output_directory: z.string()
        .optional()
        .describe('Directory to write export file. Defaults to /mnt/user-data/outputs or MCP_EXPORT_DIR env var'),
    filename: z.string()
        .regex(/^[a-zA-Z0-9_-]+$/)
        .max(50)
        .optional()
        .describe('Custom filename (without extension). Default: auto-generated with timestamp')
}).strict();
// States list schema (for geographic analysis)
export const StatesListSchema = z.object({
    country_code: z.string()
        .default('AU')
        .describe('Country code (default: AU for Australia)'),
    include_stats: z.boolean()
        .default(true)
        .describe('Include opportunity counts and revenue per state'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Compare states schema (for geographic comparison)
export const CompareStatesSchema = z.object({
    state_ids: z.array(z.number().int().positive())
        .max(10)
        .optional()
        .describe('Specific state IDs to compare (empty for all states)'),
    metrics: z.array(z.enum(['won_count', 'lost_count', 'won_revenue', 'lost_revenue', 'win_rate', 'avg_deal_size']))
        .default(['won_count', 'lost_count', 'win_rate', 'won_revenue'])
        .describe('Metrics to compare across states'),
    date_from: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Start date filter (YYYY-MM-DD)'),
    date_to: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('End date filter (YYYY-MM-DD)'),
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
// Cache management schema
export const CacheStatusSchema = z.object({
    action: z.enum(['status', 'clear'])
        .default('status')
        .describe("Action: 'status' to view cache info, 'clear' to invalidate cached data"),
    cache_type: z.enum(['all', 'stages', 'lost_reasons', 'teams', 'salespeople', 'states'])
        .default('all')
        .describe("Which cache to clear (only used with action='clear'). 'all' clears everything.")
}).strict();
// Health check schema
export const HealthCheckSchema = z.object({
    response_format: z.nativeEnum(ResponseFormat)
        .default(ResponseFormat.MARKDOWN)
        .describe("Output format: 'markdown' or 'json'")
}).strict();
//# sourceMappingURL=index.js.map