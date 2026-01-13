/**
 * Color analysis service for CRM RFQ data
 *
 * Provides color extraction, caching, and aggregation for trend analysis.
 * Used by the color trends and RFQ search MCP tools.
 */
import { extractColorFromDescription, extractEnhancedColors } from '../utils/color-extractor.js';
// Simple in-memory cache for color extractions (5-minute TTL)
const colorCache = new Map();
const COLOR_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
/**
 * Get color extraction for a lead with caching.
 * Cache prevents re-extraction during the same analysis session.
 *
 * @param leadId - The lead ID for cache key
 * @param description - The description text to extract from
 * @returns ColorExtraction result
 */
export function getLeadColor(leadId, description) {
    const now = Date.now();
    // Check cache
    const cached = colorCache.get(leadId);
    if (cached && (now - cached.timestamp) < COLOR_CACHE_TTL_MS) {
        return cached.extraction;
    }
    // Extract and cache
    const extraction = extractColorFromDescription(description);
    colorCache.set(leadId, { extraction, timestamp: now });
    return extraction;
}
/**
 * Clear expired entries from the color cache.
 * Call periodically to prevent memory bloat.
 */
export function cleanupColorCache() {
    const now = Date.now();
    let removed = 0;
    for (const [leadId, entry] of colorCache.entries()) {
        if ((now - entry.timestamp) >= COLOR_CACHE_TTL_MS) {
            colorCache.delete(leadId);
            removed++;
        }
    }
    return removed;
}
/**
 * Get current cache statistics for monitoring.
 */
export function getColorCacheStats() {
    return {
        size: colorCache.size,
        ttl_ms: COLOR_CACHE_TTL_MS
    };
}
/**
 * Enrich leads with color extraction data.
 * Adds a `color` property to each lead.
 *
 * @param leads - Array of CRM leads
 * @returns Array of leads with color data
 */
export function enrichLeadsWithColor(leads) {
    return leads.map(lead => ({
        ...lead,
        color: getLeadColor(lead.id, lead.description)
    }));
}
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
export function enrichLeadsWithEnhancedColor(leads) {
    return leads.map(lead => {
        const enhanced = extractEnhancedColors(lead.description);
        // Build legacy ColorExtraction for backward compatibility
        const legacy = enhanced.primary
            ? {
                raw_color: enhanced.primary.full_specification,
                color_category: enhanced.primary.color_category,
                // Map 'specified' to 'explicit' for legacy compatibility
                extraction_source: enhanced.extraction_source === 'specified'
                    ? 'explicit'
                    : enhanced.extraction_source
            }
            : { raw_color: null, color_category: 'Unknown', extraction_source: 'none' };
        return {
            ...lead,
            colors: enhanced,
            color: legacy // Backward compatibility
        };
    });
}
/**
 * Group leads by color category.
 *
 * @param leads - Array of leads with color data
 * @returns Map of color category to leads
 */
export function aggregateByColor(leads) {
    const grouped = new Map();
    for (const lead of leads) {
        const category = lead.color.color_category;
        const existing = grouped.get(category) || [];
        existing.push(lead);
        grouped.set(category, existing);
    }
    return grouped;
}
/**
 * Get period label from a date string.
 *
 * @param dateStr - ISO date string or undefined
 * @param granularity - 'month' or 'quarter'
 * @returns Period label (e.g., "Jan 2025", "2025-Q1", or "Unknown")
 */
