/**
 * Color extraction utilities for CRM description/notes analysis
 *
 * Extracts color information from free-text description fields
 * and normalizes to standard color categories for trend analysis.
 *
 * NOTE: For raw text extraction without color categorization,
 * use notes-parser.ts instead.
 */

import { COLOR_TAXONOMY, COLOR_PATTERNS, PRODUCT_COLOR_CODES } from '../constants.js';
import { stripHtml } from './html-utils.js';
import type { ColorExtraction, ProductColorSpecification, EnhancedColorExtraction } from '../types.js';

/**
 * Words that should NOT be detected as colors.
 * These appear in RFQ templates or have ambiguous meanings.
 */
const FALSE_POSITIVE_EXCLUSIONS = new Set([
  'range', 'colour', 'color', 'specified', 'system', 'tbc', 'tba',
  'hardware', 'edge', 'retention', 'supply', 'installation',
  'pick', 'stages', 'project', 'split', 'quoted', 'notes', 'call',
]);

/**
 * Color words that are also location names (Australian).
 * These need context checking - only detect as color if near color-related keywords.
 */
const LOCATION_AMBIGUOUS = new Set(['orange', 'green', 'white']);

/**
 * Check if a color word appears in a color-related context.
 * Returns true if the word is likely a color reference, not a location.
 *
 * @param text - The full text to check
 * @param colorWord - The color word to check context for
 * @returns true if the word appears in a color context
 */
function isColorContext(text: string, colorWord: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerWord = colorWord.toLowerCase();
  const wordIndex = lowerText.indexOf(lowerWord);

  if (wordIndex === -1) return false;

  const beforeKeywords = /(?:colou?rs?|finish|laminate|panels?|paint|specified|shade|in)\s*[:=]?\s*$/i;
  const afterKeywords = /^\s*(?:colou?rs?|finish|laminate|panels?|paint|shade|coated|painted)/i;

  const before = text.slice(Math.max(0, wordIndex - 50), wordIndex);
  if (beforeKeywords.test(before)) {
    return true;
  }

  const wordEnd = wordIndex + colorWord.length;
  const after = text.slice(wordEnd, Math.min(text.length, wordEnd + 50));
  if (afterKeywords.test(after)) {
    return true;
  }

  return false;
}

/**
 * Normalize a raw color string to its standard category.
 *
 * @param rawColor - The extracted color text (e.g., "navy blue")
 * @returns The normalized category (e.g., "Blue") or "Other" if not found
 */
export function normalizeColor(rawColor: string): string {
  const normalized = rawColor.toLowerCase().trim();

  for (const [category, variants] of Object.entries(COLOR_TAXONOMY)) {
    if (category === 'Other') continue;

    if (variants.includes(normalized)) {
      return category;
    }

    for (const variant of variants) {
      if (normalized.includes(variant)) {
        return category;
      }
      if (variant.length <= 3 && variant.includes(normalized)) {
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
 */
export function extractColorFromDescription(description: string | null | undefined): ColorExtraction {
  if (!description) {
    return { raw_color: null, color_category: 'Unknown', extraction_source: 'none' };
  }

  const cleanText = stripHtml(description);

  if (cleanText.length < 3) {
    return { raw_color: null, color_category: 'Unknown', extraction_source: 'none' };
  }

  // Try explicit patterns first (more reliable)
  const explicitRegex = new RegExp(COLOR_PATTERNS.EXPLICIT.source, COLOR_PATTERNS.EXPLICIT.flags);
  const explicitMatch = explicitRegex.exec(cleanText);

  if (explicitMatch && explicitMatch[1]) {
    const rawColor = explicitMatch[1].trim().toLowerCase();

    if (!FALSE_POSITIVE_EXCLUSIONS.has(rawColor)) {
      const category = normalizeColor(rawColor);
      if (category !== 'Other' || rawColor.length <= 20) {
        return {
          raw_color: rawColor,
          color_category: category,
          extraction_source: 'explicit'
        };
      }
    }
  }

  // Fall back to contextual patterns (standalone color words)
  const contextualRegex = new RegExp(COLOR_PATTERNS.CONTEXTUAL.source, COLOR_PATTERNS.CONTEXTUAL.flags);
  const contextualMatches = cleanText.match(contextualRegex);

  if (contextualMatches && contextualMatches.length > 0) {
    for (const match of contextualMatches) {
      const rawColor = match.toLowerCase();

      if (FALSE_POSITIVE_EXCLUSIONS.has(rawColor)) {
        continue;
      }

      if (LOCATION_AMBIGUOUS.has(rawColor)) {
        if (!isColorContext(cleanText, rawColor)) {
          continue;
        }
      }

      return {
        raw_color: rawColor,
        color_category: normalizeColor(rawColor),
        extraction_source: 'contextual'
      };
    }
  }

  return { raw_color: null, color_category: 'Unknown', extraction_source: 'none' };
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
 * @param text - The cleaned text (HTML already stripped)
 * @returns Array of ProductColorSpecification for multi-color support
 */
export function extractSpecifiedColors(text: string): ProductColorSpecification[] {
  const results: ProductColorSpecification[] = [];
  const seenSpecs = new Set<string>();

  const specPattern = new RegExp(COLOR_PATTERNS.SPECIFIED_COLORS.source, COLOR_PATTERNS.SPECIFIED_COLORS.flags);
  let match;

  while ((match = specPattern.exec(text)) !== null) {
    const colorList = match[1];

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
export function extractEnhancedColors(description: string | null | undefined): EnhancedColorExtraction {
  if (!description) {
    return {
      primary: null,
      all_colors: [],
      extraction_source: 'none',
      color_count: 0
    };
  }

  const cleanText = stripHtml(description);

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

  return {
    primary: null,
    all_colors: [],
    extraction_source: 'none',
    color_count: 0
  };
}
