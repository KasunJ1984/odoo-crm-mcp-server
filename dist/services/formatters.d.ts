import { ResponseFormat } from '../constants.js';
import type { CrmLead, PaginatedResponse, PipelineSummary, SalesAnalytics, ActivitySummary, ResPartner, LostReasonWithCount, LostAnalysisSummary, LostOpportunity, LostTrendsSummary, WonOpportunity, WonAnalysisSummary, WonTrendsSummary, SalespersonWithStats, SalesTeamWithStats, PerformanceComparison, ActivityDetail, ExportResult, PipelineSummaryWithWeighted, StateWithStats, StateComparison } from '../types.js';
export declare function formatCurrency(value: number | undefined | null): string;
export declare function formatPercent(value: number | undefined | null): string;
export declare function formatDate(dateStr: string | undefined | null): string;
export declare function getRelationName(field: [number, string] | undefined | null): string;
export declare function truncateText(text: string, maxLength?: number): string;
export declare function formatLeadListItem(lead: CrmLead): string;
export declare function formatLeadDetail(lead: CrmLead): string;
export declare function formatLeadList(data: PaginatedResponse<CrmLead>, format: ResponseFormat): string;
export declare function formatPipelineSummary(stages: PipelineSummary[], format: ResponseFormat): string;
export declare function formatSalesAnalytics(analytics: SalesAnalytics, format: ResponseFormat): string;
export declare function formatActivitySummary(summary: ActivitySummary, format: ResponseFormat): string;
export declare function formatContactList(data: PaginatedResponse<ResPartner>, format: ResponseFormat): string;
export declare function checkContextLimit(response: string): {
    ok: boolean;
    note?: string;
};
export declare function formatLostReasonsList(reasons: LostReasonWithCount[], format: ResponseFormat): string;
export declare function formatLostAnalysis(analysis: LostAnalysisSummary, groupBy: string, format: ResponseFormat): string;
export declare function formatLostOpportunitiesList(data: PaginatedResponse<LostOpportunity>, format: ResponseFormat): string;
export declare function formatLostTrends(trends: LostTrendsSummary, format: ResponseFormat): string;
export declare function formatWonOpportunitiesList(data: PaginatedResponse<WonOpportunity>, format: ResponseFormat): string;
export declare function formatWonAnalysis(analysis: WonAnalysisSummary, groupBy: string, format: ResponseFormat): string;
export declare function formatWonTrends(trends: WonTrendsSummary, format: ResponseFormat): string;
export declare function formatSalespeopleList(salespeople: SalespersonWithStats[], format: ResponseFormat): string;
export declare function formatTeamsList(teams: SalesTeamWithStats[], format: ResponseFormat): string;
export declare function formatPerformanceComparison(comparison: PerformanceComparison, format: ResponseFormat): string;
export declare function formatActivityList(data: PaginatedResponse<ActivityDetail>, format: ResponseFormat): string;
export declare function formatExportResult(result: ExportResult, format: ResponseFormat): string;
export declare function formatPipelineSummaryWithWeighted(stages: PipelineSummaryWithWeighted[], format: ResponseFormat): string;
export declare function formatLeadListItemExtended(lead: CrmLead): string;
export declare function formatStatesList(states: StateWithStats[], countryCode: string, format: ResponseFormat): string;
export declare function formatStateComparison(comparison: StateComparison, format: ResponseFormat): string;
/**
 * Format any array of records as CSV.
 * Handles special cases like Odoo relation fields [id, name] and arrays.
 *
 * @param records - Array of objects to format
 * @param fields - Optional field order (uses object keys if not specified)
 * @returns CSV string with header row
 *
 * @example
 * // Basic usage
 * formatRecordsAsCSV(leads)
 *
 * @example
 * // With specific field order
 * formatRecordsAsCSV(leads, ['id', 'name', 'email_from', 'expected_revenue'])
 */
export declare function formatRecordsAsCSV<T extends Record<string, unknown>>(records: T[], fields?: string[]): string;
/**
 * Information about a single Odoo field.
 * Used by the list_fields discovery tool.
 */
export interface FieldInfo {
    name: string;
    label: string;
    type: string;
    required: boolean;
    description?: string;
}
/**
 * Format a list of fields for display.
 * Supports markdown, JSON, and CSV output formats.
 *
 * @param model - The Odoo model name (e.g., 'crm.lead')
 * @param fields - Array of field information
 * @param format - Output format (markdown, json, csv)
 * @param modelType - The model type for showing presets ('lead', 'contact', etc.)
 * @returns Formatted string
 */
export declare function formatFieldsList(model: string, fields: FieldInfo[], format: ResponseFormat, modelType?: 'lead' | 'contact' | 'activity' | 'lost' | 'won'): string;
//# sourceMappingURL=formatters.d.ts.map