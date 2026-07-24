/**
 * Rankings service for /top-creators pages.
 *
 * Provides ranking logic for creators that can be filtered by
 * country, category, or niche. Rankings are derived purely from
 * the dataset — no external API calls.
 */

import { CREATORS_DATASET } from "@/data/creators/dataset";
import type { CreatorEntry, CreatorCountryCode, CreatorNicheId } from "@/data/creators/schema";
import { findCountry, findNiche } from "./rpmData";
import { COUNTRY_SLUGS, getAllCountrySlugs } from "./countryData";
import { CATEGORY_SLUGS, getAllCategorySlugs } from "./categoryData";

// ─── Types ──────────────────────────────────────────────────────────

export type RankingCriteria = "subscribers" | "earnings" | "views" | "growth";

export interface RankedCreator {
  rank: number;
  creator: CreatorEntry;
  /** Score used for ranking (different meaning per criteria). */
  score: number;
  /** Human-readable score label. */
  scoreLabel: string;
  /** Estimated monthly earnings (for display). */
  estimatedMonthlyEarnings: number;
  /** Estimated RPM. */
  estimatedRpm: number;
}

export interface RankingsPageData {
  title: string;
  description: string;
  slug: string;
  filter: string | null;
  filterType: "country" | "category" | "all";
  creators: RankedCreator[];
  total: number;
}

// ─── Subscriber tier to approximate subscriber count ────────────────

const TIER_APPROX_SUBS: Record<string, number> = {
  mega: 30_000_000,
  large: 5_000_000,
  mid: 1_000_000,
  emerging: 250_000,
};

// ─── Score computation ──────────────────────────────────────────────

function computeCreatorScore(creator: CreatorEntry, criteria: RankingCriteria): number {
  const country = findCountry(creator.countryCode);
  const niche = findNiche(creator.niche);
  const approxSubs = TIER_APPROX_SUBS[creator.subscriberTier] ?? 500_000;

  switch (criteria) {
    case "subscribers":
      return approxSubs;
    case "earnings": {
      // Estimate monthly earnings based on approximate monthly views
      // Assumes 10% of subscribers watch monthly (very rough)
      const approxMonthlyViews = approxSubs * 0.1;
      const rpm = country.baseRpm * niche.rpmMultiplier;
      return (approxMonthlyViews / 1000) * rpm;
    }
    case "views":
      // Approximate total views (rough heuristic)
      return approxSubs * 100;
    case "growth":
      // No real growth data — use tier as proxy (newer = higher growth)
      return creator.subscriberTier === "emerging" ? 4
        : creator.subscriberTier === "mid" ? 3
        : creator.subscriberTier === "large" ? 2
        : 1;
    default:
      return 0;
  }
}

// ─── Build rankings ─────────────────────────────────────────────────

export function buildRankings(opts: {
  criteria?: RankingCriteria;
  countryCode?: CreatorCountryCode;
  category?: string;
  niche?: CreatorNicheId;
  limit?: number;
}): RankedCreator[] {
  const {
    criteria = "subscribers",
    countryCode,
    category,
    niche,
    limit = 50,
  } = opts;

  let creators = [...CREATORS_DATASET];

  if (countryCode) {
    creators = creators.filter((c) => c.countryCode === countryCode);
  }

  if (category) {
    const cat = category.toLowerCase();
    creators = creators.filter((c) => c.category.toLowerCase() === cat);
  }

  if (niche) {
    creators = creators.filter((c) => c.niche === niche);
  }

  const scored = creators.map((creator) => {
    const score = computeCreatorScore(creator, criteria);
    const country = findCountry(creator.countryCode);
    const nicheData = findNiche(creator.niche);
    const approxSubs = TIER_APPROX_SUBS[creator.subscriberTier] ?? 500_000;
    const approxMonthlyViews = approxSubs * 0.1;
    const rpm = country.baseRpm * nicheData.rpmMultiplier;
    const estimatedMonthlyEarnings = (approxMonthlyViews / 1000) * rpm;

    let scoreLabel: string;
    switch (criteria) {
      case "subscribers":
        scoreLabel = `~${formatLargeNumber(score)} subscribers`;
        break;
      case "earnings":
        scoreLabel = `~$${formatLargeNumber(score)}/mo`;
        break;
      case "views":
        scoreLabel = `~${formatLargeNumber(score)} total views`;
        break;
      case "growth":
        scoreLabel = score >= 4 ? "High growth" : score >= 3 ? "Moderate" : "Steady";
        break;
      default:
        scoreLabel = "";
    }

    return {
      creator,
      score,
      scoreLabel,
      estimatedMonthlyEarnings,
      estimatedRpm: rpm,
      rank: 0,
    };
  });

  // Sort descending
  scored.sort((a, b) => b.score - a.score);

  // Assign ranks
  return scored.slice(0, limit).map((item, i) => ({
    ...item,
    rank: i + 1,
  }));
}

// ─── Rankings page data builder ─────────────────────────────────────

export function getRankingsPageData(filter?: string): RankingsPageData | null {
  if (!filter) {
    // All creators ranking
    const ranked = buildRankings({ criteria: "subscribers", limit: 50 });
    return {
      title: "Top YouTube Creators",
      description: "The highest-ranked YouTube creators by estimated subscribers, earnings, and views.",
      slug: "top-creators",
      filter: null,
      filterType: "all",
      creators: ranked,
      total: ranked.length,
    };
  }

  // Check if filter is a country slug
  const countryCode = COUNTRY_SLUGS[filter] as CreatorCountryCode | undefined;
  if (countryCode) {
    const ranked = buildRankings({ criteria: "subscribers", countryCode, limit: 50 });
    if (ranked.length === 0) return null;
    const countryLabel = ranked[0]?.creator.country ?? filter;
    return {
      title: `Top YouTube Creators in ${countryLabel}`,
      description: `The highest-ranked YouTube creators from ${countryLabel} by subscribers and estimated earnings.`,
      slug: `top-creators/${filter}`,
      filter,
      filterType: "country",
      creators: ranked,
      total: ranked.length,
    };
  }

  // Check if filter is a category slug
  const categoryConfig = CATEGORY_SLUGS[filter] as { nicheId: CreatorNicheId; displayName: string } | undefined;
  if (categoryConfig) {
    const ranked = buildRankings({ criteria: "subscribers", niche: categoryConfig.nicheId, limit: 50 });
    if (ranked.length === 0) return null;
    return {
      title: `Top ${categoryConfig.displayName} YouTube Creators`,
      description: `The highest-ranked ${categoryConfig.displayName} YouTube creators by subscribers and estimated earnings.`,
      slug: `top-creators/${filter}`,
      filter,
      filterType: "category",
      creators: ranked,
      total: ranked.length,
    };
  }

  return null;
}

/**
 * Get all valid ranking filter slugs for static generation.
 */
export function getAllRankingFilterSlugs(): string[] {
  const countrySlugs = getAllCountrySlugs();
  const categorySlugs = getAllCategorySlugs();

  return [...countrySlugs, ...categorySlugs];
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatLargeNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}
