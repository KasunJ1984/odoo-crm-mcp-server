export interface OdooConfig {
    url: string;
    db: string;
    username: string;
    password: string;
}
export interface OdooRecord {
    id: number;
    [key: string]: unknown;
}
export interface CrmLead extends OdooRecord {
    id: number;
    name: string;
    contact_name?: string;
    email_from?: string;
    phone?: string;
    mobile?: string;
    expected_revenue?: number;
    probability?: number;
    stage_id?: [number, string];
    user_id?: [number, string];
    team_id?: [number, string];
    create_date?: string;
    write_date?: string;
    date_deadline?: string;
    date_closed?: string;
    description?: string;
    partner_id?: [number, string];
    company_id?: [number, string];
    priority?: string;
    type?: 'lead' | 'opportunity';
    active?: boolean;
    lost_reason_id?: [number, string];
    source_id?: [number, string];
    medium_id?: [number, string];
    campaign_id?: [number, string];
    tag_ids?: number[];
    city?: string;
    state_id?: [number, string];
    country_id?: [number, string];
    street?: string;
    lead_source_id?: [number, string];
    sector?: string;
    specification_id?: [number, string];
}
export interface CrmStage extends OdooRecord {
    id: number;
    name: string;
    sequence: number;
    is_won?: boolean;
    fold?: boolean;
}
export interface ResPartner extends OdooRecord {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    mobile?: string;
    city?: string;
    state_id?: [number, string];
    country_id?: [number, string];
    company_id?: [number, string];
    is_company?: boolean;
}
export interface MailActivity extends OdooRecord {
    id: number;
    summary?: string;
    activity_type_id?: [number, string];
    date_deadline?: string;
    user_id?: [number, string];
    res_id?: number;
    state?: string;
}
export interface PaginatedResponse<T> {
    [key: string]: unknown;
    total: number;
    count: number;
    offset: number;
    limit: number;
    items: T[];
    has_more: boolean;
    next_offset?: number;
    context_note?: string;
}
export interface PipelineSummary {
    [key: string]: unknown;
    stage_name: string;
    stage_id: number;
    count: number;
    total_revenue: number;
    avg_probability: number;
    opportunities: Array<{
        id: number;
        name: string;
        expected_revenue: number;
        probability: number;
    }>;
}
export interface SalesAnalytics {
    [key: string]: unknown;
    period: string;
    total_leads: number;
    total_opportunities: number;
    total_won: number;
    total_lost: number;
    total_revenue_expected: number;
    total_revenue_won: number;
    conversion_rate: number;
    avg_deal_size: number;
    by_stage: Array<{
        stage: string;
        count: number;
        revenue: number;
    }>;
    by_salesperson?: Array<{
        name: string;
        count: number;
        revenue: number;
        won: number;
    }>;
    top_opportunities: Array<{
        id: number;
        name: string;
        revenue: number;
        probability: number;
        stage: string;
    }>;
}
export interface ActivitySummary {
    [key: string]: unknown;
    total_activities: number;
    overdue: number;
    today: number;
    upcoming: number;
    by_type: Array<{
        type: string;
        count: number;
        overdue: number;
    }>;
    by_user: Array<{
        user: string;
        total: number;
        overdue: number;
    }>;
}
export interface CrmLostReason extends OdooRecord {
    id: number;
    name: string;
    active?: boolean;
}
export interface ResCountryState extends OdooRecord {
    id: number;
    name: string;
    code?: string;
    country_id?: [number, string];
}
export interface StateWithStats extends ResCountryState {
    opportunity_count?: number;
    won_count?: number;
    lost_count?: number;
    total_revenue?: number;
}
export interface LostReasonWithCount extends CrmLostReason {
    opportunity_count: number;
}
export interface LostAnalysisSummary {
    [key: string]: unknown;
    period: string;
    total_lost: number;
    total_lost_revenue: number;
    avg_deal_size: number;
    total_won?: number;
    total_won_revenue?: number;
    win_rate?: number;
    by_reason?: Array<{
        reason_id: number;
        reason_name: string;
        count: number;
        percentage: number;
        lost_revenue: number;
        avg_deal: number;
    }>;
    by_salesperson?: Array<{
        user_id: number;
        user_name: string;
        count: number;
        percentage: number;
        lost_revenue: number;
        avg_deal: number;
    }>;
    by_team?: Array<{
        team_id: number;
        team_name: string;
        count: number;
        percentage: number;
        lost_revenue: number;
        avg_deal: number;
    }>;
    by_stage?: Array<{
        stage_id: number;
        stage_name: string;
        count: number;
        percentage: number;
        lost_revenue: number;
        avg_deal: number;
    }>;
    by_month?: Array<{
        month: string;
        count: number;
        lost_revenue: number;
    }>;
    by_sector?: Array<{
        sector: string;
        count: number;
        percentage: number;
        lost_revenue: number;
        avg_deal: number;
    }>;
    by_specification?: Array<{
        specification_id: number;
        specification_name: string;
        count: number;
        percentage: number;
        lost_revenue: number;
        avg_deal: number;
    }>;
    by_lead_source?: Array<{
        lead_source_id: number;
        lead_source_name: string;
        count: number;
        percentage: number;
        lost_revenue: number;
        avg_deal: number;
    }>;
    by_state?: Array<{
        state_id: number;
        state_name: string;
        count: number;
        percentage: number;
        lost_revenue: number;
        avg_deal: number;
    }>;
    by_city?: Array<{
        city: string;
        count: number;
        percentage: number;
        lost_revenue: number;
        avg_deal: number;
    }>;
    top_lost?: Array<{
        id: number;
        name: string;
        revenue: number;
        reason: string;
        salesperson: string;
        date_closed: string;
    }>;
}
export interface LostOpportunity extends CrmLead {
    lost_reason_id?: [number, string];
    lost_feedback?: string;
}
export interface LostTrendsSummary {
    [key: string]: unknown;
    period: string;
    granularity: string;
    periods: Array<{
        period_label: string;
        lost_count: number;
        lost_revenue: number;
        won_count?: number;
        won_revenue?: number;
        win_rate?: number;
        top_lost_reason?: string;
    }>;
    avg_monthly_lost: number;
    avg_monthly_revenue: number;
    worst_period?: {
        label: string;
        lost_count: number;
        win_rate?: number;
    };
    best_period?: {
        label: string;
        lost_count: number;
        win_rate?: number;
    };
    most_common_reason?: string;
}
export interface WonOpportunity extends CrmLead {
    date_closed?: string;
}
export interface WonAnalysisSummary {
    [key: string]: unknown;
    period: string;
    total_won: number;
    total_won_revenue: number;
    avg_deal_size: number;
    avg_sales_cycle_days?: number;
    by_salesperson?: Array<{
        user_id: number;
        user_name: string;
        count: number;
        percentage: number;
        won_revenue: number;
        avg_deal: number;
        avg_cycle_days?: number;
    }>;
    by_team?: Array<{
        team_id: number;
        team_name: string;
        count: number;
        percentage: number;
        won_revenue: number;
        avg_deal: number;
    }>;
    by_stage?: Array<{
        stage_id: number;
        stage_name: string;
        count: number;
        percentage: number;
        won_revenue: number;
        avg_deal: number;
    }>;
    by_month?: Array<{
        month: string;
        count: number;
        won_revenue: number;
    }>;
    by_source?: Array<{
        source_id: number;
        source_name: string;
        count: number;
        percentage: number;
        won_revenue: number;
        avg_deal: number;
    }>;
    by_sector?: Array<{
        sector: string;
        count: number;
        percentage: number;
        won_revenue: number;
        avg_deal: number;
    }>;
    by_specification?: Array<{
        specification_id: number;
        specification_name: string;
        count: number;
        percentage: number;
        won_revenue: number;
        avg_deal: number;
    }>;
    by_lead_source?: Array<{
        lead_source_id: number;
        lead_source_name: string;
        count: number;
        percentage: number;
        won_revenue: number;
        avg_deal: number;
    }>;
    by_state?: Array<{
        state_id: number;
        state_name: string;
        count: number;
        percentage: number;
        won_revenue: number;
        avg_deal: number;
    }>;
    by_city?: Array<{
        city: string;
        count: number;
        percentage: number;
        won_revenue: number;
        avg_deal: number;
    }>;
    top_won?: Array<{
        id: number;
        name: string;
        revenue: number;
        salesperson: string;
        date_closed: string;
        sales_cycle_days?: number;
    }>;
}
export interface WonTrendsSummary {
    [key: string]: unknown;
    period: string;
    granularity: string;
    periods: Array<{
        period_label: string;
        won_count: number;
        won_revenue: number;
        lost_count?: number;
        lost_revenue?: number;
        win_rate?: number;
        avg_deal_size: number;
    }>;
    avg_period_won: number;
    avg_period_revenue: number;
    best_period?: {
        label: string;
        won_count: number;
        won_revenue: number;
        win_rate?: number;
    };
    worst_period?: {
        label: string;
        won_count: number;
        won_revenue: number;
        win_rate?: number;
    };
    avg_deal_size_trend?: 'increasing' | 'decreasing' | 'stable';
}
export interface SalespersonWithStats {
    user_id: number;
    name: string;
    email?: string;
    opportunity_count?: number;
    active_revenue?: number;
    won_count?: number;
    won_revenue?: number;
}
export interface SalesTeamWithStats {
    team_id: number;
    name: string;
    member_count?: number;
    opportunity_count?: number;
    total_pipeline_revenue?: number;
    won_count?: number;
    won_revenue?: number;
}
export interface CrmTeam extends OdooRecord {
    id: number;
    name: string;
    active?: boolean;
    member_ids?: number[];
}
export interface ResUsers extends OdooRecord {
    id: number;
    name: string;
    email?: string;
    login?: string;
    active?: boolean;
}
export interface PerformanceComparison {
    [key: string]: unknown;
    compare_type: 'salespeople' | 'teams' | 'periods';
    entities?: Array<{
        id: number;
        name: string;
        won_count: number;
        won_revenue: number;
        win_rate: number;
        avg_deal_size: number;
        avg_cycle_days: number;
        rank?: {
            [metric: string]: number;
        };
    }>;
    periods?: Array<{
        label: string;
        start: string;
        end: string;
        won_count: number;
        won_revenue: number;
        win_rate: number;
        avg_deal_size: number;
        avg_cycle_days: number;
    }>;
    benchmarks?: {
        avg_won_count: number;
        avg_won_revenue: number;
        avg_win_rate: number;
        avg_deal_size: number;
        avg_cycle_days: number;
    };
    period_change?: {
        won_count_change: number;
        won_revenue_change: number;
        win_rate_change: number;
        avg_deal_size_change: number;
        avg_cycle_days_change: number;
    };
}
export interface ActivityDetail extends MailActivity {
    res_name?: string;
    activity_status?: 'overdue' | 'today' | 'upcoming' | 'done';
}
export type ExportFormat = 'csv' | 'json' | 'xlsx';
export interface ExportResult {
    [key: string]: unknown;
    success: boolean;
    filename: string;
    file_path: string;
    record_count: number;
    total_available: number;
    size_bytes: number;
    format: ExportFormat;
    mime_type: string;
    export_duration_ms: number;
    warning?: string;
    instructions: string;
}
export interface ExportProgress {
    current_batch: number;
    total_batches: number;
    records_exported: number;
    total_records: number;
    percent_complete: number;
    elapsed_ms: number;
}
export interface PipelineSummaryWithWeighted extends PipelineSummary {
    weighted_revenue: number;
}
export interface SalesAnalyticsWithWeighted extends SalesAnalytics {
    total_weighted_pipeline?: number;
    weighted_by_salesperson?: Array<{
        name: string;
        weighted_revenue: number;
    }>;
}
export interface StateComparison {
    [key: string]: unknown;
    period?: string;
    states: Array<{
        state_id: number;
        state_name: string;
        state_code?: string;
        won_count: number;
        lost_count: number;
        won_revenue: number;
        lost_revenue: number;
        win_rate: number;
        avg_deal_size: number;
        total_opportunities?: number;
    }>;
    totals?: {
        total_won: number;
        total_lost: number;
        total_won_revenue: number;
        total_lost_revenue: number;
        overall_win_rate: number;
    };
}
/**
 * Result of extracting a color from description text
 */
