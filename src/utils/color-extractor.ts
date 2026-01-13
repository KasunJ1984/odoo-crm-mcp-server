/**
 * Color extraction utilities for CRM description/notes analysis
 *
 * Extracts color information from free-text description fields
 * and normalizes to standard color categories for trend analysis.
 */

import { COLOR_TAXONOMY, COLOR_PATTERNS, PRODUCT_COLOR_CODES } from '../constants.js';
import { stripHtml } from './html-utils.js';
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
export function normalizeColor(rawColor: string): string {
  const normalized = rawColor.toLowerCase().trim();

  // Check each category for exact or partial matches
  for (const [category, variants] of Object.entries(COLOR_TAXONOMY)) {
    // Skip "Other" category (it's a catch-all)
    if (category === 'Other') continue;

    // Check for exact match first
    if (variants.includes(normalized)) {
      return category;
    }

    // Check if any variant is contained in the raw color
    // e.g., "dark navy blue" contains "navy blue"
    for (const variant of variants) {
      if (normalized.includes(variant) || variant.includes(normalized)) {
        return category;
      }
    }
  }

  return 'Other';
}

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
export function extractColorFromDescription(description: string | null | undefined): ColorExtraction {
  // Handle null/undefined/empty
  if (!description) {
    return { raw_color: null, color_category: 'Unknown', extraction_source: 'none' };
  }

  // Strip HTML tags and decode entities
  const cleanText = stripHtml(description);

  // Skip if too short (likely just noise)
  if (cleanText.length < 3) {
    return { raw_color: null, color_category: 'Unknown', extraction_source: 'none' };
  }

  // Try explicit patterns first (more reliable)
  // Reset regex lastIndex for reuse
  const explicitRegex = new RegExp(COLOR_PATTERNS.EXPLICIT.source, COLOR_PATTERNS.EXPLICIT.flags);
  const explicitMatch = explicitRegex.exec(cleanText);

  if (explicitMatch && explicitMatch[1]) {
    const rawColor = explicitMatch[1].trim().toLowerCase();
    // Validate it's actually a color (not just any word after "color:")
    const category = normalizeColor(rawColor);
    if (category !== 'Other' || rawColor.length <= 20) {
      return {
        raw_color: rawColor,
        color_category: category,
        extraction_source: 'explicit'
      };
    }
  }

  // Fall back to contextual patterns (standalone color words)
  const contextualRegex = new RegExp(COLOR_PATTERNS.CONTEXTUAL.source, COLOR_PATTERNS.CONTEXTUAL.flags);
  const contextualMatches = cleanText.match(contextualRegex);

  if (contextualMatches && contextualMatches.length > 0) {
    // Take the first match (most prominent in text)
    const rawColor = contextualMatches[0].toLowerCase();
    return {
      raw_color: rawColor,
      color_category: normalizeColor(rawColor),
      extraction_source: 'contextual'
    };
  }

  // No color found
  return { raw_color: null, color_category: 'Unknown', extraction_source: 'none' };
}

/**
 * Extract all colors mentioned in description (not just the first).
 * Useful for detailed analysis when multiple colors are mentioned.
 *
 * @param description - The description text
 * @returns Array of all colors found (may have duplicates if same color mentioned multiple times)
 */
export function extractAllColors(description: string | null | undefined): ColorExtraction[] {
  if (!description) {
    return [];
  }

  const cleanText = stripHtml(description);
  const results: ColorExtraction[] = [];
  const seenColors = new Set<string>();

  // Try explicit patterns
  const explicitRegex = new RegExp(COLOR_PATTERNS.EXPLICIT.source, COLOR_PATTERNS.EXPLICIT.flags);
  let match;
  while ((match = explicitRegex.exec(cleanText)) !== null) {
    if (match[1]) {
      const rawColor = match[1].trim().toLowerCase();
      if (!seenColors.has(rawColor)) {
        seenColors.add(rawColor);
        results.push({
          raw_color: rawColor,
          color_category: normalizeColor(rawColor),
          extraction_source: 'explicit'
        });
      }
    }
  }

  // Try contextual patterns
  const contextualRegex = new RegExp(COLOR_PATTERNS.CONTEXTUAL.source, COLOR_PATTERNS.CONTEXTUAL.flags);
  while ((match = contextualRegex.exec(cleanText)) !== null) {
    const rawColor = match[0].toLowerCase();
    if (!seenColors.has(rawColor)) {
      seenColors.add(rawColor);
      results.push({
        raw_color: rawColor,
        color_category: normalizeColor(rawColor),
        extraction_source: 'contextual'
      });
    }
  }

  return results;
}

/**
 * Batch extract colors from multiple records.
 * More efficient than calling extractColorFromDescription in a loop.
 *
 * @param records - Array of objects with id and description
 * @returns Map of record ID to ColorExtraction
 */
