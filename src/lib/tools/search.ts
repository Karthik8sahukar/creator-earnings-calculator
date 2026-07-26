/**
 * Tool Search — Client-side fuzzy search over the tool registry.
 *
 * Design:
 *   - Instant: runs synchronously in the browser, no API calls.
 *   - Fuzzy: tolerates typos and partial matches.
 *   - Weighted: title matches rank higher than tag matches.
 *   - Alias-aware: matches against alternative names/phrases.
 *   - Keyboard-friendly: designed for command-palette UX.
 *   - Highlight: provides matched ranges for text highlighting.
 */

import { type ToolEntry, TOOL_REGISTRY } from "./registry";

// ─── Types ──────────────────────────────────────────────────────────

export interface SearchResult {
  tool: ToolEntry;
  score: number;
  /** Which field(s) matched — useful for highlighting. */
  matchedOn: ("title" | "description" | "tags" | "category" | "alias")[];
}

/**
 * A text segment for highlighted search results.
 * `highlight: true` means this segment matched the query.
 */
export interface HighlightSegment {
  text: string;
  highlight: boolean;
}

// ─── Main Search ────────────────────────────────────────────────────

/**
 * Search the tool registry with a query string.
 * Returns results sorted by relevance score (highest first).
 *
 * Scoring:
 *   - Exact title match: 100
 *   - Exact alias match: 90
 *   - Title starts with query: 80
 *   - Title contains query: 60
 *   - Alias contains query / query contains alias: 45
 *   - Tag exact match: 50
 *   - Multi-word partial title match: 40 * (matched/total)
 *   - Description contains query: 30
 *   - Tag contains query: 25
 *   - Category match: 20
 *   - Popular bonus: +10
 *   - Featured bonus: +5
 *   - Popularity score bonus: +0 to +8 (from analytics)
 */
export function searchTools(query: string, limit = 12): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const results: SearchResult[] = [];

  for (const tool of TOOL_REGISTRY) {
    let score = 0;
    const matchedOn: SearchResult["matchedOn"] = [];

    const titleLower = tool.title.toLowerCase();
    const descLower = tool.description.toLowerCase();

    // Title scoring
    if (titleLower === q) {
      score += 100;
      matchedOn.push("title");
    } else if (titleLower.startsWith(q)) {
      score += 80;
      matchedOn.push("title");
    } else if (titleLower.includes(q)) {
      score += 60;
      matchedOn.push("title");
    } else {
      // Multi-word matching: check each word in the query against title words
      const queryWords = q.split(/\s+/);
      const titleWords = titleLower.split(/\s+/);
      let wordMatches = 0;
      for (const qw of queryWords) {
        if (titleWords.some((tw) => tw.startsWith(qw) || tw.includes(qw))) {
          wordMatches++;
        }
      }
      if (wordMatches > 0) {
        score += 40 * (wordMatches / queryWords.length);
        matchedOn.push("title");
      }
    }

    // Description scoring
    if (descLower.includes(q)) {
      score += 30;
      matchedOn.push("description");
    } else {
      // Multi-word partial match on description
      const queryWords = q.split(/\s+/);
      let descWordMatches = 0;
      for (const qw of queryWords) {
        if (descLower.includes(qw)) {
          descWordMatches++;
        }
      }
      if (descWordMatches > 1 && descWordMatches >= queryWords.length * 0.5) {
        score += 15 * (descWordMatches / queryWords.length);
        matchedOn.push("description");
      }
    }

    // Tag scoring
    for (const tag of tool.tags) {
      const tagLower = tag.toLowerCase();
      if (tagLower === q) {
        score += 50;
        if (!matchedOn.includes("tags")) matchedOn.push("tags");
        break; // one tag match is enough
      } else if (tagLower.includes(q) || q.includes(tagLower)) {
        score += 25;
        if (!matchedOn.includes("tags")) matchedOn.push("tags");
        break;
      }
    }

    // Alias scoring — alternative names/phrases for the tool
    if (tool.aliases) {
      for (const alias of tool.aliases) {
        const aliasLower = alias.toLowerCase();
        if (aliasLower === q) {
          score += 90; // Almost as good as exact title match
          if (!matchedOn.includes("alias")) matchedOn.push("alias");
          break;
        } else if (aliasLower.includes(q) || q.includes(aliasLower)) {
          score += 45;
          if (!matchedOn.includes("alias")) matchedOn.push("alias");
          break;
        } else {
          // Multi-word alias matching
          const queryWords = q.split(/\s+/);
          const aliasWords = aliasLower.split(/\s+/);
          let aliasWordMatches = 0;
          for (const qw of queryWords) {
            if (aliasWords.some((aw) => aw.startsWith(qw) || aw.includes(qw))) {
              aliasWordMatches++;
            }
          }
          if (aliasWordMatches > 0 && aliasWordMatches >= queryWords.length * 0.6) {
            score += 35 * (aliasWordMatches / queryWords.length);
            if (!matchedOn.includes("alias")) matchedOn.push("alias");
            break;
          }
        }
      }
    }

    // Category scoring (matches category label or id)
    if (tool.category.includes(q) || q.includes(tool.category.replace("-", " "))) {
      score += 20;
      matchedOn.push("category");
    }

    // Bonus points for popular/featured tools
    if (score > 0) {
      if (tool.popular) score += 10;
      if (tool.featured) score += 5;

      // Analytics-based popularity bonus (0-8 points)
      if (tool.analytics?.popularityScore) {
        score += Math.min(8, Math.round(tool.analytics.popularityScore / 12.5));
      }
    }

    if (score > 0) {
      results.push({ tool, score, matchedOn });
    }
  }

  // Sort by score descending, then alphabetically
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.tool.title.localeCompare(b.tool.title);
  });

  return results.slice(0, limit);
}

