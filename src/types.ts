// Odoo connection configuration
export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  password: string;
}

// Generic Odoo record
export interface OdooRecord {
  id: number;
  [key: string]: unknown;
}

// CRM Lead/Opportunity
export interface CrmLead extends OdooRecord {
  id: number;
  name: string;
  contact_name?: string;
  email_from?: string;
  phone?: string;
  mobile?: string;
  expected_revenue?: number;
  probability?: number;
  stage_id?: [number, string]; // [id, name]
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
  state_id?: [number, string];  // Direct field: [id, "Victoria"]
  country_id?: [number, string];
  street?: string;
  // Classification fields
  lead_source_id?: [number, string];
  sector?: string;
  specification_id?: [number, string];
}

// CRM Stage
export interface CrmStage extends OdooRecord {
  id: number;
  name: string;
  sequence: number;
  is_won?: boolean;
  fold?: boolean;
}

// Contact/Partner
export interface ResPartner extends OdooRecord {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  city?: string;
  state_id?: [number, string];  // [id, "New South Wales"]
  country_id?: [number, string];
  company_id?: [number, string];
  is_company?: boolean;
}

// Activity
export interface MailActivity extends OdooRecord {
  id: number;
  summary?: string;
  activity_type_id?: [number, string];
  date_deadline?: string;
  user_id?: [number, string];
  res_id?: number;
  state?: string;
}

// Pagination response wrapper
export interface PaginatedResponse<T> {
  [key: string]: unknown;
  total: number;
  count: number;
  offset: number;
  limit: number;
  items: T[];
  has_more: boolean;
  next_offset?: number;
  context_note?: string; // Helpful note about context management
}

// Pipeline summary statistics
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

// Sales analytics
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

// Activity summary
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

// Lost Reason
export interface CrmLostReason extends OdooRecord {
  id: number;
  name: string;
  active?: boolean;
}

// Country State (Australian states/territories)
export interface ResCountryState extends OdooRecord {
  id: number;
  name: string;
  code?: string;
  country_id?: [number, string];
}

// State with opportunity statistics
export interface StateWithStats extends ResCountryState {
  opportunity_count?: number;
  won_count?: number;
  lost_count?: number;
  total_revenue?: number;
}

// Lost Reason with count
export interface LostReasonWithCount extends CrmLostReason {
  opportunity_count: number;
}

// Lost Analysis Summary
export interface LostAnalysisSummary {
  [key: string]: unknown;
  period: string;
  total_lost: number;
  total_lost_revenue: number;
  avg_deal_size: number;
  // Win/loss context
  total_won?: number;
  total_won_revenue?: number;
  win_rate?: number;
  // Grouped data
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
  // Top lost opportunities
  top_lost?: Array<{
    id: number;
    name: string;
    revenue: number;
    reason: string;
    salesperson: string;
    date_closed: string;
  }>;
}

// Lost Opportunity (extended from CrmLead)
export interface LostOpportunity extends CrmLead {
  lost_reason_id?: [number, string];
  lost_feedback?: string;
}

// Lost Trends Summary
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
  // Insights
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

// Won Opportunity (same as CrmLead but for clarity)
export interface WonOpportunity extends CrmLead {
  date_closed?: string;
}

// Won Analysis Summary
export interface WonAnalysisSummary {
  [key: string]: unknown;
  period: string;
  total_won: number;
  total_won_revenue: number;
  avg_deal_size: number;
  avg_sales_cycle_days?: number;
  // Grouped data
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
  // Top won opportunities
  top_won?: Array<{
    id: number;
    name: string;
    revenue: number;
    salesperson: string;
    date_closed: string;
    sales_cycle_days?: number;
  }>;
}

// Won Trends Summary
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
  // Insights
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

// Salesperson with stats
export interface SalespersonWithStats {
  user_id: number;
  name: string;
  email?: string;
  opportunity_count?: number;
  active_revenue?: number;
  won_count?: number;
  won_revenue?: number;
}

// Sales Team with stats
export interface SalesTeamWithStats {
  team_id: number;
  name: string;
  member_count?: number;
  opportunity_count?: number;
  total_pipeline_revenue?: number;
  won_count?: number;
  won_revenue?: number;
}

// CRM Team
export interface CrmTeam extends OdooRecord {
  id: number;
  name: string;
  active?: boolean;
  member_ids?: number[];
}

// Res Users
export interface ResUsers extends OdooRecord {
  id: number;
  name: string;
  email?: string;
  login?: string;
  active?: boolean;
}

// Performance Comparison
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
    rank?: { [metric: string]: number };
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

// Activity Detail
export interface ActivityDetail extends MailActivity {
  res_name?: string;
  activity_status?: 'overdue' | 'today' | 'upcoming' | 'done';
}

// Export format type
export type ExportFormat = 'csv' | 'json' | 'xlsx';

// Export Result - File-based export (no base64)
export interface ExportResult {
  [key: string]: unknown;
  success: boolean;
  filename: string;
  file_path: string;           // Path to exported file
  record_count: number;
  total_available: number;     // Total records matching filter
  size_bytes: number;
  format: ExportFormat;
  mime_type: string;
  export_duration_ms: number;  // How long the export took
  warning?: string;            // Warning if not all records exported
  instructions: string;        // Next steps for the user
}

