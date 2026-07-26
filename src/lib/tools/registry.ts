/**
 * Unified Tool Registry — Single Source of Truth
 *
 * This module is the canonical registry for every public tool on BeHumler.
 * It powers:
 *   - Homepage tool discovery (categories, featured, collections)
 *   - Global search (fuzzy matching against title, description, tags)
 *   - Category pages (dynamic tool counts)
 *   - Related tools computation (shared tags/category)
 *   - Sitemap inclusion verification
 *   - Dynamic search placeholder and stats
 *
 * To add a new tool: append one entry to TOOL_REGISTRY below.
 * Everything else (search index, category counts, collections) derives
 * automatically.
 */

// ─── Types ──────────────────────────────────────────────────────────

export type ToolCategoryId =
  | "creator-analytics"
  | "developer-tools"
  | "decision-random"
  | "text-tools"
  | "calculators"
  | "converters"
  | "utilities"
  | "web-tools";

export interface ToolEntry {
  /** URL-safe slug — matches the Next.js route segment. */
  slug: string;
  /** Full href path (without locale prefix). */
  href: string;
  /** Display title shown in cards and search results. */
  title: string;
  /** Short description (1 sentence, <120 chars ideal). */
  description: string;
  /** Primary category assignment. */
  category: ToolCategoryId;
  /** Search tags — keywords users might type to find this tool. */
  tags: string[];
  /**
   * Search aliases — alternative names or phrases users commonly
   * type when looking for this tool. Improves fuzzy search matching.
   * E.g. "head tail", "coin toss", "heads or tails" for Coin Flip.
   */
  aliases?: string[];
  /** Whether this tool is featured on the homepage. */
  featured?: boolean;
  /** Whether this tool is considered popular (high usage). */
  popular?: boolean;
  /** Badge text override (defaults to category label). */
  badge?: string;
  /**
   * SEO metadata overrides. When provided, these take precedence
   * over auto-generated values in sitemap and metadata.
   */
  seo?: {
    /** Override meta title. */
    title?: string;
    /** Override meta description. */
    description?: string;
    /** Additional keywords beyond tags. */
    keywords?: string[];
  };
  /**
   * Analytics fields — populated from real usage data.
   * These drive the "Popular" and "Most Used" collections.
   * When not set, the tool uses manual featured/popular flags.
   */
  analytics?: {
    /** Total page views (all time). */
    views?: number;
    /** Computed popularity score (0-100). */
    popularityScore?: number;
    /** Date the tool was launched. */
    launchDate?: string;
  };
}

// ─── Registry ───────────────────────────────────────────────────────

