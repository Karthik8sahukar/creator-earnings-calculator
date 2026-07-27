/**
 * Tool system barrel export.
 *
 * Import from '@/lib/tools' to access the unified registry,
 * categories, search, and collections.
 */

export type { ToolEntry, ToolCategoryId } from "./registry";
export {
  TOOL_REGISTRY,
  TOOL_COUNT,
  getSearchPlaceholder,
  getToolBySlug,
  getToolByHref,
  getToolsByCategory,
  getFeaturedTools,
  getPopularTools,
  getToolCountByCategory,
} from "./registry";

export type { ToolCategoryDef } from "./categories";
export {
  TOOL_CATEGORIES,
  getCategoryDef,
  getCategoriesWithCounts,
  getTotalToolCount,
} from "./categories";

export type { SearchResult, HighlightSegment } from "./search";
export {
  searchTools,
  getSearchSuggestions,
  highlightMatch,
  getZeroResultsSuggestions,
  getTrendingTools,
} from "./search";

export type { ToolCollection } from "./collections";
export {
  getHomepageCollections,
  getCollectionById,
  getRelatedTools,
  getToolsInSameCategory,
  getFeaturedMixed,
} from "./collections";