export function getPeriodLabel(dateStr, granularity) {
    if (!dateStr)
        return 'Unknown';
    const date = new Date(dateStr);
    if (isNaN(date.getTime()))
        return 'Unknown';
    const year = date.getFullYear();
    const month = date.getMonth();
    if (granularity === 'quarter') {
        const quarter = Math.floor(month / 3) + 1;
        return `${year}-Q${quarter}`;
    }
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month]} ${year}`;
}
/**
 * Build complete color trends summary from leads.
 *
 * @param leads - Array of leads with color data
 * @param granularity - 'month' or 'quarter'
 * @param dateField - Which date field to use for grouping
 * @returns Complete ColorTrendsSummary
 */
export function buildColorTrendsSummary(leads, granularity, dateField) {
    // Group leads by period
    const periodMap = new Map();
    for (const lead of leads) {
        // Get date value from the specified field
        const dateValue = lead[dateField];
        const periodLabel = getPeriodLabel(dateValue, granularity);
        const existing = periodMap.get(periodLabel) || [];
        existing.push(lead);
        periodMap.set(periodLabel, existing);
    }
    // Sort periods chronologically (Unknown goes to end)
    const sortedPeriodLabels = Array.from(periodMap.keys()).sort((a, b) => {
        if (a === 'Unknown')
            return 1;
        if (b === 'Unknown')
            return -1;
        return a.localeCompare(b);
    });
    // Build period breakdown
    const periods = [];
    for (const periodLabel of sortedPeriodLabels) {
        const periodLeads = periodMap.get(periodLabel);
        const colorGroups = aggregateByColor(periodLeads);
        const colors = Array.from(colorGroups.entries())
            .filter(([cat]) => cat !== 'Unknown') // Exclude unknown from per-period breakdown
            .map(([category, catLeads]) => ({
            color_category: category,
            raw_colors: [...new Set(catLeads
                    .map(l => l.color.raw_color)
                    .filter((c) => c !== null))],
            count: catLeads.length,
            revenue: catLeads.reduce((sum, l) => sum + (l.expected_revenue || 0), 0),
            percentage: periodLeads.length > 0 ? (catLeads.length / periodLeads.length) * 100 : 0
        }))
            .sort((a, b) => b.count - a.count);
        periods.push({
            period_label: periodLabel,
            colors,
            total_count: periodLeads.length,
            total_revenue: periodLeads.reduce((sum, l) => sum + (l.expected_revenue || 0), 0)
        });
    }
    // Calculate overall statistics
    const allColorGroups = aggregateByColor(leads);
    const withColor = leads.filter(l => l.color.color_category !== 'Unknown');
    const withoutColor = leads.filter(l => l.color.color_category === 'Unknown');
    // Build color distribution (excluding Unknown)
    const colorDistribution = Array.from(allColorGroups.entries())
        .filter(([cat]) => cat !== 'Unknown')
        .map(([category, catLeads]) => ({
        color_category: category,
        count: catLeads.length,
        percentage: withColor.length > 0 ? (catLeads.length / withColor.length) * 100 : 0,
        avg_revenue: catLeads.length > 0
            ? catLeads.reduce((sum, l) => sum + (l.expected_revenue || 0), 0) / catLeads.length
            : 0
    }))
        .sort((a, b) => b.count - a.count);
    const topColor = colorDistribution[0];
    // Calculate trend direction for each color (compare first half vs second half of periods)
    const colorTrends = calculateColorTrends(periods, colorDistribution);
    // Build period string
    const periodStr = sortedPeriodLabels.length > 0
        ? `${sortedPeriodLabels[0]} to ${sortedPeriodLabels[sortedPeriodLabels.length - 1]}`
        : 'No data';
    return {
        period: periodStr,
        granularity,
        periods,
        overall_summary: {
            top_color: topColor?.color_category || 'N/A',
            top_color_count: topColor?.count || 0,
            top_color_percentage: topColor?.percentage || 0,
            total_rfqs_with_color: withColor.length,
            total_rfqs_without_color: withoutColor.length,
            color_detection_rate: leads.length > 0 ? (withColor.length / leads.length) * 100 : 0
        },
        color_distribution: colorDistribution,
        color_trends: colorTrends
    };
}
/**
 * Calculate trend direction for each color.
 * Compares first half of periods to second half.
 */
function calculateColorTrends(periods, colorDistribution) {
    // Need at least 2 periods to calculate trends
    if (periods.length < 2) {
        return colorDistribution.map(c => ({
            color_category: c.color_category,
            trend: 'stable',
            change_percent: 0
        }));
    }
    // Exclude "Unknown" period from trend calculation
    const validPeriods = periods.filter(p => p.period_label !== 'Unknown');
    if (validPeriods.length < 2) {
        return colorDistribution.map(c => ({
            color_category: c.color_category,
            trend: 'stable',
            change_percent: 0
        }));
    }
    const midpoint = Math.floor(validPeriods.length / 2);
    const firstHalf = validPeriods.slice(0, midpoint);
    const secondHalf = validPeriods.slice(midpoint);
    // Calculate count per color in each half
    const countInHalf = (half, category) => {
        return half.reduce((sum, period) => {
            const colorData = period.colors.find(c => c.color_category === category);
            return sum + (colorData?.count || 0);
        }, 0);
    };
    return colorDistribution.map(c => {
        const firstCount = countInHalf(firstHalf, c.color_category);
        const secondCount = countInHalf(secondHalf, c.color_category);
        // Avoid division by zero
        if (firstCount === 0 && secondCount === 0) {
            return { color_category: c.color_category, trend: 'stable', change_percent: 0 };
        }
        if (firstCount === 0) {
            return { color_category: c.color_category, trend: 'up', change_percent: 100 };
        }
        const changePercent = ((secondCount - firstCount) / firstCount) * 100;
        let trend;
        if (changePercent > 10) {
            trend = 'up';
        }
        else if (changePercent < -10) {
            trend = 'down';
        }
        else {
            trend = 'stable';
        }
        return {
            color_category: c.color_category,
            trend,
            change_percent: Math.round(changePercent)
        };
    });
}
/**
 * Filter leads by color category or raw color.
 *
 * @param leads - Array of leads with color data
 * @param options - Filter options
 * @returns Filtered leads
 */
export function filterLeadsByColor(leads, options) {
    let filtered = leads;
    // Filter by category
    if (options.color_category) {
        filtered = filtered.filter(l => l.color.color_category === options.color_category);
    }
    // Filter by raw color (partial match)
    if (options.raw_color) {
        const searchTerm = options.raw_color.toLowerCase();
        filtered = filtered.filter(l => l.color.raw_color?.toLowerCase().includes(searchTerm));
    }
    // Exclude no-color by default unless specifically included
    if (!options.include_no_color && !options.color_category && !options.raw_color) {
        filtered = filtered.filter(l => l.color.color_category !== 'Unknown');
    }
    return filtered;
}
//# sourceMappingURL=color-service.js.map