export interface ColorExtraction {
    /** The exact color text extracted (e.g., "navy blue") */
    raw_color: string | null;
    /** Normalized category (e.g., "Blue") */
    color_category: string;
    /** How the color was detected */
    extraction_source: 'explicit' | 'contextual' | 'none';
}
/**
 * Structured color specification from industry product codes
 * Example: "9610 Pure Ash" => { code: "9610", name: "Pure Ash", full_spec: "9610 Pure Ash" }
 */
export interface ProductColorSpecification {
    /** Numeric product code (e.g., "9610", "2440") - null if no code */
    color_code: string | null;
    /** Color name without code (e.g., "Pure Ash", "White Pearl") */
    color_name: string;
    /** Original full specification as written */
    full_specification: string;
    /** Normalized category (e.g., "Grey" for "Pure Ash") */
    color_category: string;
}
/**
 * Enhanced color extraction result with multi-color support
 * Used for industry specifications like "Specified Colours = 9610 Pure Ash, White Pearl"
 */
export interface EnhancedColorExtraction {
    /** Primary color (first extracted or most prominent) */
    primary: ProductColorSpecification | null;
    /** All colors found in description */
    all_colors: ProductColorSpecification[];
    /** How colors were detected: 'specified' for industry specs, 'explicit'/'contextual' for generic */
    extraction_source: 'specified' | 'explicit' | 'contextual' | 'none';
    /** Total color count */
    color_count: number;
}
/**
 * CRM Lead extended with color extraction data
 */
