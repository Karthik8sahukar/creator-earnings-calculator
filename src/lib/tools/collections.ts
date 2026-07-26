/**
 * Tool Collections & Related Tools
 *
 * Collections are curated groupings that improve discovery.
 * Related tools are computed dynamically from shared tags/category.
 */

import {
  type ToolCategoryId,
  type ToolEntry,
  TOOL_REGISTRY,
  getToolsByCategory,
  getPopularTools,
  getFeaturedTools,
} from "./registry";

// ─── Types ──────────────────────────────────────────────────────────

export interface ToolCollection {
  id: string;
  title: string;
  description: string;
  tools: ToolEntry[];
}

// ─── Collections ────────────────────────────────────────────────────

/**
 * Get all homepage collections.
 * Each collection is a curated grouping for discovery.
 * Collections intentionally avoid repeating tools shown in the FeaturedGrid
 * (which uses getFeaturedMixed) by filtering popular-only tools per category.
 */
export function getHomepageCollections(): ToolCollection[] {
  // Tools already shown in the FeaturedGrid — exclude from collections
  const featuredSlugs = new Set(getFeaturedTools().map((t) => t.slug));

  return [
    {
      id: "for-developers",
      title: "For Developers",
      description: "Browser-based dev tools — no data leaves your device.",
      tools: getToolsByCategory("developer-tools")
        .filter((t) => !featuredSlugs.has(t.slug))
        .slice(0, 8),
    },
    {
      id: "for-creators",
      title: "For Creators",
      description: "Revenue calculators and analytics for YouTube, Instagram, and Twitch.",
      tools: getToolsByCategory("creator-analytics")
        .filter((t) => !featuredSlugs.has(t.slug))
        .slice(0, 8),
    },
    {
      id: "quick-decisions",
      title: "Quick Decisions",
      description: "Random generators and decision makers for any situation.",
      tools: getToolsByCategory("decision-random")
        .filter((t) => !featuredSlugs.has(t.slug))
        .slice(0, 8),
    },
    {
      id: "text-and-data",
      title: "Text & Data",
      description: "Analyze text, convert data, and work with content.",
      tools: [
        ...getToolsByCategory("text-tools"),
        ...getToolsByCategory("converters"),
      ]
        .filter((t) => !featuredSlugs.has(t.slug))
        .slice(0, 8),
    },
  ];
}

/**
 * Get a single collection by ID.
 */
export function getCollectionById(id: string): ToolCollection | undefined {
  return getHomepageCollections().find((c) => c.id === id);
}

// ─── Related Tools ──────────────────────────────────────────────────

/**
 * Compute related tools for a given tool.
 *
 * Scoring:
 *   - Same category: +3
 *   - Shared tag: +2 per shared tag
 *   - Both popular: +1
 *
 * Returns up to `limit` related tools, sorted by relevance.
 */
export function getRelatedTools(
  currentSlug: string,
  limit = 6,
): ToolEntry[] {
  const current = TOOL_REGISTRY.find((t) => t.slug === currentSlug);
  if (!current) return [];

  const currentTags = new Set(current.tags);

  const scored = TOOL_REGISTRY
    .filter((t) => t.slug !== currentSlug)
    .map((tool) => {
      let score = 0;

      // Same category bonus
      if (tool.category === current.category) score += 3;

      // Shared tags
      for (const tag of tool.tags) {
        if (currentTags.has(tag)) score += 2;
      }

      // Popularity bonus
      if (tool.popular && current.popular) score += 1;

      return { tool, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ tool }) => tool);
}

/**
 * Get tools from the same category (excluding the current tool).
 * Used for "Popular In Category" sections on tool pages.
 */
export function getToolsInSameCategory(
  currentSlug: string,
  limit = 6,
): ToolEntry[] {
  const current = TOOL_REGISTRY.find((t) => t.slug === currentSlug);
  if (!current) return [];

  return TOOL_REGISTRY
    .filter((t) => t.slug !== currentSlug && t.category === current.category)
    .slice(0, limit);
}

/**
 * Get featured tools from mixed categories for the homepage grid.
 */
export function getFeaturedMixed(limit = 8): ToolEntry[] {
  // Take featured tools, then fill with popular if needed
  const featured = getFeaturedTools();
  if (featured.length >= limit) return featured.slice(0, limit);

  const popular = getPopularTools().filter(
    (t) => !featured.some((f) => f.slug === t.slug),
  );
  return [...featured, ...popular].slice(0, limit);
}
