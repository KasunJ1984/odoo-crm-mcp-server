/**
 * Notes Parser Utility
 *
 * Simple, flexible extraction of structured data from CRM internal notes.
 * Parses "Specified X = Y" patterns and other key-value formats.
 */
/**
 * Extracted field from notes
 */
export interface ExtractedField {
    field_name: string;
    value: string;
}
/**
 * Lead with extracted notes data
 */
export interface LeadWithExtractedNotes {
    lead_id: number;
    lead_name: string;
    extracted_value: string | null;
    date_value: string | null;
    expected_revenue: number;
}
/**
 * Aggregated value with count
 */
export interface AggregatedValue {
    value: string;
    count: number;
    total_revenue: number;
    percentage: number;
}
/**
 * Period aggregation
 */
export interface PeriodAggregation {
    period: string;
    values: AggregatedValue[];
    total_count: number;
    total_revenue: number;
}
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
export declare function parseNotesField(description: string | null | undefined, fieldPattern: string): string | null;
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
export declare function parseAllNotesFields(description: string | null | undefined): Record<string, string>;
/**
 * Get period label from a date string.
 *
 * @param dateStr - ISO date string
 * @param granularity - 'month' or 'quarter'
 * @returns Period label (e.g., "Jan 2025", "2025-Q1")
 */
export declare function getPeriodLabel(dateStr: string | null | undefined, granularity: 'month' | 'quarter'): string;
/**
 * Aggregate extracted values by value (count occurrences).
 *
 * @param items - Array of leads with extracted values
 * @param topN - Limit to top N results (0 = all)
 * @returns Aggregated values sorted by count descending
 */
export declare function aggregateByValue(items: LeadWithExtractedNotes[], topN?: number): AggregatedValue[];
/**
 * Aggregate extracted values by time period.
 *
 * @param items - Array of leads with extracted values
 * @param granularity - 'month' or 'quarter'
 * @returns Period aggregations sorted chronologically
 */
export declare function aggregateByPeriod(items: LeadWithExtractedNotes[], granularity: 'month' | 'quarter'): PeriodAggregation[];
//# sourceMappingURL=notes-parser.d.ts.map