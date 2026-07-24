/**
 * Category data service for /category/[slug] pages.
 *
 * Merges the rpmData niches with the creator dataset to produce
 * rich category pages with statistics, top creators, and RPM data.
 */

import { CREATORS_DATASET } from "@/data/creators/dataset";
import type { CreatorEntry, CreatorCountryCode, CreatorNicheId } from "@/data/creators/schema";
import { COUNTRIES, findNiche } from "./rpmData";

// ─── Category page metadata ─────────────────────────────────────────

export interface CategoryPageData {
  slug: string;
  nicheId: CreatorNicheId;
  label: string;
  /** Display category name (from the dataset, title-cased). */
  displayName: string;
  rpmMultiplier: number;
  shortsRpmMultiplier: number;
  creators: CreatorEntry[];
  topCreators: CreatorEntry[];
  totalCreators: number;
  topCountries: Array<{ country: string; countryCode: CreatorCountryCode; count: number }>;
  /** Average RPM across all countries for this niche. */
  averageRpm: number;
  /** Average Shorts RPM across all countries. */
  averageShortsRpm: number;
  /** Estimated CPM (RPM × ~1.8). */
  estimatedCpm: number;
}

/**
 * Map from URL slug → niche configuration. Covers both niche IDs
 * and display category names.
 */
export const CATEGORY_SLUGS: Record<string, { nicheId: CreatorNicheId; displayName: string }> = {
  "gaming": { nicheId: "gaming", displayName: "Gaming" },
  "entertainment": { nicheId: "entertainment", displayName: "Entertainment" },
  "comedy": { nicheId: "entertainment", displayName: "Comedy" },
  "technology": { nicheId: "tech", displayName: "Technology" },
  "tech": { nicheId: "tech", displayName: "Technology" },
  "finance": { nicheId: "finance", displayName: "Finance" },
  "education": { nicheId: "education", displayName: "Education" },
  "science": { nicheId: "science", displayName: "Science" },
  "music": { nicheId: "music", displayName: "Music" },
  "sports": { nicheId: "sports", displayName: "Sports" },
  "beauty": { nicheId: "beauty", displayName: "Beauty" },
  "food": { nicheId: "food", displayName: "Food" },
  "lifestyle": { nicheId: "lifestyle", displayName: "Lifestyle" },
  "travel": { nicheId: "travel", displayName: "Travel" },
  "health": { nicheId: "health", displayName: "Health & Fitness" },
  "fitness": { nicheId: "health", displayName: "Health & Fitness" },
  "news": { nicheId: "news", displayName: "News & Politics" },
  "business": { nicheId: "business", displayName: "Business" },
  "podcast": { nicheId: "news", displayName: "Podcast" },
  "kids": { nicheId: "kids", displayName: "Kids & Family" },
  "diy": { nicheId: "diy", displayName: "DIY & Home" },
  "automotive": { nicheId: "auto", displayName: "Automotive" },
};

/** Get all category slugs for static generation. */
export function getAllCategorySlugs(): string[] {
  // Only return slugs for categories that exist in the dataset
  const categoriesInDataset = new Set(
    CREATORS_DATASET.map((c) => c.category.toLowerCase()),
  );
  const nichesInDataset = new Set(
    CREATORS_DATASET.map((c) => c.niche),
  );

  return Object.entries(CATEGORY_SLUGS)
    .filter(([slug, { nicheId }]) => {
      return nichesInDataset.has(nicheId) || categoriesInDataset.has(slug);
    })
    .map(([slug]) => slug)
    // Deduplicate (tech/technology both map to tech niche)
    .filter((slug, i, arr) => {
      const nicheId = CATEGORY_SLUGS[slug].nicheId;
      return arr.findIndex((s) => CATEGORY_SLUGS[s].nicheId === nicheId) === i;
    });
}

/**
 * Build the full category page data for a given slug.
 */
