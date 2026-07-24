/**
 * Country data service for /country/[slug] pages.
 *
 * Merges the rpmData country tiers with the creator dataset to
 * produce rich country pages with statistics, top creators, and
 * estimated RPM/CPM data.
 */

import { CREATORS_DATASET } from "@/data/creators/dataset";
import type { CreatorEntry, CreatorCountryCode } from "@/data/creators/schema";
import { NICHES, findCountry } from "./rpmData";

// ─── Country page metadata ──────────────────────────────────────────

export interface CountryPageData {
  slug: string;
  countryCode: CreatorCountryCode;
  label: string;
  baseRpm: number;
  shortsRpm: number;
  /** Estimated advertiser CPM (RPM × ~1.8) */
  estimatedCpm: number;
  creators: CreatorEntry[];
  topCreators: CreatorEntry[];
  totalCreators: number;
  topCategories: Array<{ category: string; count: number }>;
  topNiches: Array<{ niche: string; label: string; count: number }>;
  /** Average RPM across all niches for this country. */
  averageRpm: number;
  /** Average Shorts RPM across all niches. */
  averageShortsRpm: number;
}

/**
 * Map from URL slug → country code. Slugs are lowercase,
 * hyphenated versions of the country label.
 */
export const COUNTRY_SLUGS: Record<string, CreatorCountryCode> = {
  "united-states": "US",
  "usa": "US",
  "united-kingdom": "GB",
  "uk": "GB",
  "canada": "CA",
  "australia": "AU",
  "germany": "DE",
  "france": "FR",
  "netherlands": "NL",
  "sweden": "SE",
  "japan": "JP",
  "south-korea": "KR",
  "india": "IN",
  "brazil": "BR",
  "mexico": "MX",
  "spain": "ES",
  "italy": "IT",
  "indonesia": "ID",
  "philippines": "PH",
  "south-africa": "ZA",
  "uae": "AE",
  "united-arab-emirates": "AE",
};

/** Reverse mapping: country code → slug */
export const COUNTRY_CODE_TO_SLUG: Record<CreatorCountryCode, string> = {
  US: "united-states",
  GB: "united-kingdom",
  CA: "canada",
  AU: "australia",
  DE: "germany",
  FR: "france",
  NL: "netherlands",
  SE: "sweden",
  JP: "japan",
  KR: "south-korea",
  IN: "india",
  BR: "brazil",
  MX: "mexico",
  ES: "spain",
  IT: "italy",
  ID: "indonesia",
  PH: "philippines",
  ZA: "south-africa",
  AE: "united-arab-emirates",
  OTHER: "other",
};

/**
 * Get all country slugs for static generation.
 */
export function getAllCountrySlugs(): string[] {
  // Only return slugs that have creators in the dataset
  const countriesWithCreators = new Set(
    CREATORS_DATASET.map((c) => c.countryCode),
  );
  return Object.entries(COUNTRY_SLUGS)
    .filter(([, code]) => countriesWithCreators.has(code))
    .map(([slug]) => slug)
    // Deduplicate (usa/united-states both map to US)
    .filter((slug, i, arr) => {
      const code = COUNTRY_SLUGS[slug];
      return arr.findIndex((s) => COUNTRY_SLUGS[s] === code) === i;
    });
}

/**
 * Build the full country page data for a given slug.
 */
