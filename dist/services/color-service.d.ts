/**
 * Color analysis service for CRM RFQ data
 *
 * Provides color extraction and aggregation for trend analysis.
 * Used by the color trends and RFQ search MCP tools.
 *
 * NOTE: This service uses the legacy color extraction system which
 * categorizes colors into 11 standard categories. For raw text analysis
 * without categorization, use notes-parser.ts instead.
 */
import type { CrmLead, LeadWithColor, LeadWithEnhancedColor, ColorTrendsSummary } from '../types.js';
/**
 * Enrich leads with color extraction data.
 * Adds a `color` property to each lead.
 *
 * @param leads - Array of CRM leads
 * @returns Array of leads with color data
 */
export declare function enrichLeadsWithColor(leads: CrmLead[]): LeadWithColor[];
/**
 * Enrich leads with enhanced multi-color extraction data.
 * Populates BOTH legacy 'color' field AND new 'colors' field for backward compatibility.
 *
 * Use this function when you need:
 * - Industry color specifications (e.g., "Specified Colours = 9610 Pure Ash")
 * - Multiple colors per lead
 * - Color codes separate from color names
 *
 * @param leads - Array of CRM leads
 * @returns Array of leads with enhanced color data
 */
export declare function enrichLeadsWithEnhancedColor(leads: CrmLead[]): LeadWithEnhancedColor[];
/**
 * Group leads by color category.
 *
 * @param leads - Array of leads with color data
 * @returns Map of color category to leads
 */
export declare function aggregateByColor(leads: LeadWithColor[]): Map<string, LeadWithColor[]>;
/**
 * Build complete color trends summary from leads.
 *
 * @param leads - Array of leads with color data
 * @param granularity - 'month' or 'quarter'
 * @param dateField - Which date field to use for grouping
 * @returns Complete ColorTrendsSummary
 */
export declare function buildColorTrendsSummary(leads: LeadWithColor[], granularity: 'month' | 'quarter', dateField: string): ColorTrendsSummary;
/**
 * Filter leads by color category or raw color.
 *
 * @param leads - Array of leads with color data
 * @param options - Filter options
 * @returns Filtered leads
 */
export declare function filterLeadsByColor(leads: LeadWithColor[], options: {
    color_category?: string;
    raw_color?: string;
    include_no_color?: boolean;
}): LeadWithColor[];
//# sourceMappingURL=color-service.d.ts.map