export interface LeadWithColor extends CrmLead {
    /** Extracted color information */
    color: ColorExtraction;
    /** RFQ tender date (custom field) */
    tender_rfq_date?: string;
}
/**
 * CRM Lead with enhanced multi-color extraction data
 * Includes both legacy 'color' field and new 'colors' field for backward compatibility
 */
export interface LeadWithEnhancedColor extends CrmLead {
    /** Enhanced color extraction with multi-color support */
    colors: EnhancedColorExtraction;
    /** Legacy: kept for backward compatibility */
    color: ColorExtraction;
    /** RFQ tender date (custom field) */
    tender_rfq_date?: string;
}
/**
 * Color statistics for a single time period
 */
export interface ColorTrendPeriod {
    /** Period label (e.g., "Jan 2025", "2025-Q1") */
    period_label: string;
    /** Color breakdown for this period */
    colors: Array<{
        color_category: string;
        raw_colors: string[];
        count: number;
        revenue: number;
        percentage: number;
    }>;
    /** Total RFQs in this period */
    total_count: number;
    /** Total revenue in this period */
    total_revenue: number;
}
/**
 * Complete color trends analysis summary
 */
export interface ColorTrendsSummary {
    [key: string]: unknown;
    /** Date range analyzed */
    period: string;
    /** Time grouping used */
    granularity: 'month' | 'quarter';
    /** Period-by-period breakdown */
    periods: ColorTrendPeriod[];
    /** Overall statistics */
    overall_summary: {
        top_color: string;
        top_color_count: number;
        top_color_percentage: number;
        total_rfqs_with_color: number;
        total_rfqs_without_color: number;
        color_detection_rate: number;
    };
    /** Distribution across all colors */
    color_distribution: Array<{
        color_category: string;
        count: number;
        percentage: number;
        avg_revenue: number;
    }>;
    /** Trend direction for each color */
    color_trends?: Array<{
        color_category: string;
        trend: 'up' | 'down' | 'stable';
        change_percent: number;
    }>;
}
/**
 * Paginated search results for RFQs filtered by color
 */
export interface RfqSearchResult extends PaginatedResponse<LeadWithColor> {
    /** Which color filter was applied, if any */
    color_filter_applied: string | null;
}
//# sourceMappingURL=types.d.ts.map