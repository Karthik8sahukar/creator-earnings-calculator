/**
 * Creator directory service.
 *
 * Provides filtering, sorting, and pagination for the /creators page
 * and all listing surfaces (country pages, category pages, rankings).
 *
 * All operations run against the in-memory dataset — there is no
 * database. For 200 creators this is instantaneous and avoids
 * introducing infrastructure.
 */

import { CREATORS_DATASET } from "@/data/creators/dataset";
import type { CreatorEntry, CreatorCountryCode, CreatorNicheId } from "@/data/creators/schema";

// ─── Filter Types ───────────────────────────────────────────────────

export interface CreatorFilters {
  /** Free-text search (name, handle, keywords). */
  search?: string;
  /** Filter by country code. */
  country?: CreatorCountryCode;
  /** Filter by category (case-insensitive). */
  category?: string;
  /** Filter by niche ID. */
  niche?: CreatorNicheId;
  /** Filter by subscriber tier. */
  subscriberTier?: "mega" | "large" | "mid" | "emerging";
  /** Only show verified creators. */
  verified?: boolean;
  /** Filter by content type. */
  contentType?: "long" | "shorts" | "mixed";
}

export type CreatorSortField =
  | "name"
  | "country"
  | "category"
  | "subscriberTier"
  | "newest";

export interface CreatorPaginationInput {
  page: number;
  perPage: number;
}

export interface CreatorDirectoryResult {
  creators: CreatorEntry[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ─── Subscriber tier ordering (for sort) ────────────────────────────

const TIER_ORDER: Record<string, number> = {
  mega: 0,
  large: 1,
  mid: 2,
  emerging: 3,
};

// ─── Core filter function ───────────────────────────────────────────

export function filterCreators(
  filters: CreatorFilters,
): CreatorEntry[] {
  let results = [...CREATORS_DATASET];

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.slug.includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }

  if (filters.country) {
    results = results.filter((c) => c.countryCode === filters.country);
  }

  if (filters.category) {
    const cat = filters.category.toLowerCase();
    results = results.filter((c) => c.category.toLowerCase() === cat);
  }

  if (filters.niche) {
    results = results.filter((c) => c.niche === filters.niche);
  }

  if (filters.subscriberTier) {
    results = results.filter((c) => c.subscriberTier === filters.subscriberTier);
  }

  if (filters.verified !== undefined) {
    results = results.filter((c) => c.verified === filters.verified);
  }

  if (filters.contentType) {
    results = results.filter((c) => c.contentType === filters.contentType);
  }

  return results;
}

// ─── Sort function ──────────────────────────────────────────────────

export function sortCreators(
  creators: CreatorEntry[],
  sortBy: CreatorSortField,
  direction: "asc" | "desc" = "asc",
): CreatorEntry[] {
  const sorted = [...creators];
  const dir = direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name) * dir;
      case "country":
        return a.country.localeCompare(b.country) * dir;
      case "category":
        return a.category.localeCompare(b.category) * dir;
      case "subscriberTier":
        return ((TIER_ORDER[a.subscriberTier] ?? 99) - (TIER_ORDER[b.subscriberTier] ?? 99)) * dir;
      case "newest":
        // No actual date in dataset, so sort by position (later = newer)
        return 0;
      default:
        return 0;
    }
  });

  return sorted;
}

// ─── Paginate function ──────────────────────────────────────────────

export function paginateCreators(
  creators: CreatorEntry[],
  { page, perPage }: CreatorPaginationInput,
): CreatorDirectoryResult {
  const safePage = Math.max(1, page);
  const safePerPage = Math.min(Math.max(1, perPage), 100);
  const total = creators.length;
  const totalPages = Math.max(1, Math.ceil(total / safePerPage));
  const offset = (safePage - 1) * safePerPage;
  const paged = creators.slice(offset, offset + safePerPage);

  return {
    creators: paged,
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages,
  };
}

// ─── Combined query function ────────────────────────────────────────

export function queryCreators(opts: {
  filters?: CreatorFilters;
  sort?: CreatorSortField;
  direction?: "asc" | "desc";
  page?: number;
  perPage?: number;
}): CreatorDirectoryResult {
  const {
    filters = {},
    sort = "subscriberTier",
    direction = "asc",
    page = 1,
    perPage = 24,
  } = opts;

  const filtered = filterCreators(filters);
  const sorted = sortCreators(filtered, sort, direction);
  return paginateCreators(sorted, { page, perPage });
}

// ─── Convenience functions ──────────────────────────────────────────

/** Get all creators for a specific country code. */
export function getCreatorsByCountry(countryCode: CreatorCountryCode): CreatorEntry[] {
  return CREATORS_DATASET.filter((c) => c.countryCode === countryCode);
}

/** Get all creators for a specific category (case-insensitive). */
export function getCreatorsByCategory(category: string): CreatorEntry[] {
  const cat = category.toLowerCase();
  return CREATORS_DATASET.filter((c) => c.category.toLowerCase() === cat);
}

/** Get all creators for a specific niche. */
export function getCreatorsByNiche(niche: CreatorNicheId): CreatorEntry[] {
  return CREATORS_DATASET.filter((c) => c.niche === niche);
}

/** Get top creators by subscriber tier. */
export function getTopCreators(limit = 20): CreatorEntry[] {
  return sortCreators([...CREATORS_DATASET], "subscriberTier", "asc").slice(0, limit);
}

/** Get verified creators only. */
export function getVerifiedCreators(): CreatorEntry[] {
  return CREATORS_DATASET.filter((c) => c.verified);
}

/** Get all unique countries with their creator count. */
export function getCountryStats(): Array<{ countryCode: CreatorCountryCode; country: string; count: number }> {
  const map = new Map<string, { countryCode: CreatorCountryCode; country: string; count: number }>();
  for (const c of CREATORS_DATASET) {
    const existing = map.get(c.countryCode);
    if (existing) {
      existing.count++;
    } else {
      map.set(c.countryCode, { countryCode: c.countryCode, country: c.country, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

/** Get all unique categories with their creator count. */
export function getCategoryStats(): Array<{ category: string; niche: CreatorNicheId; count: number }> {
  const map = new Map<string, { category: string; niche: CreatorNicheId; count: number }>();
  for (const c of CREATORS_DATASET) {
    const key = c.category.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.count++;
    } else {
      map.set(key, { category: c.category, niche: c.niche, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
