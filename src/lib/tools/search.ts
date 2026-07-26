/**
 * Tool Search — Client-side fuzzy search over the tool registry.
 *
 * Design:
 *   - Instant: runs synchronously in the browser, no API calls.
 *   - Fuzzy: tolerates typos and partial matches.
 *   - Weighted: title matches rank higher than tag matches.
 *   - Keyboard-friendly: designed for command-palette UX.
 */

import { type ToolEntry, TOOL_REGISTRY } from "./registry";

export interface SearchResult {
  tool: ToolEntry;
  score: number;
  /** Which field(s) matched — useful for highlighting. */
  matchedOn: ("title" | "description" | "tags" | "category")[];
}

/**
 * Search the tool registry with a query string.
 * Returns results sorted by relevance score (highest first).
 *
 * Scoring:
 *   - Exact title match: 100
 *   - Title starts with query: 80
 *   - Title contains query: 60
 *   - Description contains query: 30
 *   - Tag exact match: 50
 *   - Tag contains query: 25
 *   - Category match: 20
 *   - Popular bonus: +10
 *   - Featured bonus: +5
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
      // Check individual words in query against title words
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
          if (!matchedOn.includes("title")) matchedOn.push("title");
          break;
        } else if (aliasLower.includes(q) || q.includes(aliasLower)) {
          score += 45;
          if (!matchedOn.includes("title")) matchedOn.push("title");
          break;
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
