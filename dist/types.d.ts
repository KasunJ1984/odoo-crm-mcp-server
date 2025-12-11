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
 * Configuration for Qdrant vector database connection
 */
export interface VectorConfig {
    host: string;
    apiKey?: string;
    collectionName: string;
}
/**
 * Configuration for Voyage AI embedding service
 */
export interface EmbeddingConfig {
    apiKey: string;
    model: string;
    dimensions: number;
}
/**
 * Metadata stored with each vector in Qdrant.
 * These fields enable filtering and are returned with search results.
 */
export interface VectorMetadata {
    odoo_id: number;
    name: string;
    stage_id: number;
    stage_name: string;
    user_id: number;
    user_name: string;
    team_id?: number;
    team_name?: string;
    expected_revenue: number;
    probability: number;
    is_won: boolean;
    is_lost: boolean;
    is_active: boolean;
    sector?: string;
    specification_id?: number;
    specification_name?: string;
    lead_source_id?: number;
    lead_source_name?: string;
    city?: string;
    state_id?: number;
    state_name?: string;
    lost_reason_id?: number;
    lost_reason_name?: string;
    create_date: string;
    write_date: string;
    date_closed?: string;
    sync_version: number;
    last_synced: string;
    truncated?: boolean;
    embedding_text: string;
}
/**
 * A single vector record to upsert into Qdrant
 */
export interface VectorRecord {
    id: string;
    values: number[];
    metadata: VectorMetadata;
}
/**
 * Options for vector similarity search
 */
export interface VectorQueryOptions {
    vector: number[];
    topK: number;
    filter?: VectorFilter;
    minScore?: number;
    includeMetadata?: boolean;
}
/**
 * Filter conditions for Qdrant queries.
 * Supports exact match, arrays ($in), and ranges.
 */
export interface VectorFilter {
    stage_id?: number | {
        $in: number[];
    };
    user_id?: number | {
        $in: number[];
    };
    team_id?: number;
    is_won?: boolean;
    is_lost?: boolean;
    is_active?: boolean;
    state_id?: number;
    sector?: string;
    lost_reason_id?: number;
    expected_revenue?: {
        $gte?: number;
        $lte?: number;
    };
    create_date?: {
        $gte?: string;
        $lte?: string;
    };
}
/**
 * A single match from vector search
 */
export interface VectorMatch {
    id: string;
    score: number;
    metadata?: VectorMetadata;
}
/**
 * Result of a vector search query
 */
export interface VectorQueryResult {
    matches: VectorMatch[];
    searchTimeMs: number;
}
/**
 * Progress tracking during sync operations
 */
export interface SyncProgress {
    phase: 'fetching' | 'embedding' | 'upserting' | 'deleting';
    currentBatch: number;
    totalBatches: number;
    recordsProcessed: number;
    totalRecords: number;
    percentComplete: number;
    elapsedMs: number;
    estimatedRemainingMs?: number;
}
/**
 * Result of a sync operation
 */
export interface SyncResult {
    success: boolean;
    recordsSynced: number;
    recordsFailed: number;
    recordsDeleted: number;
    durationMs: number;
    syncVersion: number;
    errors?: string[];
}
/**
 * Current status of vector infrastructure
 */
export interface VectorStatus {
    enabled: boolean;
    qdrantConnected: boolean;
    voyageConnected: boolean;
    collectionName: string;
    totalVectors: number;
    lastSync: string | null;
    syncVersion: number;
    circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    errorMessage?: string;
}
/**
 * A semantic search result with enriched lead data
 */
export interface SemanticMatch {
    lead: CrmLead;
    similarityScore: number;
    similarityPercent: number;
    matchExplanation: string;
}
/**
 * Complete result of semantic search
 */
export interface SemanticSearchResult {
    items: SemanticMatch[];
    total: number;
    queryEmbeddingMs: number;
    vectorSearchMs: number;
    odooEnrichmentMs: number;
    searchMode: 'semantic' | 'hybrid';
}
/**
 * A cluster of similar opportunities (for pattern discovery)
 */
export interface PatternCluster {
    clusterId: number;
    size: number;
    centroidDistance: number;
    representativeDeals: Array<{
        id: number;
        name: string;
        similarity: number;
    }>;
    commonThemes: {
        topSectors: Array<{
            sector: string;
            count: number;
        }>;
        topLostReasons: Array<{
            reason: string;
            count: number;
        }>;
        avgRevenue: number;
        revenueRange: {
            min: number;
            max: number;
        };
    };
    summary: string;
}
/**
 * Result of pattern discovery analysis
 */
export interface PatternDiscoveryResult {
    analysisType: 'lost_reasons' | 'winning_factors' | 'deal_segments' | 'objection_themes';
    totalRecordsAnalyzed: number;
    numClusters: number;
    clusters: PatternCluster[];
    insights: string[];
    durationMs: number;
}
/**
 * Circuit breaker state for resilience
 */
export interface CircuitBreakerState {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failures: number;
    lastFailure: number | null;
    lastStateChange: number;
    secondsUntilRetry?: number;
}
//# sourceMappingURL=types.d.ts.map