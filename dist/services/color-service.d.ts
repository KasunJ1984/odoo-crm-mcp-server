/**
 * Color analysis service for CRM RFQ data
 *
 * Provides color extraction, caching, and aggregation for trend analysis.
 * Used by the color trends and RFQ search MCP tools.
 */
import type { ColorExtraction, CrmLead, LeadWithColor, LeadWithEnhancedColor, ColorTrendsSummary } from '../types.js';
/**
 * Get color extraction for a lead with caching.
 * Cache prevents re-extraction during the same analysis session.
 *
 * @param leadId - The lead ID for cache key
 * @param description - The description text to extract from
 * @returns ColorExtraction result
 */
export declare function getLeadColor(leadId: number, description: string | null | undefined): ColorExtraction;
/**
 * Clear expired entries from the color cache.
 * Call periodically to prevent memory bloat.
 */
export declare function cleanupColorCache(): number;
/**
 * Get current cache statistics for monitoring.
 */
export declare function getColorCacheStats(): {
    size: number;
    ttl_ms: number;
};
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
 *
 * @example
 * const leads = await searchLeads({ date_from: '2024-01-01' });
 * const enriched = enrichLeadsWithEnhancedColor(leads);
 * // enriched[0].colors.primary.color_code === "9610"
 * // enriched[0].colors.all_colors.length === 2 (for multi-color specs)
 * // enriched[0].color still works (backward compatible)
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
 * Get period label from a date string.
 *
 * @param dateStr - ISO date string or undefined
 * @param granularity - 'month' or 'quarter'
 * @returns Period label (e.g., "Jan 2025", "2025-Q1", or "Unknown")
 */
export declare function getPeriodLabel(dateStr: string | undefined | null, granularity: 'month' | 'quarter'): string;
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