export function getCountryPageData(slug: string): CountryPageData | null {
  const countryCode = COUNTRY_SLUGS[slug];
  if (!countryCode) return null;

  const countryTier = findCountry(countryCode);
  const creators = CREATORS_DATASET.filter((c) => c.countryCode === countryCode);

  if (creators.length === 0) return null;

  // Top creators: prioritize verified, then by tier
  const tierOrder: Record<string, number> = { mega: 0, large: 1, mid: 2, emerging: 3 };
  const topCreators = [...creators]
    .sort((a, b) => {
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      return (tierOrder[a.subscriberTier] ?? 99) - (tierOrder[b.subscriberTier] ?? 99);
    })
    .slice(0, 20);

  // Category breakdown
  const categoryMap = new Map<string, number>();
  for (const c of creators) {
    categoryMap.set(c.category, (categoryMap.get(c.category) ?? 0) + 1);
  }
  const topCategories = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Niche breakdown
  const nicheMap = new Map<string, number>();
  for (const c of creators) {
    nicheMap.set(c.niche, (nicheMap.get(c.niche) ?? 0) + 1);
  }
  const topNiches = Array.from(nicheMap.entries())
    .map(([niche, count]) => {
      const nicheData = NICHES.find((n) => n.id === niche);
      return { niche, label: nicheData?.label ?? niche, count };
    })
    .sort((a, b) => b.count - a.count);

  // Average RPM across niches represented in this country
  const representedNiches = Array.from(nicheMap.keys());
  const nicheMultipliers = representedNiches
    .map((id) => NICHES.find((n) => n.id === id))
    .filter(Boolean);

  const averageRpm =
    nicheMultipliers.length > 0
      ? nicheMultipliers.reduce(
          (sum, n) => sum + countryTier.baseRpm * n!.rpmMultiplier,
          0,
        ) / nicheMultipliers.length
      : countryTier.baseRpm;

  const averageShortsRpm =
    nicheMultipliers.length > 0
      ? nicheMultipliers.reduce(
          (sum, n) => sum + countryTier.shortsRpm * n!.shortsRpmMultiplier,
          0,
        ) / nicheMultipliers.length
      : countryTier.shortsRpm;

  return {
    slug,
    countryCode,
    label: countryTier.label,
    baseRpm: countryTier.baseRpm,
    shortsRpm: countryTier.shortsRpm,
    estimatedCpm: countryTier.baseRpm * 1.8,
    creators,
    topCreators,
    totalCreators: creators.length,
    topCategories,
    topNiches,
    averageRpm,
    averageShortsRpm,
  };
}

/**
 * Generate FAQ entries for a country page.
 */
export function buildCountryFaq(data: CountryPageData): Array<{ question: string; answer: string }> {
  const entries: Array<{ question: string; answer: string }> = [];

  entries.push({
    question: `What is the average YouTube RPM in ${data.label}?`,
    answer: `The average YouTube RPM (Revenue Per Mille) in ${data.label} is approximately $${data.averageRpm.toFixed(2)} per 1,000 views for long-form content. For YouTube Shorts, the average RPM is about $${data.averageShortsRpm.toFixed(4)} per 1,000 views. These are estimates based on publicly available data and vary significantly by niche.`,
  });

  entries.push({
    question: `What is the average YouTube CPM in ${data.label}?`,
    answer: `The estimated average CPM (what advertisers pay) in ${data.label} is approximately $${data.estimatedCpm.toFixed(2)} per 1,000 monetized impressions. CPM is roughly 1.8× the creator RPM because it includes YouTube's revenue share (~45% cut). Actual CPM varies by niche, season, and audience demographics.`,
  });

  entries.push({
    question: `How many YouTubers are from ${data.label}?`,
    answer: `Our database tracks ${data.totalCreators} notable YouTube creators from ${data.label}. ${data.topCategories.length > 0 ? `The most popular category is ${data.topCategories[0].category} with ${data.topCategories[0].count} creator${data.topCategories[0].count > 1 ? "s" : ""}.` : ""} YouTube has millions of active channels globally, and ${data.label} is one of the most active creator markets.`,
  });

  if (data.topCategories.length > 1) {
    const catList = data.topCategories.slice(0, 5).map((c) => c.category).join(", ");
    entries.push({
      question: `What are the most popular YouTube niches in ${data.label}?`,
      answer: `The most popular YouTube categories among creators in ${data.label} include: ${catList}. Each niche has different RPM rates — finance and tech tend to earn the highest per-view revenue, while entertainment and gaming have larger audiences but lower per-view earnings.`,
    });
  }

  entries.push({
    question: `How much do YouTubers in ${data.label} earn?`,
    answer: `YouTube earnings in ${data.label} depend on the creator's niche, audience geography, content type, and upload frequency. With a base RPM of $${data.baseRpm.toFixed(2)}, a channel getting 1 million views per month in ${data.label} could earn approximately $${(data.baseRpm * 1000).toFixed(0)} per month from ads alone. Top creators earn significantly more through sponsorships, merchandise, and other revenue streams.`,
  });

  return entries;
}