export const TOOL_REGISTRY: readonly ToolEntry[] = [
  // ── Creator Analytics ─────────────────────────────────────────────
  {
    slug: "youtube-money-calculator",
    href: "/#find-channel",
    title: "YouTube Money Calculator",
    description: "Estimate any YouTube channel's monthly earnings from public statistics.",
    category: "creator-analytics",
    tags: ["youtube", "money", "earnings", "revenue", "income", "channel", "creator"],
    aliases: ["how much does a youtuber make", "youtube income", "channel earnings estimator"],
    featured: true,
    popular: true,
    badge: "Flagship",
  },
  {
    slug: "youtube-rpm-calculator",
    href: "/youtube-rpm-calculator",
    title: "YouTube RPM Calculator",
    description: "Calculate revenue per mille from total views and earnings.",
    category: "creator-analytics",
    tags: ["rpm", "revenue", "views", "youtube", "monetization"],
    popular: true,
  },
  {
    slug: "youtube-cpm-calculator",
    href: "/youtube-cpm-calculator",
    title: "YouTube CPM Calculator",
    description: "Calculate cost per mille for advertisers from ad spend and impressions.",
    category: "creator-analytics",
    tags: ["cpm", "advertising", "cost", "impressions", "youtube"],
  },
  {
    slug: "youtube-shorts-calculator",
    href: "/youtube-shorts-calculator",
    title: "YouTube Shorts Calculator",
    description: "Estimate Shorts revenue based on views and Shorts-specific RPM rates.",
    category: "creator-analytics",
    tags: ["shorts", "youtube", "revenue", "short-form", "viral"],
  },
  {
    slug: "youtube-sponsorship-calculator",
    href: "/youtube-sponsorship-calculator",
    title: "Sponsorship Rate Calculator",
    description: "Estimate per-video sponsorship rates based on subscribers and engagement.",
    category: "creator-analytics",
    tags: ["sponsorship", "brand deal", "rate", "pricing", "creator"],
  },
  {
    slug: "youtube-engagement-calculator",
    href: "/youtube-engagement-calculator",
    title: "Engagement Rate Calculator",
    description: "Calculate engagement rate from likes, comments, shares, and views.",
    category: "creator-analytics",
    tags: ["engagement", "likes", "comments", "interaction", "audience"],
  },
  {
    slug: "youtube-adsense-calculator",
    href: "/youtube-adsense-calculator",
    title: "YouTube AdSense Calculator",
    description: "Project AdSense revenue from monthly views, RPM, and monetization rate.",
    category: "creator-analytics",
    tags: ["adsense", "ad revenue", "monetization", "youtube", "earnings"],
  },
  {
    slug: "youtube-channel-valuation-calculator",
    href: "/youtube-channel-valuation-calculator",
    title: "Channel Valuation Calculator",
    description: "Estimate market value of a YouTube channel based on revenue multiples.",
    category: "creator-analytics",
    tags: ["valuation", "sell channel", "worth", "market value", "flippa"],
  },
  {
    slug: "youtube-affiliate-calculator",
    href: "/youtube-affiliate-calculator",
    title: "Affiliate Revenue Calculator",
    description: "Model affiliate income from views, CTR, conversion rate, and commission.",
    category: "creator-analytics",
    tags: ["affiliate", "commission", "amazon", "links", "passive income"],
  },
  {
    slug: "youtube-membership-calculator",
    href: "/youtube-membership-calculator",
    title: "Membership Revenue Calculator",
    description: "Estimate channel membership revenue from subscribers and conversion rates.",
    category: "creator-analytics",
    tags: ["membership", "subscribers", "recurring", "join button", "revenue"],
  },
  {
    slug: "youtube-merch-calculator",
    href: "/youtube-merch-calculator",
    title: "Merch Revenue Calculator",
    description: "Estimate merchandise revenue from views, conversion rate, and margins.",
    category: "creator-analytics",
    tags: ["merch", "merchandise", "teespring", "printful", "ecommerce"],
  },
  {
    slug: "instagram-money-calculator",
    href: "/instagram-money-calculator",
    title: "Instagram Money Calculator",
    description: "Estimate Instagram creator earnings from reach, engagement, and niche.",
    category: "creator-analytics",
    tags: ["instagram", "influencer", "sponsored posts", "reels", "stories", "earnings"],
    featured: true,
    popular: true,
  },
  {
    slug: "twitch-bits-calculator",
    href: "/twitch-bits-calculator",
    title: "Twitch Bits Calculator",
    description: "Convert Twitch Bits to USD and see streamer earnings per Bit.",
    category: "creator-analytics",
    tags: ["twitch", "bits", "streaming", "donations", "USD", "converter"],
  },

  // ── Developer Tools ───────────────────────────────────────────────
  {
    slug: "json-formatter",
    href: "/json-formatter",
    title: "JSON Formatter",
    description: "Beautify, minify, and validate JSON with customizable indentation.",
    category: "developer-tools",
    tags: ["json", "format", "beautify", "minify", "validate", "prettify"],
    aliases: ["json beautifier", "json validator", "pretty print json", "json lint"],
    featured: true,
    popular: true,
  },
  {
    slug: "jwt-decoder",
    href: "/jwt-decoder",
    title: "JWT Decoder",
    description: "Decode JWT tokens locally. View header, payload, and expiry status.",
    category: "developer-tools",
    tags: ["jwt", "token", "decode", "auth", "authentication", "header", "payload"],
    featured: true,
    popular: true,
  },
  {
    slug: "base64-encoder-decoder",
    href: "/base64-encoder-decoder",
    title: "Base64 Encoder/Decoder",
    description: "Encode and decode Base64 and Base64URL with full Unicode support.",
    category: "developer-tools",
    tags: ["base64", "encode", "decode", "base64url", "binary", "unicode"],
  },
  {
    slug: "uuid-generator",
    href: "/uuid-generator",
    title: "UUID Generator",
    description: "Generate cryptographically secure UUID v4 identifiers in bulk.",
    category: "developer-tools",
    tags: ["uuid", "guid", "unique id", "random", "v4", "identifier"],
    aliases: ["guid generator", "unique id generator", "random id"],
    featured: true,
    popular: true,
  },
  {
    slug: "cron-expression-generator",
    href: "/cron-expression-generator",
    title: "Cron Expression Generator",
    description: "Build, validate, and humanize standard 5-field Unix cron expressions.",
    category: "developer-tools",
    tags: ["cron", "schedule", "crontab", "job", "timer", "unix"],
  },
  {
    slug: "unix-timestamp-converter",
    href: "/unix-timestamp-converter",
    title: "Unix Timestamp Converter",
    description: "Convert Unix timestamps to human-readable dates and vice versa.",
    category: "developer-tools",
    tags: ["unix", "timestamp", "epoch", "date", "time", "converter"],
  },
  {
    slug: "url-encoder-decoder",
    href: "/url-encoder-decoder",
    title: "URL Encoder/Decoder",
    description: "Encode and decode URL components and full URIs with reserved char reference.",
    category: "developer-tools",
    tags: ["url", "encode", "decode", "percent encoding", "uri", "query string"],
  },
  {
    slug: "regex-tester",
    href: "/regex-tester",
    title: "Regex Tester",
    description: "Test JavaScript regular expressions with live match highlighting and groups.",
    category: "developer-tools",
    tags: ["regex", "regular expression", "pattern", "match", "test", "replace"],
    featured: true,
  },
  {
    slug: "sql-to-json-converter",
    href: "/sql-to-json-converter",
    title: "SQL to JSON Converter",
    description: "Convert SQL INSERT statements to structured JSON data.",
    category: "converters",
    tags: ["sql", "json", "convert", "insert", "database", "data"],
  },
  {
    slug: "csv-to-json-converter",
    href: "/csv-to-json-converter",
    title: "CSV to JSON Converter",
    description: "Parse CSV data into JSON with delimiter detection and nested key support.",
    category: "converters",
    tags: ["csv", "json", "convert", "spreadsheet", "data", "parse"],
  },

  // ── Decision & Random Tools ───────────────────────────────────────
  {
    slug: "spin-the-wheel",
    href: "/spin-the-wheel",
    title: "Spin the Wheel",
    description: "Customizable spinning wheel to randomly pick from your options.",
    category: "decision-random",
    tags: ["spin", "wheel", "random", "picker", "decision", "choose"],
    aliases: ["spinner wheel", "random wheel picker", "wheel of fortune", "prize wheel"],
    featured: true,
    popular: true,
  },
  {
    slug: "coin-flip",
    href: "/coin-flip",
    title: "Coin Flip",
    description: "Flip a virtual coin for instant Heads or Tails with multi-flip support.",
    category: "decision-random",
    tags: ["coin", "flip", "heads", "tails", "random", "toss"],
    aliases: ["heads or tails", "coin toss", "head tail", "flip a coin"],
    featured: true,
    popular: true,
  },
  {
    slug: "dice-roller",
    href: "/dice-roller",
    title: "Dice Roller",
    description: "Roll virtual dice from d4 to d100 with animated results and history.",
    category: "decision-random",
    tags: ["dice", "roll", "d20", "d6", "rpg", "tabletop", "game"],
    aliases: ["roll dice", "d20 roller", "dnd dice", "virtual dice"],
    popular: true,
  },
  {
    slug: "random-number-generator",
    href: "/random-number-generator",
    title: "Random Number Generator",
    description: "Generate random numbers in any range with multi-generation support.",
    category: "decision-random",
    tags: ["random", "number", "rng", "generator", "range", "integer"],
    aliases: ["rng", "pick a number", "number picker", "random integer"],
    popular: true,
  },
  {
    slug: "random-name-picker",
    href: "/random-name-picker",
    title: "Random Name Picker",
    description: "Pick random names from a list using unbiased Fisher-Yates selection.",
    category: "decision-random",
    tags: ["name", "picker", "random", "winner", "raffle", "draw"],
  },
  {
    slug: "yes-no-picker-wheel",
    href: "/yes-no-picker-wheel",
    title: "Yes/No Picker Wheel",
    description: "Spin a wheel to get a random Yes or No answer with configurable odds.",
    category: "decision-random",
    tags: ["yes", "no", "decision", "wheel", "random", "answer"],
  },
  {
    slug: "random-team-generator",
    href: "/random-team-generator",
    title: "Random Team Generator",
    description: "Split a list of names into balanced random teams instantly.",
    category: "decision-random",
    tags: ["team", "group", "split", "random", "balance", "classroom"],
  },
  {
    slug: "truth-or-dare-generator",
    href: "/truth-or-dare-generator",
    title: "Truth or Dare Generator",
    description: "Generate truth or dare questions for parties with 9 categories and 4 difficulty levels.",
    category: "decision-random",
    tags: ["truth", "dare", "party", "game", "questions", "fun"],
  },

  // ── Text Tools ────────────────────────────────────────────────────
  {
    slug: "character-counter",
    href: "/character-counter",
    title: "Character Counter",
    description: "Count characters, words, and sentences in real time with platform limits.",
    category: "text-tools",
    tags: ["character", "count", "word", "letter", "twitter", "limit", "text"],
    popular: true,
  },
  {
    slug: "word-counter",
    href: "/word-counter",
    title: "Word Counter",
    description: "Analyze word count, keyword density, reading time, and page estimates.",
    category: "text-tools",
    tags: ["word", "count", "keyword", "density", "reading time", "seo", "text"],
    aliases: ["word count tool", "text length", "essay word counter", "how many words"],
    featured: true,
    popular: true,
  },

  // ── Utilities ─────────────────────────────────────────────────────
  {
    slug: "random-color-generator",
    href: "/random-color-generator",
    title: "Random Color Generator",
    description: "Generate random colors with HEX, RGB, HSL values and palette modes.",
    category: "utilities",
    tags: ["color", "hex", "rgb", "hsl", "palette", "random", "css", "design"],
    popular: true,
  },
] as const;

