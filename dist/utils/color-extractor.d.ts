/**
 * Color extraction utilities for CRM description/notes analysis
 *
 * Extracts color information from free-text description fields
 * and normalizes to standard color categories for trend analysis.
 *
 * NOTE: For raw text extraction without color categorization,
 * use notes-parser.ts instead.
 */
import type { ColorExtraction, ProductColorSpecification, EnhancedColorExtraction } from '../types.js';
/**
 * Normalize a raw color string to its standard category.
 *
 * @param rawColor - The extracted color text (e.g., "navy blue")
 * @returns The normalized category (e.g., "Blue") or "Other" if not found
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
 */
export declare function extractColorFromDescription(description: string | null | undefined): ColorExtraction;
/**
 * Parse a single color specification into structured data.
 * Handles multiple formats:
 * - "9610 Pure Ash" → { code: "9610", name: "Pure Ash" }
 * - "White Pearl" → { code: null, name: "White Pearl" }
 * - "9610" → Uses PRODUCT_COLOR_CODES lookup
 *
 * @param spec - The color specification text to parse
 * @returns ProductColorSpecification with structured color data
 */
export declare function parseColorSpec(spec: string): ProductColorSpecification;
/**
 * Extract colors from "Specified Colours = ..." pattern.
 * This is the primary pattern for industry color specifications.
 *
 * @param text - The cleaned text (HTML already stripped)
 * @returns Array of ProductColorSpecification for multi-color support
 */
export declare function extractSpecifiedColors(text: string): ProductColorSpecification[];
/**
 * Enhanced extraction that returns structured multi-color data.
 * This is the primary extraction function for industry specifications.
 *
 * Extraction priority:
 * 1. "Specified Colours = ..." pattern (most reliable for industry specs)
 * 2. Explicit patterns: "color:", "paint:", etc.
 * 3. Contextual patterns: standalone color words
 *
 * @param description - The description/notes text (may contain HTML)
 * @returns EnhancedColorExtraction with primary color and all colors array
 */
export declare function extractEnhancedColors(description: string | null | undefined): EnhancedColorExtraction;
//# sourceMappingURL=color-extractor.d.ts.map