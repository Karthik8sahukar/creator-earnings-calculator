/**
 * Creator service layer.
 *
 * This module is the public API for creator data throughout the app.
 * It sources from the canonical 200-creator dataset at
 * `src/data/creators/dataset.ts` and exposes the same interface that
 * existing pages, components, and routes have always used.
 *
 * To add a creator: append one entry to `src/data/creators/dataset.ts`.
 * Everything else (this module, sitemap, routes) picks it up automatically.
 */

import { findCountry, findNiche } from "./rpmData";
import { CREATORS_DATASET } from "@/data/creators/dataset";
import { getRelatedCreators } from "@/data/creators/related";
import type { CreatorEntry, CreatorContentType, CreatorCountryCode, CreatorNicheId } from "@/data/creators/schema";

// Re-export canonical types so existing consumers don't break.
export type { CreatorCountryCode, CreatorNicheId, CreatorContentType };

/**
 * A single creator record. The public shape consumed by pages,
 * components, and the profile resolver.
 */
export interface Creator {
  /** URL-safe slug (must be unique across the table). */
  slug: string;
  /** Display name — what the profile hero renders. */
  displayName: string;
  /** YouTube handle including the `@`. */
  youtubeHandle: string;
  /**
   * YouTube channel id (`UC…`). Empty string when unverified.
   * When empty, the profile page resolves the channel via
   * `getChannelByHandle()` at request time (1 unit, cached 24h).
   */
  channelId: string;
  /** Human-readable country label used on the page. */
  country: string;
  /** ISO country id (matches `COUNTRIES[i].id` in `rpmData.ts`). */
  countryCode?: CreatorCountryCode;
  /** Human-readable category label used on the page. */
  category: string;
  /** Niche id (matches `NICHES[i].id` in `rpmData.ts`). */
  nicheId?: CreatorNicheId;
  /** Predominant content mix. Default: "mixed". */
  contentType?: CreatorContentType;
  /** Short blurb rendered under the hero. */
  description: string;
  /** Optional fallback avatar URL. */
  fallbackAvatarUrl?: string;
  /** Optional fallback banner URL. */
  fallbackBannerUrl?: string;
  /** Slugs of related creators. */
  relatedCreators: string[];
}

// ─────────────────────────────────────────────────────────────────
//   Convert canonical dataset → Creator interface
// ─────────────────────────────────────────────────────────────────

function entryToCreator(entry: CreatorEntry): Creator {
  const related = getRelatedCreators(entry, 4);
  return {
    slug: entry.slug,
    displayName: entry.name,
    youtubeHandle: entry.handle,
    channelId: entry.youtubeChannelId ?? "",
    country: entry.country,
    countryCode: entry.countryCode,
    category: entry.category,
    nicheId: entry.niche,
    contentType: entry.contentType,
    description: entry.description,
    fallbackAvatarUrl: entry.avatar ?? undefined,
    fallbackBannerUrl: entry.banner ?? undefined,
    relatedCreators: related.map((r) => r.slug),
  };
}

/**
 * The canonical creator catalog — all 200 creators converted to
 * the Creator interface. Computed once at module load.
 */
const CREATORS: readonly Creator[] = CREATORS_DATASET.map(entryToCreator);

// ─────────────────────────────────────────────────────────────────
//   Lookups + helpers
// ─────────────────────────────────────────────────────────────────

const CREATORS_BY_SLUG: ReadonlyMap<string, Creator> = new Map(
  CREATORS.map((c) => [c.slug, c]),
);

/**
 * Fetch a creator by slug. Returns `undefined` when the slug is not
 * in the catalog — callers are expected to route to `notFound()`.
 */
export function getCreatorBySlug(slug: string): Creator | undefined {
  return CREATORS_BY_SLUG.get(slug);
}

/** All creators, in catalog order. */
export function listCreators(): readonly Creator[] {
  return CREATORS;
}

/**
 * Unique, sorted list of countries used by the /creators filter UI.
 */
export function listCreatorCountries(): readonly string[] {
  return Array.from(new Set(CREATORS.map((c) => c.country))).sort((a, b) =>
    a.localeCompare(b),
  );
}

/**
 * Unique, sorted list of categories used by the /creators filter UI.
 */
export function listCreatorCategories(): readonly string[] {
  return Array.from(new Set(CREATORS.map((c) => c.category))).sort((a, b) =>
    a.localeCompare(b),
  );
}

/**
 * Given a list of related slugs, return the corresponding Creator
 * records. Unknown slugs are silently dropped.
 */
export function resolveRelatedCreators(slugs: readonly string[]): Creator[] {
  const out: Creator[] = [];
  const seen = new Set<string>();
  for (const s of slugs) {
    if (seen.has(s)) continue;
    const c = CREATORS_BY_SLUG.get(s);
    if (c) {
      out.push(c);
      seen.add(s);
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────
//   Category → niche defaults
// ─────────────────────────────────────────────────────────────────

const CATEGORY_TO_NICHE: Readonly<Record<string, CreatorNicheId>> = {
  entertainment: "entertainment",
  comedy: "entertainment",
  gaming: "gaming",
  music: "music",
  technology: "tech",
  tech: "tech",
  education: "education",
  finance: "finance",
  business: "business",
  news: "news",
  lifestyle: "lifestyle",
  food: "food",
  travel: "travel",
  fitness: "health",
  health: "health",
  beauty: "beauty",
  sports: "sports",
  podcast: "news",
  motivation: "education",
};

/**
 * Resolve the niche id to use for a creator's earnings estimate.
 */
export function resolveNicheId(creator: Creator): CreatorNicheId {
  if (creator.nicheId) return creator.nicheId;
  const key = creator.category.trim().toLowerCase();
  return CATEGORY_TO_NICHE[key] ?? "other";
}

/**
 * Resolve the country id to use for a creator's earnings estimate.
 */
export function resolveCountryCode(creator: Creator): CreatorCountryCode {
  return creator.countryCode ?? "OTHER";
}

/**
 * Snapshot of the country tier for a creator's earnings estimate.
 */
export function getCreatorCountryTier(creator: Creator) {
  return findCountry(resolveCountryCode(creator));
}

/** Snapshot of the niche used by this creator's earnings estimate. */
export function getCreatorNiche(creator: Creator) {
  return findNiche(resolveNicheId(creator));
}