// ─── Derived Data ───────────────────────────────────────────────────

/** Total number of tools in the registry. */
export const TOOL_COUNT = TOOL_REGISTRY.length;

/** Dynamic search placeholder using the real tool count. */
export function getSearchPlaceholder(): string {
  // Round down to nearest 5 for a cleaner number
  const rounded = Math.floor(TOOL_COUNT / 5) * 5;
  return `Search ${rounded}+ tools...`;
}

/** Get a tool entry by slug. */
export function getToolBySlug(slug: string): ToolEntry | undefined {
  return TOOL_REGISTRY.find((t) => t.slug === slug);
}

/** Get a tool entry by href. */
export function getToolByHref(href: string): ToolEntry | undefined {
  return TOOL_REGISTRY.find((t) => t.href === href);
}

/** Get all tools in a category. */
export function getToolsByCategory(category: ToolCategoryId): ToolEntry[] {
  return TOOL_REGISTRY.filter((t) => t.category === category);
}

/** Get all tools marked as featured. */
export function getFeaturedTools(): ToolEntry[] {
  return TOOL_REGISTRY.filter((t) => t.featured);
}

/** Get all tools marked as popular. */
export function getPopularTools(): ToolEntry[] {
  return TOOL_REGISTRY.filter((t) => t.popular);
}

/** Count tools per category. */
export function getToolCountByCategory(): Record<ToolCategoryId, number> {
  const counts = {} as Record<ToolCategoryId, number>;
  for (const tool of TOOL_REGISTRY) {
    counts[tool.category] = (counts[tool.category] ?? 0) + 1;
  }
  return counts;
}
