/**
 * Centralized Creator Data Schema.
 *
 * This is the single source of truth for all creator metadata across
 * the platform. Every page (profile, category, country, leaderboard)
 * reads from this schema.
 *
 * Design goals:
 *   - Scales from 20 to 1000+ creators without code changes
 *   - New creators are added by appending to the dataset — no page
 *     edits, no route changes, no component modifications
 *   - All computed relationships (related creators, rankings) are
 *     derived automatically from the data
 *   - Backward-compatible with the existing Creator interface in
 *     src/lib/creators.ts (which remains the runtime adapter)
 *
 * DEPENDENCY RULE: This file must NOT import from src/lib/.
 * All shared types are defined here. src/lib/creators.ts imports from here.
 */

// ─── Shared Canonical Types ─────────────────────────────────────────

/**
 * ISO-3166 alpha-2 country code matching the rpmData COUNTRIES table.
 * Defined here so the data layer does not depend on the service layer.
 */
export type CreatorCountryCode =
  | "US" | "GB" | "CA" | "AU" | "DE" | "FR" | "NL" | "SE"
  | "JP" | "KR" | "IN" | "BR" | "MX" | "ES" | "IT" | "ID"
  | "PH" | "ZA" | "AE" | "OTHER";

/**
 * Niche ID matching the rpmData NICHES table.
 * Defined here so the data layer does not depend on the service layer.
 */
export type CreatorNicheId =
  | "finance" | "business" | "marketing" | "tech" | "education"
  | "health" | "auto" | "science" | "beauty" | "lifestyle"
  | "food" | "travel" | "news" | "diy" | "sports"
  | "entertainment" | "gaming" | "music" | "kids" | "other";

/** The default content mix an earnings estimate should assume. */
export type CreatorContentType = "long" | "shorts" | "mixed";

// ─── Core Types ─────────────────────────────────────────────────────

/**
 * Social links for a creator. All optional — only populated when
 * verified or publicly known.
 */
export interface CreatorSocialLinks {
  twitter?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
  discord?: string;
  twitch?: string;
  facebook?: string;
  linkedin?: string;
  threads?: string;
  businessEmail?: string;
}

/**
 * A featured video entry for the local dataset. Rendered on the
 * profile page when live video data is unavailable.
 */
export interface CreatorFeaturedVideo {
  /** YouTube video ID. */
  videoId: string;
  /** Title of the video. */
  title: string;
  /** Approximate view count (for display). */
  views?: number;
}

/**
 * A notable achievement or milestone for the creator.
 */
export interface CreatorAchievement {
  /** Year the achievement occurred. */
  year: number;
  /** Short description of the achievement. */
  label: string;
}

/**
 * The canonical creator record for the data platform.
 *
 * Every field is documented with its purpose and whether it's
 * required for the page to render or just enrichment.
 */
export interface CreatorEntry {
  /** Unique identifier. Same as slug for simplicity. */
  id: string;

  /** URL-safe slug. Must be unique across the entire dataset. */
  slug: string;

  /** Display name — rendered on profile hero, cards, leaderboards. */
  name: string;

  /** YouTube handle including the @. E.g. "@MrBeast". */
  handle: string;

  /**
   * YouTube channel ID (UC...). Null when unverified.
   * When null, runtime resolves via channels.list(forHandle).
   */
  youtubeChannelId: string | null;

  /** Human-readable country name for display. E.g. "United States". */
  country: string;

  /** ISO-3166 alpha-2 code mapping to rpmData COUNTRIES. */
  countryCode: CreatorCountryCode;

  /** Primary language of the channel's content. */
  language: string;

  /** Human-readable category for display. E.g. "Gaming". */
  category: string;

  /**
   * Niche ID mapping to rpmData NICHES for earnings estimation.
   * E.g. "gaming", "finance", "entertainment".
   */
  niche: CreatorNicheId;

  /** Content type for RPM path selection. */
  contentType: CreatorContentType;

