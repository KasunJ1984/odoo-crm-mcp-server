/**
 * Color extraction utilities for CRM description/notes analysis
 *
 * Extracts color information from free-text description fields
 * and normalizes to standard color categories for trend analysis.
 */
import type { ColorExtraction, ProductColorSpecification, EnhancedColorExtraction } from '../types.js';
/**
 * Normalize a raw color string to its standard category.
 *
 * @param rawColor - The extracted color text (e.g., "navy blue")
 * @returns The normalized category (e.g., "Blue") or "Other" if not found
 *
 * @example
 * normalizeColor("navy blue")  // Returns "Blue"
 * normalizeColor("charcoal")   // Returns "Grey"
 * normalizeColor("unknown")    // Returns "Other"
 */
export declare function normalizeColor(rawColor: string): string;
/**
 * Extract color from description text.
 *
 * Uses two strategies:
 * 1. EXPLICIT patterns: "color: navy blue", "paint colour: white"
 * 2. CONTEXTUAL patterns: standalone color words
 *
 * @param description - The description/notes text (may contain HTML)
 * @returns ColorExtraction with raw_color, category, and source
 *
 * @example
 * extractColorFromDescription("<p>Customer wants navy blue panels</p>")
 * // Returns: { raw_color: "navy", color_category: "Blue", extraction_source: "contextual" }
 *
 * extractColorFromDescription("Color: White finish requested")
 * // Returns: { raw_color: "white", color_category: "White", extraction_source: "explicit" }
 */
export declare function extractColorFromDescription(description: string | null | undefined): ColorExtraction;
/**
 * Extract all colors mentioned in description (not just the first).
 * Useful for detailed analysis when multiple colors are mentioned.
 *
 * @param description - The description text
 * @returns Array of all colors found (may have duplicates if same color mentioned multiple times)
 */
export declare function extractAllColors(description: string | null | undefined): ColorExtraction[];
/**
 * Batch extract colors from multiple records.
 * More efficient than calling extractColorFromDescription in a loop.
 *
 * @param records - Array of objects with id and description
 * @returns Map of record ID to ColorExtraction
 */
export declare function batchExtractColors(records: Array<{
    id: number;
    description: string | null | undefined;
}>): Map<number, ColorExtraction>;
/**
 * Get color statistics from extracted colors.
 * Useful for debugging and validation.
 */
export declare function getColorStats(extractions: ColorExtraction[]): {
    total: number;
    with_color: number;
    without_color: number;
    detection_rate: number;
    by_category: Record<string, number>;
    by_source: Record<string, number>;
};
/**
 * Parse a single color specification into structured data.
 * Handles multiple formats:
 * - "9610 Pure Ash" → { code: "9610", name: "Pure Ash" }
 * - "White Pearl" → { code: null, name: "White Pearl" }
 * - "9610" → Uses PRODUCT_COLOR_CODES lookup
 * - "grey" → { code: null, name: "grey" }
 *
 * @param spec - The color specification text to parse
 * @returns ProductColorSpecification with structured color data
 */
export declare function parseColorSpec(spec: string): ProductColorSpecification;
/**
 * Extract colors from "Specified Colours = ..." pattern.
 * This is the primary pattern for industry color specifications.
 *
 * Handles:
 * - "Specified Colours = 9610 Pure Ash"
 * - "Specified Colours = White Pearl, Oyster Grey"
 * - "Specified Colours: 9610 Pure Ash, 2440 Deep Ocean"
 * - "Specified Color = White" (US spelling)
 *
 * @param text - The cleaned text (HTML already stripped)
 * @returns Array of ProductColorSpecification for multi-color support
 */
export declare function extractSpecifiedColors(text: string): ProductColorSpecification[];
/**
 * Enhanced extraction that returns structured multi-color data.
 * This is the new primary extraction function for industry specifications.
 *
 * Extraction priority:
 * 1. "Specified Colours = ..." pattern (most reliable for industry specs)
 * 2. Explicit patterns: "color:", "paint:", etc.
 * 3. Contextual patterns: standalone color words
 *
 * @param description - The description/notes text (may contain HTML)
 * @returns EnhancedColorExtraction with primary color and all colors array
 *
 * @example
 * extractEnhancedColors("Specified Colours = 9610 Pure Ash, White Pearl")
 * // Returns: {
 * //   primary: { color_code: "9610", color_name: "Pure Ash", color_category: "Grey" },
 * //   all_colors: [
 * //     { color_code: "9610", color_name: "Pure Ash", ... },
 * //     { color_code: null, color_name: "White Pearl", color_category: "White" }
 * //   ],
 * //   extraction_source: "specified",
 * //   color_count: 2
 * // }
 */
export declare function extractEnhancedColors(description: string | null | undefined): EnhancedColorExtraction;
//# sourceMappingURL=color-extractor.d.ts.map