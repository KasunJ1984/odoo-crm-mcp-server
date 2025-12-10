import { z } from 'zod';
import { ResponseFormat } from '../constants.js';
export declare const PaginationSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
}, "strict", z.ZodTypeAny, {
    offset: number;
    limit: number;
    response_format: ResponseFormat;
}, {
    offset?: number | undefined;
    limit?: number | undefined;
    response_format?: ResponseFormat | undefined;
}>;
export declare const LeadSearchSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
} & {
    query: z.ZodOptional<z.ZodString>;
    stage_id: z.ZodOptional<z.ZodNumber>;
    stage_name: z.ZodOptional<z.ZodString>;
    user_id: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["lead", "opportunity"]>>;
    min_revenue: z.ZodOptional<z.ZodNumber>;
    max_revenue: z.ZodOptional<z.ZodNumber>;
    min_probability: z.ZodOptional<z.ZodNumber>;
    active_only: z.ZodDefault<z.ZodBoolean>;
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
    date_closed_from: z.ZodOptional<z.ZodString>;
    date_closed_to: z.ZodOptional<z.ZodString>;
    date_field: z.ZodDefault<z.ZodEnum<["create_date", "date_closed"]>>;
    team_id: z.ZodOptional<z.ZodNumber>;
    lead_source_id: z.ZodOptional<z.ZodNumber>;
    sector: z.ZodOptional<z.ZodString>;
    specification_id: z.ZodOptional<z.ZodNumber>;
    order_by: z.ZodDefault<z.ZodEnum<["create_date", "expected_revenue", "probability", "name", "date_closed"]>>;
    order_dir: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strict", z.ZodTypeAny, {
    offset: number;
    limit: number;
    response_format: ResponseFormat;
    active_only: boolean;
    date_field: "create_date" | "date_closed";
    order_by: "name" | "expected_revenue" | "probability" | "create_date" | "date_closed";
    order_dir: "asc" | "desc";
    stage_id?: number | undefined;
    user_id?: number | undefined;
    team_id?: number | undefined;
    lead_source_id?: number | undefined;
    sector?: string | undefined;
    specification_id?: number | undefined;
    type?: "lead" | "opportunity" | undefined;
    stage_name?: string | undefined;
    query?: string | undefined;
    min_revenue?: number | undefined;
    max_revenue?: number | undefined;
    min_probability?: number | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    date_closed_from?: string | undefined;
    date_closed_to?: string | undefined;
}, {
    stage_id?: number | undefined;
    user_id?: number | undefined;
    team_id?: number | undefined;
    lead_source_id?: number | undefined;
    sector?: string | undefined;
    specification_id?: number | undefined;
    type?: "lead" | "opportunity" | undefined;
    offset?: number | undefined;
    limit?: number | undefined;
    stage_name?: string | undefined;
    response_format?: ResponseFormat | undefined;
    query?: string | undefined;
    min_revenue?: number | undefined;
    max_revenue?: number | undefined;
    min_probability?: number | undefined;
    active_only?: boolean | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    date_closed_from?: string | undefined;
    date_closed_to?: string | undefined;
    date_field?: "create_date" | "date_closed" | undefined;
    order_by?: "name" | "expected_revenue" | "probability" | "create_date" | "date_closed" | undefined;
    order_dir?: "asc" | "desc" | undefined;
}>;
export declare const LeadDetailSchema: z.ZodObject<{
    lead_id: z.ZodNumber;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
}, "strict", z.ZodTypeAny, {
    response_format: ResponseFormat;
    lead_id: number;
}, {
    lead_id: number;
    response_format?: ResponseFormat | undefined;
}>;
export declare const PipelineSummarySchema: z.ZodObject<{
    team_id: z.ZodOptional<z.ZodNumber>;
    user_id: z.ZodOptional<z.ZodNumber>;
    include_lost: z.ZodDefault<z.ZodBoolean>;
    max_opps_per_stage: z.ZodDefault<z.ZodNumber>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
}, "strict", z.ZodTypeAny, {
    response_format: ResponseFormat;
    include_lost: boolean;
    max_opps_per_stage: number;
    user_id?: number | undefined;
    team_id?: number | undefined;
}, {
    user_id?: number | undefined;
    team_id?: number | undefined;
    response_format?: ResponseFormat | undefined;
    include_lost?: boolean | undefined;
    max_opps_per_stage?: number | undefined;
}>;
export declare const SalesAnalyticsSchema: z.ZodObject<{
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
    team_id: z.ZodOptional<z.ZodNumber>;
    include_by_salesperson: z.ZodDefault<z.ZodBoolean>;
    top_opportunities_count: z.ZodDefault<z.ZodNumber>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
}, "strict", z.ZodTypeAny, {
    response_format: ResponseFormat;
    include_by_salesperson: boolean;
    top_opportunities_count: number;
    team_id?: number | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
}, {
    team_id?: number | undefined;
    response_format?: ResponseFormat | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    include_by_salesperson?: boolean | undefined;
    top_opportunities_count?: number | undefined;
}>;
export declare const ContactSearchSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
} & {
    query: z.ZodOptional<z.ZodString>;
    is_company: z.ZodOptional<z.ZodBoolean>;
    has_opportunities: z.ZodOptional<z.ZodBoolean>;
    country: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    offset: number;
    limit: number;
    response_format: ResponseFormat;
    city?: string | undefined;
    is_company?: boolean | undefined;
    query?: string | undefined;
    has_opportunities?: boolean | undefined;
    country?: string | undefined;
}, {
    city?: string | undefined;
    is_company?: boolean | undefined;
    offset?: number | undefined;
    limit?: number | undefined;
    response_format?: ResponseFormat | undefined;
    query?: string | undefined;
    has_opportunities?: boolean | undefined;
    country?: string | undefined;
}>;
export declare const ActivitySummarySchema: z.ZodObject<{
    user_id: z.ZodOptional<z.ZodNumber>;
    days_ahead: z.ZodDefault<z.ZodNumber>;
    include_completed: z.ZodDefault<z.ZodBoolean>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
}, "strict", z.ZodTypeAny, {
    response_format: ResponseFormat;
    days_ahead: number;
    include_completed: boolean;
    user_id?: number | undefined;
}, {
    user_id?: number | undefined;
    response_format?: ResponseFormat | undefined;
    days_ahead?: number | undefined;
    include_completed?: boolean | undefined;
}>;
export declare const StageListSchema: z.ZodObject<{
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
}, "strict", z.ZodTypeAny, {
    response_format: ResponseFormat;
}, {
    response_format?: ResponseFormat | undefined;
}>;
export declare const LostReasonsListSchema: z.ZodObject<{
    include_inactive: z.ZodDefault<z.ZodBoolean>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
}, "strict", z.ZodTypeAny, {
    response_format: ResponseFormat;
    include_inactive: boolean;
}, {
    response_format?: ResponseFormat | undefined;
    include_inactive?: boolean | undefined;
}>;
export declare const LostAnalysisSchema: z.ZodObject<{
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
    user_id: z.ZodOptional<z.ZodNumber>;
    team_id: z.ZodOptional<z.ZodNumber>;
    lost_reason_id: z.ZodOptional<z.ZodNumber>;
    stage_id: z.ZodOptional<z.ZodNumber>;
    min_revenue: z.ZodOptional<z.ZodNumber>;
    group_by: z.ZodDefault<z.ZodEnum<["reason", "salesperson", "team", "stage", "month", "sector", "specification", "lead_source"]>>;
    include_top_lost: z.ZodDefault<z.ZodNumber>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
}, "strict", z.ZodTypeAny, {
    response_format: ResponseFormat;
    group_by: "sector" | "month" | "reason" | "salesperson" | "team" | "stage" | "specification" | "lead_source";
    include_top_lost: number;
    stage_id?: number | undefined;
    user_id?: number | undefined;
    team_id?: number | undefined;
    lost_reason_id?: number | undefined;
    min_revenue?: number | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
}, {
    stage_id?: number | undefined;
    user_id?: number | undefined;
    team_id?: number | undefined;
    lost_reason_id?: number | undefined;
    response_format?: ResponseFormat | undefined;
    min_revenue?: number | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    group_by?: "sector" | "month" | "reason" | "salesperson" | "team" | "stage" | "specification" | "lead_source" | undefined;
    include_top_lost?: number | undefined;
}>;
export declare const LostOpportunitiesSearchSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
} & {
    query: z.ZodOptional<z.ZodString>;
    lost_reason_id: z.ZodOptional<z.ZodNumber>;
    lost_reason_name: z.ZodOptional<z.ZodString>;
    user_id: z.ZodOptional<z.ZodNumber>;
    team_id: z.ZodOptional<z.ZodNumber>;
    stage_id: z.ZodOptional<z.ZodNumber>;
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
    min_revenue: z.ZodOptional<z.ZodNumber>;
    max_revenue: z.ZodOptional<z.ZodNumber>;
    lead_source_id: z.ZodOptional<z.ZodNumber>;
    sector: z.ZodOptional<z.ZodString>;
    specification_id: z.ZodOptional<z.ZodNumber>;
    order_by: z.ZodDefault<z.ZodEnum<["date_closed", "expected_revenue", "name", "create_date"]>>;
    order_dir: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strict", z.ZodTypeAny, {
    offset: number;
    limit: number;
    response_format: ResponseFormat;
    order_by: "name" | "expected_revenue" | "create_date" | "date_closed";
    order_dir: "asc" | "desc";
    stage_id?: number | undefined;
    user_id?: number | undefined;
    team_id?: number | undefined;
    lead_source_id?: number | undefined;
    sector?: string | undefined;
    specification_id?: number | undefined;
    lost_reason_id?: number | undefined;
    query?: string | undefined;
    min_revenue?: number | undefined;
    max_revenue?: number | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    lost_reason_name?: string | undefined;
}, {
    stage_id?: number | undefined;
    user_id?: number | undefined;
    team_id?: number | undefined;
    lead_source_id?: number | undefined;
    sector?: string | undefined;
    specification_id?: number | undefined;
    lost_reason_id?: number | undefined;
    offset?: number | undefined;
    limit?: number | undefined;
    response_format?: ResponseFormat | undefined;
    query?: string | undefined;
    min_revenue?: number | undefined;
    max_revenue?: number | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    order_by?: "name" | "expected_revenue" | "create_date" | "date_closed" | undefined;
    order_dir?: "asc" | "desc" | undefined;
    lost_reason_name?: string | undefined;
}>;
export declare const LostTrendsSchema: z.ZodObject<{
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
    granularity: z.ZodDefault<z.ZodEnum<["week", "month", "quarter"]>>;
    user_id: z.ZodOptional<z.ZodNumber>;
    team_id: z.ZodOptional<z.ZodNumber>;
    compare_to_won: z.ZodDefault<z.ZodBoolean>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
}, "strict", z.ZodTypeAny, {
    granularity: "month" | "week" | "quarter";
    response_format: ResponseFormat;
    compare_to_won: boolean;
    user_id?: number | undefined;
    team_id?: number | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
}, {
    user_id?: number | undefined;
    team_id?: number | undefined;
    granularity?: "month" | "week" | "quarter" | undefined;
    response_format?: ResponseFormat | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    compare_to_won?: boolean | undefined;
}>;
export declare const WonOpportunitiesSearchSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
} & {
    query: z.ZodOptional<z.ZodString>;
    user_id: z.ZodOptional<z.ZodNumber>;
    team_id: z.ZodOptional<z.ZodNumber>;
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
    min_revenue: z.ZodOptional<z.ZodNumber>;
    max_revenue: z.ZodOptional<z.ZodNumber>;
    stage_id: z.ZodOptional<z.ZodNumber>;
    lead_source_id: z.ZodOptional<z.ZodNumber>;
    sector: z.ZodOptional<z.ZodString>;
    specification_id: z.ZodOptional<z.ZodNumber>;
    order_by: z.ZodDefault<z.ZodEnum<["date_closed", "expected_revenue", "name", "create_date"]>>;
    order_dir: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strict", z.ZodTypeAny, {
    offset: number;
    limit: number;
    response_format: ResponseFormat;
    order_by: "name" | "expected_revenue" | "create_date" | "date_closed";
    order_dir: "asc" | "desc";
    stage_id?: number | undefined;
    user_id?: number | undefined;
    team_id?: number | undefined;
    lead_source_id?: number | undefined;
    sector?: string | undefined;
    specification_id?: number | undefined;
    query?: string | undefined;
    min_revenue?: number | undefined;
    max_revenue?: number | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
}, {
    stage_id?: number | undefined;
    user_id?: number | undefined;
    team_id?: number | undefined;
    lead_source_id?: number | undefined;
    sector?: string | undefined;
    specification_id?: number | undefined;
    offset?: number | undefined;
    limit?: number | undefined;
    response_format?: ResponseFormat | undefined;
    query?: string | undefined;
    min_revenue?: number | undefined;
    max_revenue?: number | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    order_by?: "name" | "expected_revenue" | "create_date" | "date_closed" | undefined;
    order_dir?: "asc" | "desc" | undefined;
}>;
export declare const WonAnalysisSchema: z.ZodObject<{
    group_by: z.ZodDefault<z.ZodEnum<["salesperson", "team", "stage", "month", "source", "sector", "specification", "lead_source"]>>;
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
    user_id: z.ZodOptional<z.ZodNumber>;
    team_id: z.ZodOptional<z.ZodNumber>;
    min_revenue: z.ZodOptional<z.ZodNumber>;
    include_top_won: z.ZodDefault<z.ZodNumber>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
}, "strict", z.ZodTypeAny, {
    response_format: ResponseFormat;
    group_by: "sector" | "month" | "salesperson" | "team" | "stage" | "specification" | "lead_source" | "source";
    include_top_won: number;
    user_id?: number | undefined;
    team_id?: number | undefined;
    min_revenue?: number | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
}, {
    user_id?: number | undefined;
    team_id?: number | undefined;
    response_format?: ResponseFormat | undefined;
    min_revenue?: number | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    group_by?: "sector" | "month" | "salesperson" | "team" | "stage" | "specification" | "lead_source" | "source" | undefined;
    include_top_won?: number | undefined;
}>;
export declare const WonTrendsSchema: z.ZodObject<{
    granularity: z.ZodDefault<z.ZodEnum<["week", "month", "quarter"]>>;
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
    user_id: z.ZodOptional<z.ZodNumber>;
    team_id: z.ZodOptional<z.ZodNumber>;
    compare_to_lost: z.ZodDefault<z.ZodBoolean>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
}, "strict", z.ZodTypeAny, {
    granularity: "month" | "week" | "quarter";
    response_format: ResponseFormat;
    compare_to_lost: boolean;
    user_id?: number | undefined;
    team_id?: number | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
}, {
    user_id?: number | undefined;
    team_id?: number | undefined;
    granularity?: "month" | "week" | "quarter" | undefined;
    response_format?: ResponseFormat | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    compare_to_lost?: boolean | undefined;
}>;
export declare const SalespeopleListSchema: z.ZodObject<{
    include_inactive: z.ZodDefault<z.ZodBoolean>;
    include_stats: z.ZodDefault<z.ZodBoolean>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
}, "strict", z.ZodTypeAny, {
    response_format: ResponseFormat;
    include_inactive: boolean;
    include_stats: boolean;
}, {
    response_format?: ResponseFormat | undefined;
    include_inactive?: boolean | undefined;
    include_stats?: boolean | undefined;
}>;
export declare const TeamsListSchema: z.ZodObject<{
    include_stats: z.ZodDefault<z.ZodBoolean>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
}, "strict", z.ZodTypeAny, {
    response_format: ResponseFormat;
    include_stats: boolean;
}, {
    response_format?: ResponseFormat | undefined;
    include_stats?: boolean | undefined;
}>;
export declare const ComparePerformanceSchema: z.ZodObject<{
    compare_type: z.ZodEnum<["salespeople", "teams", "periods"]>;
    entity_ids: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    period1_start: z.ZodOptional<z.ZodString>;
    period1_end: z.ZodOptional<z.ZodString>;
    period2_start: z.ZodOptional<z.ZodString>;
    period2_end: z.ZodOptional<z.ZodString>;
    metrics: z.ZodDefault<z.ZodArray<z.ZodEnum<["won_count", "won_revenue", "win_rate", "avg_deal_size", "avg_cycle_days"]>, "many">>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
}, "strict", z.ZodTypeAny, {
    compare_type: "periods" | "salespeople" | "teams";
    response_format: ResponseFormat;
    metrics: ("avg_deal_size" | "win_rate" | "won_count" | "won_revenue" | "avg_cycle_days")[];
    entity_ids?: number[] | undefined;
    period1_start?: string | undefined;
    period1_end?: string | undefined;
    period2_start?: string | undefined;
    period2_end?: string | undefined;
}, {
    compare_type: "periods" | "salespeople" | "teams";
    response_format?: ResponseFormat | undefined;
    entity_ids?: number[] | undefined;
    period1_start?: string | undefined;
    period1_end?: string | undefined;
    period2_start?: string | undefined;
    period2_end?: string | undefined;
    metrics?: ("avg_deal_size" | "win_rate" | "won_count" | "won_revenue" | "avg_cycle_days")[] | undefined;
}>;
export declare const ActivitySearchSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    response_format: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
} & {
    activity_type: z.ZodDefault<z.ZodEnum<["call", "meeting", "task", "email", "all"]>>;
    status: z.ZodDefault<z.ZodEnum<["overdue", "today", "upcoming", "done", "all"]>>;
    user_id: z.ZodOptional<z.ZodNumber>;
    lead_id: z.ZodOptional<z.ZodNumber>;
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    offset: number;
    limit: number;
    response_format: ResponseFormat;
    status: "overdue" | "today" | "upcoming" | "done" | "all";
    activity_type: "email" | "call" | "meeting" | "task" | "all";
    user_id?: number | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    lead_id?: number | undefined;
}, {
    user_id?: number | undefined;
    offset?: number | undefined;
    limit?: number | undefined;
    response_format?: ResponseFormat | undefined;
    status?: "overdue" | "today" | "upcoming" | "done" | "all" | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    lead_id?: number | undefined;
    activity_type?: "email" | "call" | "meeting" | "task" | "all" | undefined;
}>;
export declare const ExportDataSchema: z.ZodObject<{
    export_type: z.ZodEnum<["leads", "won", "lost", "contacts", "activities"]>;
    format: z.ZodDefault<z.ZodEnum<["csv", "json", "xlsx"]>>;
    filters: z.ZodOptional<z.ZodObject<{
        user_id: z.ZodOptional<z.ZodNumber>;
        team_id: z.ZodOptional<z.ZodNumber>;
        stage_id: z.ZodOptional<z.ZodNumber>;
        date_from: z.ZodOptional<z.ZodString>;
        date_to: z.ZodOptional<z.ZodString>;
        min_revenue: z.ZodOptional<z.ZodNumber>;
        max_revenue: z.ZodOptional<z.ZodNumber>;
        query: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        stage_id?: number | undefined;
        user_id?: number | undefined;
        team_id?: number | undefined;
        query?: string | undefined;
        min_revenue?: number | undefined;
        max_revenue?: number | undefined;
        date_from?: string | undefined;
        date_to?: string | undefined;
    }, {
        stage_id?: number | undefined;
        user_id?: number | undefined;
        team_id?: number | undefined;
        query?: string | undefined;
        min_revenue?: number | undefined;
        max_revenue?: number | undefined;
        date_from?: string | undefined;
        date_to?: string | undefined;
    }>>;
    fields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    max_records: z.ZodDefault<z.ZodNumber>;
    output_directory: z.ZodOptional<z.ZodString>;
    filename: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    format: "json" | "csv" | "xlsx";
    export_type: "leads" | "won" | "lost" | "contacts" | "activities";
    max_records: number;
    filename?: string | undefined;
    fields?: string[] | undefined;
    filters?: {
        stage_id?: number | undefined;
        user_id?: number | undefined;
        team_id?: number | undefined;
        query?: string | undefined;
        min_revenue?: number | undefined;
        max_revenue?: number | undefined;
        date_from?: string | undefined;
        date_to?: string | undefined;
    } | undefined;
    output_directory?: string | undefined;
}, {
    export_type: "leads" | "won" | "lost" | "contacts" | "activities";
    filename?: string | undefined;
    format?: "json" | "csv" | "xlsx" | undefined;
    fields?: string[] | undefined;
    filters?: {
        stage_id?: number | undefined;
        user_id?: number | undefined;
        team_id?: number | undefined;
        query?: string | undefined;
        min_revenue?: number | undefined;
        max_revenue?: number | undefined;
        date_from?: string | undefined;
        date_to?: string | undefined;
    } | undefined;
    max_records?: number | undefined;
    output_directory?: string | undefined;
}>;
export declare const CacheStatusSchema: z.ZodObject<{
    action: z.ZodDefault<z.ZodEnum<["status", "clear"]>>;
    cache_type: z.ZodDefault<z.ZodEnum<["all", "stages", "lost_reasons", "teams", "salespeople"]>>;
}, "strict", z.ZodTypeAny, {
    action: "status" | "clear";
    cache_type: "salespeople" | "teams" | "all" | "stages" | "lost_reasons";
}, {
    action?: "status" | "clear" | undefined;
    cache_type?: "salespeople" | "teams" | "all" | "stages" | "lost_reasons" | undefined;
}>;
export type LeadSearchInput = z.infer<typeof LeadSearchSchema>;
export type LeadDetailInput = z.infer<typeof LeadDetailSchema>;
export type PipelineSummaryInput = z.infer<typeof PipelineSummarySchema>;
export type SalesAnalyticsInput = z.infer<typeof SalesAnalyticsSchema>;
export type ContactSearchInput = z.infer<typeof ContactSearchSchema>;
export type ActivitySummaryInput = z.infer<typeof ActivitySummarySchema>;
export type StageListInput = z.infer<typeof StageListSchema>;
export type LostReasonsListInput = z.infer<typeof LostReasonsListSchema>;
export type LostAnalysisInput = z.infer<typeof LostAnalysisSchema>;
export type LostOpportunitiesSearchInput = z.infer<typeof LostOpportunitiesSearchSchema>;
export type LostTrendsInput = z.infer<typeof LostTrendsSchema>;
export type WonOpportunitiesSearchInput = z.infer<typeof WonOpportunitiesSearchSchema>;
export type WonAnalysisInput = z.infer<typeof WonAnalysisSchema>;
export type WonTrendsInput = z.infer<typeof WonTrendsSchema>;
export type SalespeopleListInput = z.infer<typeof SalespeopleListSchema>;
export type TeamsListInput = z.infer<typeof TeamsListSchema>;
export type ComparePerformanceInput = z.infer<typeof ComparePerformanceSchema>;
export type ActivitySearchInput = z.infer<typeof ActivitySearchSchema>;
export type ExportDataInput = z.infer<typeof ExportDataSchema>;
export type CacheStatusInput = z.infer<typeof CacheStatusSchema>;
//# sourceMappingURL=index.d.ts.map