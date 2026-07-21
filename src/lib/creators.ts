/**
 * Curated creator catalog.
 *
 * The Creator Profile pages at `/[locale]/creator/[slug]` are driven
 * entirely by this table. Adding a new creator is a one-line change:
 * append an entry to `CREATORS`, deploy, and the route + sitemap
 * pick it up automatically.
 *
 * Design rules:
 *
 *   1. **`channelId` is preferred.**  Real YouTube channel IDs are
 *      strong "UC…" identifiers. When set, the server resolver
 *      uses `getChannelById()` directly — cheapest path (1 unit).
 *      When we don't have a verified id we leave it empty and the
 *      server resolver falls back to `getChannelByHandle()` at
 *      request time (also 1 unit, cached 24h). search.list is
 *      NEVER used.
 *
 *   2. **`countryCode` / `nicheId` are internal `rpmData` ids.**  The
 *      user-facing `country` string ("USA", "India") is for display;
 *      `countryCode` (e.g. "US", "IN") plugs into `findCountry()` for
 *      the earnings estimate. Same story for `category` (display) vs.
 *      `nicheId` (looked up in `NICHES`).
 *
 *   3. **`relatedCreators` is a list of slugs**, not full records —
 *      that avoids circular references and keeps the graph editable
 *      at the top level. If a listed slug doesn't exist, it is
 *      silently ignored by the profile page.
 *
 *   4. **We do not fabricate numbers.**  Nothing in this table
 *      encodes a "known" subscriber count or view count. Anything
 *      that shows up on the page comes from the live YouTube API,
 *      or (on quota / network failure) a clearly-labelled fallback.
 *
 *   5. **The order here is the default order used on the
 *      `/[locale]/creators` index** when no filter is active. Global
 *      creators first, then India, roughly matching audience reach.
 */

import { COUNTRIES, NICHES, findCountry, findNiche } from "./rpmData";

/** ISO-3166 alpha-2 country code that maps to an `rpmData` COUNTRY entry. */
export type CreatorCountryCode = (typeof COUNTRIES)[number]["id"];
/** Niche id that maps to an `rpmData` NICHE entry. */
export type CreatorNicheId = (typeof NICHES)[number]["id"];

/** The default content mix an earnings estimate should assume. */
export type CreatorContentType = "long" | "shorts" | "mixed";

/**
 * A single creator record. Every field except `channelId`,
 * `countryCode`, `nicheId`, `contentType`, and the two `image*`
 * hints is required.
 */
export interface Creator {
  /** URL-safe slug (must be unique across the table). */
  slug: string;
  /** Display name — what the profile hero renders. */
  displayName: string;
  /** YouTube handle including the `@`. */
  youtubeHandle: string;
  /**
   * YouTube channel id (`UC…`). Optional. When empty, the profile
   * page resolves the channel via `searchChannels(youtubeHandle)` at
   * request time. Leave empty if you're not 100% sure of the id.
   */
  channelId: string;
  /** Human-readable country label used on the page. */
  country: string;
  /**
   * ISO country id (matches `COUNTRIES[i].id` in `rpmData.ts`). Used
   * for the earnings estimate. Defaults to "OTHER" if omitted.
   */
  countryCode?: CreatorCountryCode;
  /** Human-readable category label used on the page. */
  category: string;
  /**
   * Niche id (matches `NICHES[i].id` in `rpmData.ts`). Used for the
   * earnings estimate. If omitted, we derive a sensible default from
   * `category` — see `resolveNicheId`.
   */
  nicheId?: CreatorNicheId;
  /**
   * Predominant content mix. Drives which RPM path the earnings
   * estimate uses. Default: "mixed".
   */
  contentType?: CreatorContentType;
  /** Short blurb rendered under the hero. */
  description: string;
  /**
   * Optional fallback avatar / banner URL used when the YouTube API
   * is unavailable at render time. Must be on an allowed remote
   * pattern from `next.config.mjs` (yt3.ggpht.com,
   * yt3.googleusercontent.com, i.ytimg.com, i9.ytimg.com,
   * lh3.googleusercontent.com) — otherwise leave empty and the UI
   * renders a placeholder gradient.
   */
  fallbackAvatarUrl?: string;
  fallbackBannerUrl?: string;
  /** Slugs of related creators to surface in the "Related Creators" strip. */
  relatedCreators: string[];
}