export function getCategoryPageData(slug: string): CategoryPageData | null {
  const config = CATEGORY_SLUGS[slug];
  if (!config) return null;

  const { nicheId, displayName } = config;
  const niche = findNiche(nicheId);

  // Match creators by niche OR by category name
  const creators = CREATORS_DATASET.filter(
    (c) =>
      c.niche === nicheId ||
      c.category.toLowerCase() === slug ||
      c.category.toLowerCase() === displayName.toLowerCase(),
  );

  if (creators.length === 0) return null;

  // Top creators by tier then verified
  const tierOrder: Record<string, number> = { mega: 0, large: 1, mid: 2, emerging: 3 };
  const topCreators = [...creators]
    .sort((a, b) => {
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      return (tierOrder[a.subscriberTier] ?? 99) - (tierOrder[b.subscriberTier] ?? 99);
    })
    .slice(0, 20);

  // Country breakdown
  const countryMap = new Map<string, { country: string; countryCode: CreatorCountryCode; count: number }>();
  for (const c of creators) {
    const existing = countryMap.get(c.countryCode);
    if (existing) {
      existing.count++;
    } else {
      countryMap.set(c.countryCode, { country: c.country, countryCode: c.countryCode, count: 1 });
    }
  }
  const topCountries = Array.from(countryMap.values()).sort((a, b) => b.count - a.count);

  // Average RPM across all countries for this niche
  const avgRpm =
    COUNTRIES.reduce((sum, country) => sum + country.baseRpm * niche.rpmMultiplier, 0) /
    COUNTRIES.length;

  const avgShortsRpm =
    COUNTRIES.reduce((sum, country) => sum + country.shortsRpm * niche.shortsRpmMultiplier, 0) /
    COUNTRIES.length;

  return {
    slug,
    nicheId,
    label: niche.label,
    displayName,
    rpmMultiplier: niche.rpmMultiplier,
    shortsRpmMultiplier: niche.shortsRpmMultiplier,
    creators,
    topCreators,
    totalCreators: creators.length,
    topCountries,
    averageRpm: avgRpm,
    averageShortsRpm: avgShortsRpm,
    estimatedCpm: avgRpm * 1.8,
  };
}

/**
 * Generate FAQ entries for a category page.
 */
export function buildCategoryFaq(data: CategoryPageData): Array<{ question: string; answer: string }> {
  const entries: Array<{ question: string; answer: string }> = [];

  entries.push({
    question: `What is the average RPM for ${data.displayName} YouTube channels?`,
    answer: `The average RPM for ${data.displayName} channels is approximately $${data.averageRpm.toFixed(2)} per 1,000 views globally. This varies significantly by country — US-based ${data.displayName} channels tend to earn $${(6.5 * data.rpmMultiplier).toFixed(2)}/1,000 views, while channels in markets like India earn around $${(1.1 * data.rpmMultiplier).toFixed(2)}/1,000 views.`,
  });

  entries.push({
    question: `How much do ${data.displayName} YouTubers make?`,
    answer: `${data.displayName} YouTubers' earnings depend on their monthly views, audience country, and content type. With an RPM multiplier of ${data.rpmMultiplier}×, ${data.displayName} content ${data.rpmMultiplier > 1 ? "earns above" : data.rpmMultiplier < 1 ? "earns below" : "earns at"} the platform average. A channel getting 1M views/month in the US could earn approximately $${(6.5 * data.rpmMultiplier * 1000).toFixed(0)}/month from ads alone.`,
  });

  entries.push({
    question: `What is the CPM for ${data.displayName} on YouTube?`,
    answer: `The estimated CPM (what advertisers pay) for ${data.displayName} content averages around $${data.estimatedCpm.toFixed(2)} per 1,000 impressions globally. CPM is approximately 1.8× the creator RPM because it includes YouTube's ~45% revenue share. ${data.rpmMultiplier > 1.2 ? `${data.displayName} is a high-demand niche for advertisers.` : ""}`,
  });

  if (data.topCountries.length > 1) {
    const countryList = data.topCountries.slice(0, 5).map((c) => c.country).join(", ");
    entries.push({
      question: `Which countries have the most ${data.displayName} YouTubers?`,
      answer: `The countries with the most ${data.displayName} creators in our database are: ${countryList}. Each country has different RPM rates, so earnings potential varies significantly by audience geography.`,
    });
  }

  entries.push({
    question: `How much do ${data.displayName} Shorts earn?`,
    answer: `YouTube Shorts in the ${data.displayName} niche earn significantly less per view than long-form content. The average Shorts RPM for ${data.displayName} is approximately $${data.averageShortsRpm.toFixed(4)} per 1,000 views — roughly ${((data.averageShortsRpm / data.averageRpm) * 100).toFixed(1)}% of long-form RPM. Shorts monetize from a shared ad pool rather than per-video auctions.`,
  });

  return entries;
}