  /** Short description (1-2 sentences) for cards and meta descriptions. */
  description: string;

  /**
   * SEO keywords specific to this creator. Used in meta tags and
   * for internal search relevance.
   */
  keywords: string[];

  /**
   * Fallback avatar URL (YouTube CDN). Used when the live API is
   * unavailable. Null = render initial-based placeholder.
   */
  avatar: string | null;

  /**
   * Fallback banner URL. Null = no banner (renders gradient).
   */
  banner: string | null;

  /** Social links. Empty object = no social links. */
  socialLinks: CreatorSocialLinks;

  /**
   * Whether this creator's channelId has been verified via the
   * YouTube API. Unverified entries may need manual confirmation.
   */
  verified: boolean;

  /**
   * Subscriber tier for leaderboard bucketing.
   * Computed from approximate subscriber count ranges.
   */
  subscriberTier: "mega" | "large" | "mid" | "emerging";

  // ─── Rich Profile Fields (optional, populated for full profiles) ───

  /**
   * Extended biography (2-5 sentences). Used on the profile page.
   * Falls back to `description` when not provided.
   */
  biography?: string;

  /**
   * Year the creator started their YouTube channel.
   */
  yearStarted?: number;

  /**
   * Approximate subscriber count for the local dataset. Used when
   * the YouTube API is unavailable. Null = show "—".
   */
  estimatedSubscribers?: number;

  /**
   * Approximate monthly views for the local dataset. Used for
   * earnings estimation when YouTube API is unavailable.
   */
  estimatedMonthlyViews?: number;

  /**
   * Featured/notable videos from this creator. Displayed on the
   * profile page as a fallback when live video data is unavailable.
   */
  featuredVideos?: CreatorFeaturedVideo[];

  /**
   * Notable achievements and milestones.
   */
  achievements?: CreatorAchievement[];

  /**
   * Tags for content categorization and search discovery.
   * E.g. ["challenge", "philanthropy", "viral"]
   */
  tags?: string[];

  /**
   * The full YouTube channel URL. Derived from handle if not set.
   */
  youtubeUrl?: string;
}

// ─── Category & Country Metadata ────────────────────────────────────

/**
 * Category metadata for /creators/[category] pages.
 */
export interface CategoryMeta {
  /** URL slug. E.g. "gaming", "technology". */
  slug: string;
  /** Display name. E.g. "Gaming", "Technology". */
  label: string;
  /** Niche ID mapping (for earnings). */
  nicheId: CreatorNicheId;
  /** SEO title template. */
  title: string;
  /** Meta description. */
  description: string;
  /** Intro paragraph for the category page. */
  intro: string;
  /** Priority in navigation (lower = first). */
  priority: number;
}

/**
 * Country metadata for /creators/[country] pages.
 */
export interface CountryMeta {
  /** URL slug. E.g. "india", "usa", "germany". */
  slug: string;
  /** Display name. E.g. "India", "United States". */
  label: string;
  /** ISO code matching rpmData. */
  countryCode: CreatorCountryCode;
  /** SEO title template. */
  title: string;
  /** Meta description. */
  description: string;
  /** Intro paragraph for the country page. */
  intro: string;
  /** FAQ entries for the country page. */
  faq: Array<{ question: string; answer: string }>;
}

// ─── Leaderboard Types ──────────────────────────────────────────────

/**
 * Leaderboard definition for reusable ranking pages.
 */
export interface LeaderboardDef {
  /** URL slug. E.g. "top-gaming-creators". */
  slug: string;
  /** Page title. */
  title: string;
  /** Meta description. */
  description: string;
  /** Intro text. */
  intro: string;
  /** Filter function determining which creators appear. */
  filter: (creator: CreatorEntry) => boolean;
  /** Sort criteria. */
  sortBy: "name" | "country" | "category" | "subscriberTier";
  /** Maximum entries to show. */
  limit: number;
}
