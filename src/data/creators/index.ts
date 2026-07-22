/**
 * Creator Data Platform — Public API
 *
 * Import everything from this barrel file:
 *   import { listAllCreatorEntries, getRelatedCreators } from "@/data/creators";
 */

export type {
  CreatorEntry,
  CreatorSocialLinks,
  CategoryMeta,
  CountryMeta,
  LeaderboardDef,
} from "./schema";

export {
  CREATORS_DATASET,
  getCreatorEntryBySlug,
  getCreatorEntryById,
  listAllCreatorEntries,
  listCreatorsByCategory,
  listCreatorsByCountry,
  listCreatorsByNiche,
  listUnverifiedCreators,
} from "./dataset";

export {
  CATEGORIES,
  getCategoryBySlug,
  listCategorySlugs,
} from "./categories";

export {
  COUNTRY_PAGES,
  getCountryBySlug,
  listCountrySlugs,
} from "./countries";

export {
  getRelatedCreators,
  getRelatedCreatorsBySlug,
} from "./related";
