/**
 * Notes Parser Utility
 *
 * Simple, flexible extraction of structured data from CRM internal notes.
 * Parses "Specified X = Y" patterns and other key-value formats.
 */
import { stripHtml } from './html-utils.js';
/**
 * Parse a specific field from notes using a field pattern.
 *
 * @param description - The raw description HTML
 * @param fieldPattern - The field to extract (e.g., "Specified Colours", "Specified System")
 * @returns The extracted value or null if not found
 *
 * @example
 * parseNotesField("<p>Specified Colours = Oyster Grey</p>", "Specified Colours")
 * // Returns: "Oyster Grey"
 */
export function parseNotesField(description, fieldPattern) {
    if (!description)
        return null;
    const cleanText = stripHtml(description);
    // Escape special regex characters in the field pattern
    const escapedPattern = fieldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match pattern: "Field Name = value" or "Field Name: value"
    // Capture until the next "Specified X =" field or end of text
    const regex = new RegExp(`${escapedPattern}\\s*[=:]\\s*(.+?)(?=\\s*Specified\\s+\\w+\\s*[=:]|$)`, 'i');
    const match = regex.exec(cleanText);
    if (!match?.[1])
        return null;
    const value = match[1].trim();
    // Return null for empty or whitespace-only values
    return value.length > 0 ? value : null;
}
/**
 * Parse all "Specified X = Y" fields from notes.
 *
 * @param description - The raw description HTML
 * @returns Object with field names as keys and values
 *
 * @example
 * parseAllNotesFields("<p>Specified System = Floor Mount</p><p>Specified Colours = Grey</p>")
 * // Returns: { "Specified System": "Floor Mount", "Specified Colours": "Grey" }
 */
export function parseAllNotesFields(description) {
    if (!description)
        return {};
    const cleanText = stripHtml(description);
    // Match all "Specified X = value" patterns
    // Capture until the next "Specified X =" field or end of text
    const regex = /Specified\s+(\w+)\s*[=:]\s*(.+?)(?=\s*Specified\s+\w+\s*[=:]|$)/gi;
    const result = {};
    let match;
    while ((match = regex.exec(cleanText)) !== null) {
        const fieldName = `Specified ${match[1]}`;
        const value = match[2].trim();
        if (value.length > 0) {
            result[fieldName] = value;
        }
    }
    return result;
}
/**
 * Get period label from a date string.
 *
 * @param dateStr - ISO date string
 * @param granularity - 'month' or 'quarter'
 * @returns Period label (e.g., "Jan 2025", "2025-Q1")
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
 * Aggregate extracted values by value (count occurrences).
 *
 * @param items - Array of leads with extracted values
 * @param topN - Limit to top N results (0 = all)
 * @returns Aggregated values sorted by count descending
 */
export function aggregateByValue(items, topN = 0) {
    // Filter out null values
    const validItems = items.filter(i => i.extracted_value !== null);
    // Group by value
    const grouped = new Map();
    for (const item of validItems) {
        const value = item.extracted_value;
        const existing = grouped.get(value) || { count: 0, revenue: 0 };
        existing.count++;
        existing.revenue += item.expected_revenue || 0;
        grouped.set(value, existing);
    }
    // Convert to array and calculate percentages
    const total = validItems.length;
    const result = Array.from(grouped.entries())
        .map(([value, data]) => ({
        value,
        count: data.count,
        total_revenue: data.revenue,
        percentage: total > 0 ? (data.count / total) * 100 : 0
    }))
        .sort((a, b) => b.count - a.count);
    // Apply topN limit
    if (topN > 0 && result.length > topN) {
        return result.slice(0, topN);
    }
    return result;
}
/**
 * Aggregate extracted values by time period.
 *
 * @param items - Array of leads with extracted values
 * @param granularity - 'month' or 'quarter'
 * @returns Period aggregations sorted chronologically
 */
export function aggregateByPeriod(items, granularity) {
    // Filter out null values
    const validItems = items.filter(i => i.extracted_value !== null);
    // Group by period first, then by value within each period
    const periodMap = new Map();
    for (const item of validItems) {
        const period = getPeriodLabel(item.date_value, granularity);
        const existing = periodMap.get(period) || [];
        existing.push(item);
        periodMap.set(period, existing);
    }
    // Build period aggregations
    const periods = [];
    for (const [period, periodItems] of periodMap.entries()) {
        const values = aggregateByValue(periodItems, 10); // Top 10 per period
        const totalRevenue = periodItems.reduce((sum, i) => sum + (i.expected_revenue || 0), 0);
        periods.push({
            period,
            values,
            total_count: periodItems.length,
            total_revenue: totalRevenue
        });
    }
    // Sort periods chronologically (Unknown at end)
    periods.sort((a, b) => {
        if (a.period === 'Unknown')
            return 1;
        if (b.period === 'Unknown')
            return -1;
        return a.period.localeCompare(b.period);
    });
    return periods;
}
//# sourceMappingURL=notes-parser.js.map