// ─── Highlight ──────────────────────────────────────────────────────

/**
 * Highlight matched portions of text given a search query.
 * Returns an array of segments with a `highlight` flag.
 *
 * Handles:
 *   - Case-insensitive matching
 *   - Multiple occurrences
 *   - Multi-word queries (highlights each word independently)
 *   - Empty query (returns full text unhighlighted)
 *
 * Usage:
 *   const segments = highlightMatch("JSON Formatter", "json");
 *   // [{ text: "JSON", highlight: true }, { text: " Formatter", highlight: false }]
 */
export function highlightMatch(text: string, query: string): HighlightSegment[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [{ text, highlight: false }];

  // Try full query match first
  const fullMatch = findMatchRanges(text, [q]);
  if (fullMatch.length > 0) {
    return buildSegments(text, fullMatch);
  }

  // Fall back to individual word matching
  const words = q.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length === 0) return [{ text, highlight: false }];

  const ranges = findMatchRanges(text, words);
  return buildSegments(text, ranges);
}

/**
 * Find character ranges [start, end) where any of the terms match.
 */
function findMatchRanges(
  text: string,
  terms: string[],
): Array<[number, number]> {
  const textLower = text.toLowerCase();
  const ranges: Array<[number, number]> = [];

  for (const term of terms) {
    let idx = 0;
    while (idx < textLower.length) {
      const found = textLower.indexOf(term, idx);
      if (found === -1) break;
      ranges.push([found, found + term.length]);
      idx = found + term.length;
    }
  }

  // Merge overlapping ranges
  if (ranges.length <= 1) return ranges;
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1];
    if (ranges[i][0] <= last[1]) {
      last[1] = Math.max(last[1], ranges[i][1]);
    } else {
      merged.push(ranges[i]);
    }
  }
  return merged;
}

/**
 * Build HighlightSegment[] from text and sorted non-overlapping ranges.
 */
function buildSegments(
  text: string,
  ranges: Array<[number, number]>,
): HighlightSegment[] {
  if (ranges.length === 0) return [{ text, highlight: false }];

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const [start, end] of ranges) {
    if (cursor < start) {
      segments.push({ text: text.slice(cursor, start), highlight: false });
    }
    segments.push({ text: text.slice(start, end), highlight: true });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlight: false });
  }

  return segments;
}

// ─── Suggestions & Discovery ────────────────────────────────────────

/**
 * Get search suggestions — popular tools that match a prefix.
 * Used for the "trending searches" display below the search bar.
 */
export function getSearchSuggestions(): string[] {
  return [
    "Coin Flip",
    "JSON Formatter",
    "Word Counter",
    "RPM Calculator",
    "UUID Generator",
    "Random Number",
  ];
}

/**
 * Get zero-results suggestions: related queries a user might try
 * when their search yields no results.
 *
 * Strategy:
 *   1. Try relaxing the query (use individual words)
 *   2. Find tools whose tags/category match any query word
 *   3. Return their titles as alternative suggestions
 *   4. Fall back to popular tools if nothing matches
 */
export function getZeroResultsSuggestions(query: string, limit = 4): ToolEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const words = q.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length === 0) return [];

  const scored: Array<{ tool: ToolEntry; score: number }> = [];

  for (const tool of TOOL_REGISTRY) {
    let score = 0;

    // Check if any query word partially matches tags
    for (const word of words) {
      for (const tag of tool.tags) {
        if (tag.includes(word) || word.includes(tag)) {
          score += 10;
          break;
        }
      }
      // Check category
      if (tool.category.replace("-", " ").includes(word)) {
        score += 5;
      }
      // Check aliases
      if (tool.aliases) {
        for (const alias of tool.aliases) {
          if (alias.toLowerCase().includes(word)) {
            score += 8;
            break;
          }
        }
      }
    }

    // Boost popular/featured tools in suggestions
    if (score > 0) {
      if (tool.popular) score += 5;
      if (tool.featured) score += 3;
    }

    if (score > 0) {
      scored.push({ tool, score });
    }
  }

  // Sort by score and return top suggestions
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.tool);
}

/**
 * Get trending/popular tools from the registry.
 * Uses analytics.popularityScore when available, falls back to popular flag.
 */
export function getTrendingTools(limit = 6): ToolEntry[] {
  const withScore = TOOL_REGISTRY.filter((t) => t.analytics?.popularityScore);

  if (withScore.length >= limit) {
    return [...withScore]
      .sort(
        (a, b) =>
          (b.analytics?.popularityScore ?? 0) -
          (a.analytics?.popularityScore ?? 0),
      )
      .slice(0, limit);
  }

  // Fallback: popular/featured tools
  return TOOL_REGISTRY.filter((t) => t.popular || t.featured).slice(0, limit);
}