export function batchExtractColors(
  records: Array<{ id: number; description: string | null | undefined }>
): Map<number, ColorExtraction> {
  const results = new Map<number, ColorExtraction>();

  for (const record of records) {
    results.set(record.id, extractColorFromDescription(record.description));
  }

  return results;
}

/**
 * Get color statistics from extracted colors.
 * Useful for debugging and validation.
 */
export function getColorStats(extractions: ColorExtraction[]): {
  total: number;
  with_color: number;
  without_color: number;
  detection_rate: number;
  by_category: Record<string, number>;
  by_source: Record<string, number>;
} {
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = { explicit: 0, contextual: 0, none: 0 };
  let withColor = 0;

  for (const ext of extractions) {
    // Count by category
    byCategory[ext.color_category] = (byCategory[ext.color_category] || 0) + 1;

    // Count by source
    bySource[ext.extraction_source]++;

    // Count with color
    if (ext.color_category !== 'Unknown') {
      withColor++;
    }
  }

  return {
    total: extractions.length,
    with_color: withColor,
    without_color: extractions.length - withColor,
    detection_rate: extractions.length > 0 ? (withColor / extractions.length) * 100 : 0,
    by_category: byCategory,
    by_source: bySource
  };
}

// =============================================================================
// ENHANCED COLOR EXTRACTION - Industry specification support
// =============================================================================

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
export function parseColorSpec(spec: string): ProductColorSpecification {
  const trimmed = spec.trim();

  // Try to match "CODE NAME" pattern (e.g., "9610 Pure Ash")
  const codeMatch = trimmed.match(/^(\d{3,5})\s+(.+)$/);
  if (codeMatch) {
    const [, code, name] = codeMatch;
    return {
      color_code: code,
      color_name: name.trim(),
      full_specification: trimmed,
      color_category: normalizeColor(name.trim())
    };
  }

  // Try to match just a code (e.g., "9610")
  const justCode = trimmed.match(/^(\d{3,5})$/);
  if (justCode) {
    const code = justCode[1];
    const knownColor = PRODUCT_COLOR_CODES[code];
    return {
      color_code: code,
      color_name: knownColor?.name || 'Unknown',
      full_specification: knownColor ? `${code} ${knownColor.name}` : trimmed,
      color_category: knownColor?.category || 'Other'
    };
  }

  // Plain color name (e.g., "White Pearl", "Oyster Grey")
  return {
    color_code: null,
    color_name: trimmed,
    full_specification: trimmed,
    color_category: normalizeColor(trimmed)
  };
}

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
export function extractSpecifiedColors(text: string): ProductColorSpecification[] {
  const results: ProductColorSpecification[] = [];
  const seenSpecs = new Set<string>();

  // Find "Specified Colours = ..." lines
  const specPattern = new RegExp(COLOR_PATTERNS.SPECIFIED_COLORS.source, COLOR_PATTERNS.SPECIFIED_COLORS.flags);
  let match;

  while ((match = specPattern.exec(text)) !== null) {
    const colorList = match[1];

    // Split by comma and parse each color
    const items = colorList.split(',');
    for (const item of items) {
      const trimmedItem = item.trim();
      if (trimmedItem && !seenSpecs.has(trimmedItem.toLowerCase())) {
        seenSpecs.add(trimmedItem.toLowerCase());
        results.push(parseColorSpec(trimmedItem));
      }
    }
  }

  return results;
}

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
export function extractEnhancedColors(description: string | null | undefined): EnhancedColorExtraction {
  // Handle null/undefined/empty
  if (!description) {
    return {
      primary: null,
      all_colors: [],
      extraction_source: 'none',
      color_count: 0
    };
  }

  // Strip HTML tags and decode entities
  const cleanText = stripHtml(description);

  // Skip if too short (likely just noise)
  if (cleanText.length < 3) {
    return {
      primary: null,
      all_colors: [],
      extraction_source: 'none',
      color_count: 0
    };
  }

  // 1. Try "Specified Colours" pattern first (most reliable for industry specs)
  const specifiedColors = extractSpecifiedColors(cleanText);
  if (specifiedColors.length > 0) {
    return {
      primary: specifiedColors[0],
      all_colors: specifiedColors,
      extraction_source: 'specified',
      color_count: specifiedColors.length
    };
  }

  // 2. Fall back to existing extraction logic (explicit then contextual)
  const legacyExtraction = extractColorFromDescription(description);
  if (legacyExtraction.color_category !== 'Unknown') {
    const spec: ProductColorSpecification = {
      color_code: null,
      color_name: legacyExtraction.raw_color || '',
      full_specification: legacyExtraction.raw_color || '',
      color_category: legacyExtraction.color_category
    };
    return {
      primary: spec,
      all_colors: [spec],
      extraction_source: legacyExtraction.extraction_source as 'explicit' | 'contextual',
      color_count: 1
    };
  }

  // No color found
  return {
    primary: null,
    all_colors: [],
    extraction_source: 'none',
    color_count: 0
  };
}