/**
 * The Phase 1 catalog. Any additional creators can simply be appended.
 *
 * Phase 4 (quota fix): Channel IDs have been populated for all
 * creators whose official handle resolves unambiguously via
 * channels.list(forHandle). This eliminates runtime search.list
 * calls for the entire catalog.
 */
export const CREATORS: readonly Creator[] = [
  // ── Global ────────────────────────────────────────────────────
  {
    slug: "mrbeast",
    displayName: "MrBeast",
    youtubeHandle: "@MrBeast",
    channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
    country: "USA",
    countryCode: "US",
    category: "Entertainment",
    nicheId: "entertainment",
    contentType: "long",
    description:
      "One of the largest YouTube creators, known for large-scale challenges, philanthropy, and record-breaking videos.",
    relatedCreators: ["ishowspeed", "ksi", "loganpaul", "jakepaul"],
  },
  {
    slug: "ishowspeed",
    displayName: "IShowSpeed",
    youtubeHandle: "@IShowSpeed",
    channelId: "",
    country: "USA",
    countryCode: "US",
    category: "Entertainment",
    nicheId: "entertainment",
    contentType: "mixed",
    description:
      "Live-streamer and entertainer known for reaction videos, gaming, and viral moments.",
    relatedCreators: ["mrbeast", "ksi", "loganpaul"],
  },
  {
    slug: "markiplier",
    displayName: "Markiplier",
    youtubeHandle: "@markiplier",
    channelId: "UC7_YxT-KID8kRbqZo7MyscQ",
    country: "USA",
    countryCode: "US",
    category: "Gaming",
    nicheId: "gaming",
    contentType: "long",
    description:
      "Long-time YouTuber and gaming creator best known for horror playthroughs and comedic commentary.",
    relatedCreators: ["coryxkenshin", "pewdiepie", "mrbeast"],
  },
  {
    slug: "coryxkenshin",
    displayName: "CoryxKenshin",
    youtubeHandle: "@CoryxKenshin",
    channelId: "UCpB959t8iPrxQWj7G6n0ctQ",
    country: "USA",
    countryCode: "US",
    category: "Gaming",
    nicheId: "gaming",
    contentType: "long",
    description:
      "Gaming creator with a signature energetic style — best known for horror-game playthroughs.",
    relatedCreators: ["markiplier", "pewdiepie", "mrbeast"],
  },
  {
    slug: "sidemen",
    displayName: "Sidemen",
    youtubeHandle: "@Sidemen",
    channelId: "UCDogdKl7t7NHzQ95aEwkdMw",
    country: "UK",
    countryCode: "GB",
    category: "Entertainment",
    nicheId: "entertainment",
    contentType: "long",
    description:
      "British YouTube group producing challenges, sketches, and reality-style series.",
    relatedCreators: ["ksi", "mrbeast", "loganpaul"],
  },
  {
    slug: "ksi",
    displayName: "KSI",
    youtubeHandle: "@KSI",
    channelId: "UCGSfMkBdr4YjBKGRhKKbEgQ",
    country: "UK",
    countryCode: "GB",
    category: "Entertainment",
    nicheId: "entertainment",
    contentType: "long",
    description:
      "British YouTuber, musician and boxer — a founding member of the Sidemen.",
    relatedCreators: ["sidemen", "mrbeast", "loganpaul", "jakepaul"],
  },
  {
    slug: "pewdiepie",
    displayName: "PewDiePie",
    youtubeHandle: "@PewDiePie",
    channelId: "UC-lHJZR3Gqxm24_Vd_AJ5Yw",
    country: "Japan",
    countryCode: "JP",
    category: "Gaming",
    nicheId: "gaming",
    contentType: "long",
    description:
      "One of the most-subscribed independent YouTubers, known for gaming and commentary.",
    relatedCreators: ["markiplier", "coryxkenshin", "mrbeast"],
  },
  {
    slug: "loganpaul",
    displayName: "Logan Paul",
    youtubeHandle: "@LoganPaulVlogs",
    channelId: "UCG8rbF3g2AMX70yOd8vqIZg",
    country: "USA",
    countryCode: "US",
    category: "Entertainment",
    nicheId: "entertainment",
    contentType: "long",
    description:
      "American YouTuber, professional wrestler, and podcaster.",
    relatedCreators: ["jakepaul", "ksi", "mrbeast"],
  },
  {
    slug: "jakepaul",
    displayName: "Jake Paul",
    youtubeHandle: "@JakePaul",
    channelId: "UCcgVECVN4OKV6DH1jLkqmcA",
    country: "USA",
    countryCode: "US",
    category: "Entertainment",
    nicheId: "entertainment",
    contentType: "long",
    description:
      "American YouTuber and professional boxer known for vlogs and boxing content.",
    relatedCreators: ["loganpaul", "ksi", "mrbeast"],
  },
  {
    slug: "joerogan",
    displayName: "Joe Rogan",
    youtubeHandle: "@joerogan",
    channelId: "UCzQUP1qoWDoEbmsQxvdjxgQ",
    country: "USA",
    countryCode: "US",
    category: "Podcast",
    nicheId: "news",
    contentType: "long",
    description:
      "Host of The Joe Rogan Experience — one of the most-watched long-form podcasts in the world.",
    relatedCreators: ["mrbeast", "sidemen", "loganpaul"],
  },

  // ── India ─────────────────────────────────────────────────────
  {
    slug: "carryminati",
    displayName: "CarryMinati",
    youtubeHandle: "@CarryMinati",
    channelId: "UCj22tfcQrWMFIGCeyKP9hQg",
    country: "India",
    countryCode: "IN",
    category: "Comedy",
    nicheId: "entertainment",
    contentType: "long",
    description:
      "One of India's most-subscribed creators, known for roasts, comedy, and gaming content.",
    relatedCreators: ["triggeredinsaan", "bbkivines", "ashishchanchlani", "techburner"],
  },
  {
    slug: "techburner",
    displayName: "Tech Burner",
    youtubeHandle: "@TechBurner",
    channelId: "UCbqKJy3U8sNtbJYjxBP3LZg",
    country: "India",
    countryCode: "IN",
    category: "Technology",
    nicheId: "tech",
    contentType: "long",
    description:
      "Popular Indian tech YouTuber covering smartphone launches, hands-on reviews, and gadget explainers.",
    relatedCreators: ["carryminati", "bbkivines", "sandeepmaheshwari"],
  },
  {
    slug: "ashishchanchlani",
    displayName: "Ashish Chanchlani",
    youtubeHandle: "@ashishchanchlanivines",
    channelId: "UCMwKavFBXaEW6FVUiRF9Kdw",
    country: "India",
    countryCode: "IN",
    category: "Comedy",
    nicheId: "entertainment",
    contentType: "long",
    description:
      "Indian sketch-comedy creator with millions of subscribers, known for family and college-life shorts films.",
    relatedCreators: ["bbkivines", "carryminati", "triggeredinsaan"],
  },
  {
    slug: "bbkivines",
    displayName: "BB Ki Vines",
    youtubeHandle: "@BBKiVines",
    channelId: "UCqwUrj10mAEsqezcItqvwEw",
    country: "India",
    countryCode: "IN",
    category: "Comedy",
    nicheId: "entertainment",
    contentType: "long",
    description:
      "Bhuvan Bam's one-man comedy channel — one of the earliest breakout Indian YouTube creators.",
    relatedCreators: ["ashishchanchlani", "carryminati", "triggeredinsaan"],
  },
  {
    slug: "triggeredinsaan",
    displayName: "Triggered Insaan",
    youtubeHandle: "@TriggeredInsaan",
    channelId: "UCqEt2weBhiTlHSqdN-HMbXA",
    country: "India",
    countryCode: "IN",
    category: "Comedy",
    nicheId: "entertainment",
    contentType: "long",
    description:
      "Indian creator Nischay Malhan — reactions, roasts, and comedy commentary.",
    relatedCreators: ["carryminati", "ashishchanchlani", "totalgaming"],
  },
  {
    slug: "totalgaming",
    displayName: "Total Gaming",
    youtubeHandle: "@TotalGaming093",
    channelId: "UCnJ8-gGDIbz8B2z0jPr8lUg",
    country: "India",
    countryCode: "IN",
    category: "Gaming",
    nicheId: "gaming",
    contentType: "long",
    description:
      "Indian gaming YouTuber known primarily for Free Fire content.",
    relatedCreators: ["carryminati", "triggeredinsaan", "techburner"],
  },
  {
    slug: "round2hell",
    displayName: "Round2Hell",
    youtubeHandle: "@Round2hell",
    channelId: "UCbsIQsLJGEPVb1sG0LMBFcQ",
    country: "India",
    countryCode: "IN",
    category: "Comedy",
    nicheId: "entertainment",
    contentType: "long",
    description:
      "Indian comedy trio producing high-production-value skit videos.",
    relatedCreators: ["bbkivines", "ashishchanchlani", "carryminati"],
  },
  {
    slug: "samayraina",
    displayName: "Samay Raina",
    youtubeHandle: "@SamayRainaOfficial",
    channelId: "UCuyS_bMHAa9S8GCOp2Q4Mig",
    country: "India",
    countryCode: "IN",
    category: "Comedy",
    nicheId: "entertainment",
    contentType: "long",
    description:
      "Indian stand-up comedian and chess streamer known for his live streams and roast events.",
    relatedCreators: ["carryminati", "triggeredinsaan", "dhruvrathee"],
  },
  {
    slug: "sandeepmaheshwari",
    displayName: "Sandeep Maheshwari",
    youtubeHandle: "@SandeepSeminars",
    channelId: "UCRlICXvO4XR4HMeEB9JjDlA",
    country: "India",
    countryCode: "IN",
    category: "Education",
    nicheId: "education",
    contentType: "long",
    description:
      "Indian entrepreneur and motivational speaker whose long-form talks have reached tens of millions of viewers.",
    relatedCreators: ["dhruvrathee", "techburner"],
  },
  {
    slug: "dhruvrathee",
    displayName: "Dhruv Rathee",
    youtubeHandle: "@dhruvrathee",
    channelId: "UCBDuTFk0h3K7gP66o_CVe8A",
    country: "India",
    countryCode: "IN",
    category: "Education",
    nicheId: "education",
    contentType: "long",
    description:
      "Indian creator producing long-form explainer videos on current affairs, science and geopolitics.",
    relatedCreators: ["sandeepmaheshwari", "samayraina"],
  },
] as const;

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
 * Sorted alphabetically by label.
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
 * records. Unknown slugs are silently dropped so a typo in the graph
 * never renders a broken card.
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
//
// If a creator entry omits `nicheId`, we derive one from the visible
// category label using this table. Keeping the mapping tiny and
// explicit means the earnings estimate is deterministic — and easy
// to override per-creator by setting `nicheId` on the record.
//
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
 * Prefers the explicit `nicheId` field, then a category-based
 * heuristic, and finally falls back to "other" so the estimator
 * always has a valid id.
 */
export function resolveNicheId(creator: Creator): CreatorNicheId {
  if (creator.nicheId) return creator.nicheId;
  const key = creator.category.trim().toLowerCase();
  return CATEGORY_TO_NICHE[key] ?? "other";
}

/**
 * Resolve the country id to use for a creator's earnings estimate.
 * Defaults to "OTHER" so `findCountry` never falls through to
 * unpredictable defaults elsewhere.
 */
export function resolveCountryCode(creator: Creator): CreatorCountryCode {
  return creator.countryCode ?? "OTHER";
}

/**
 * Snapshot of the country tier that applies to this creator (for
 * displaying the RPM table row that the earnings estimate uses).
 */
export function getCreatorCountryTier(creator: Creator) {
  return findCountry(resolveCountryCode(creator));
}

/** Snapshot of the niche used by this creator's earnings estimate. */
export function getCreatorNiche(creator: Creator) {
  return findNiche(resolveNicheId(creator));
}