// Export progress tracking
export interface ExportProgress {
  current_batch: number;
  total_batches: number;
  records_exported: number;
  total_records: number;
  percent_complete: number;
  elapsed_ms: number;
}

// Pipeline Summary with weighted revenue
export interface PipelineSummaryWithWeighted extends PipelineSummary {
  weighted_revenue: number;
}

// Sales Analytics with weighted pipeline
export interface SalesAnalyticsWithWeighted extends SalesAnalytics {
  total_weighted_pipeline?: number;
  weighted_by_salesperson?: Array<{
    name: string;
    weighted_revenue: number;
  }>;
}

// State Comparison for geographic analysis
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

// ============================================
// Vector Database Types (for Qdrant + Voyage)
// ============================================

/**
 * Configuration for Qdrant vector database connection
 */
export interface VectorConfig {
  host: string;              // QDRANT_HOST - e.g., "http://localhost:6333"
  apiKey?: string;           // QDRANT_API_KEY - optional for local, required for cloud
  collectionName: string;    // QDRANT_COLLECTION - e.g., "odoo_crm_leads"
}

/**
 * Configuration for Voyage AI embedding service
 */
export interface EmbeddingConfig {
  apiKey: string;            // VOYAGE_API_KEY
  model: string;             // EMBEDDING_MODEL - "voyage-3-lite"
  dimensions: number;        // EMBEDDING_DIMENSIONS - 512 (voyage-3-lite)
}

/**
 * Metadata stored with each vector in Qdrant.
 * These fields enable filtering and are returned with search results.
 */
export interface VectorMetadata {
  // Core identifiers
  odoo_id: number;           // Original Odoo record ID
  name: string;              // Opportunity name

  // Stage and pipeline
  stage_id: number;
  stage_name: string;

  // Assignment
  user_id: number;
  user_name: string;
  team_id?: number;
  team_name?: string;

  // Business metrics
  expected_revenue: number;
  probability: number;

  // Status flags (for filtering)
  is_won: boolean;
  is_lost: boolean;
  is_active: boolean;

  // Classification
  sector?: string;
  specification_id?: number;
  specification_name?: string;
  lead_source_id?: number;
  lead_source_name?: string;

  // Location
  city?: string;
  state_id?: number;
  state_name?: string;

  // Lost analysis
  lost_reason_id?: number;
  lost_reason_name?: string;

  // Timestamps
  create_date: string;
  write_date: string;        // For sync conflict detection
  date_closed?: string;

  // Sync tracking
  sync_version: number;
  last_synced: string;
  truncated?: boolean;       // True if description was truncated

  // Original text (for display, not filtering)
  embedding_text: string;
}

/**
 * A single vector record to upsert into Qdrant
 */
export interface VectorRecord {
  id: string;                // String ID (Odoo ID as string)
  values: number[];          // 512-dimensional embedding vector (voyage-3-lite)
  metadata: VectorMetadata;
}

/**
 * Options for vector similarity search
 */
export interface VectorQueryOptions {
  vector: number[];          // Query embedding
  topK: number;              // Number of results (1-50)
  filter?: VectorFilter;     // Optional metadata filters
  minScore?: number;         // Minimum similarity score (default 0.6)
  includeMetadata?: boolean; // Include metadata in results (default true)
}

/**
 * Filter conditions for Qdrant queries.
 * Supports exact match, arrays ($in), and ranges.
 */
export interface VectorFilter {
  stage_id?: number | { $in: number[] };
  user_id?: number | { $in: number[] };
  team_id?: number;
  is_won?: boolean;
  is_lost?: boolean;
  is_active?: boolean;
  state_id?: number;
  sector?: string;
  lost_reason_id?: number;
  expected_revenue?: { $gte?: number; $lte?: number };
  create_date?: { $gte?: string; $lte?: string };
}

/**
 * A single match from vector search
 */
export interface VectorMatch {
  id: string;
  score: number;             // Cosine similarity (0-1)
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
  lead: CrmLead;             // Full Odoo lead record
  similarityScore: number;   // Raw cosine similarity (0-1)
  similarityPercent: number; // Human-readable percentage
  matchExplanation: string;  // e.g., "92% match - Very similar"
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
  centroidDistance: number;  // Average distance to centroid
  representativeDeals: Array<{
    id: number;
    name: string;
    similarity: number;
  }>;
  commonThemes: {
    topSectors: Array<{ sector: string; count: number }>;
    topLostReasons: Array<{ reason: string; count: number }>;
    avgRevenue: number;
    revenueRange: { min: number; max: number };
  };
  summary: string;           // AI-generated cluster description
}

/**
 * Result of pattern discovery analysis
 */
export interface PatternDiscoveryResult {
  analysisType: 'lost_reasons' | 'winning_factors' | 'deal_segments' | 'objection_themes';
  totalRecordsAnalyzed: number;
  numClusters: number;
  clusters: PatternCluster[];
  insights: string[];        // Key insights across all clusters
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
