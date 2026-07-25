/**
 * Creator comparison service for /compare/[slug1]-vs-[slug2] pages.
 *
 * Generates structured comparison data between any two creators in
 * the dataset. Uses existing earnings calculation logic so numbers
 * stay consistent with creator profile pages.
 */

import type { CreatorEntry } from "@/data/creators/schema";
import { CREATORS_DATASET } from "@/data/creators/dataset";
import { findCountry, findNiche } from "./rpmData";

// ─── Types ──────────────────────────────────────────────────────────

export interface ComparisonCreatorData {
  creator: CreatorEntry;
  rpmExpected: number;
  shortsRpmExpected: number;
  cpmExpected: number;
  nicheLabel: string;
  countryLabel: string;
}

export interface ComparisonData {
  creator1: ComparisonCreatorData;
  creator2: ComparisonCreatorData;
  slug: string;
}

// ─── Slug parsing ───────────────────────────────────────────────────

/**
 * Parse a comparison slug like "mrbeast-vs-pewdiepie" into two
 * creator slugs. Returns null if the format is invalid.
 */
export function parseComparisonSlug(slug: string): { slug1: string; slug2: string } | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2) return null;
  const slug1 = parts[0].trim();
  const slug2 = parts[1].trim();
  if (!slug1 || !slug2) return null;
  return { slug1, slug2 };
}

// ─── Comparison builder ─────────────────────────────────────────────

function buildCreatorComparison(creator: CreatorEntry): ComparisonCreatorData {
  const country = findCountry(creator.countryCode);
  const niche = findNiche(creator.niche);

  const rpmExpected = country.baseRpm * niche.rpmMultiplier;
  const shortsRpmExpected = country.shortsRpm * niche.shortsRpmMultiplier;
  const cpmExpected = rpmExpected * 1.8;

  return {
    creator,
    rpmExpected,
    shortsRpmExpected,
    cpmExpected,
    nicheLabel: niche.label,
    countryLabel: country.label,
  };
}

/**
 * Get comparison data for two creators.
 * Returns null if either creator is not found.
 */
export function getComparisonData(slug: string): ComparisonData | null {
  const parsed = parseComparisonSlug(slug);
  if (!parsed) return null;

  const entry1 = CREATORS_DATASET.find((c) => c.slug === parsed.slug1);
  const entry2 = CREATORS_DATASET.find((c) => c.slug === parsed.slug2);

  if (!entry1 || !entry2) return null;

  return {
    creator1: buildCreatorComparison(entry1),
    creator2: buildCreatorComparison(entry2),
    slug,
  };
}

/**
 * Generate all possible comparison slugs for static params.
 * Only generates pairings between creators that share something
 * in common (same country, category, or tier) to keep the count
 * reasonable.
 */
export function getAllComparisonSlugs(): string[] {
  const slugs: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < CREATORS_DATASET.length; i++) {
    const a = CREATORS_DATASET[i];
    for (let j = i + 1; j < CREATORS_DATASET.length; j++) {
      const b = CREATORS_DATASET[j];

      // Only generate comparisons between related creators
      const related =
        a.countryCode === b.countryCode ||
        a.category === b.category ||
        a.niche === b.niche ||
        a.subscriberTier === b.subscriberTier;

      if (!related) continue;

      // Alphabetical order for canonical slug
      const pair = [a.slug, b.slug].sort();
      const key = `${pair[0]}-vs-${pair[1]}`;
      if (!seen.has(key)) {
        seen.add(key);
        slugs.push(key);
      }
    }
  }

  return slugs;
}

/**
 * Get popular comparison pairs for display on the homepage or
 * related content sections.
 */
export function getPopularComparisons(): Array<{ slug: string; name1: string; name2: string }> {
  const popular = [
    { slug1: "mrbeast", slug2: "pewdiepie" },
    { slug1: "ishowspeed", slug2: "coryxkenshin" },
    { slug1: "mkbhd", slug2: "linustechtips" },
    { slug1: "markiplier", slug2: "jacksepticeye" },
    { slug1: "veritasium", slug2: "kurzgesagt" },
    { slug1: "grahamstephan", slug2: "aliabdaal" },
  ];

  return popular
    .map(({ slug1, slug2 }) => {
      const c1 = CREATORS_DATASET.find((c) => c.slug === slug1);
      const c2 = CREATORS_DATASET.find((c) => c.slug === slug2);
      if (!c1 || !c2) return null;
      return {
        slug: `${slug1}-vs-${slug2}`,
        name1: c1.name,
        name2: c2.name,
      };
    })
    .filter(Boolean) as Array<{ slug: string; name1: string; name2: string }>;
}

/**
 * Build FAQ entries for a comparison page.
 */
export function buildComparisonFaq(
  data: ComparisonData,
): Array<{ question: string; answer: string }> {
  const { creator1: c1, creator2: c2 } = data;
  const name1 = c1.creator.name;
  const name2 = c2.creator.name;

  return [
    {
      question: `Who earns more — ${name1} or ${name2}?`,
      answer: `Based on estimated RPM rates, ${c1.rpmExpected > c2.rpmExpected ? name1 : name2} has a higher per-view earning potential with an estimated RPM of $${Math.max(c1.rpmExpected, c2.rpmExpected).toFixed(2)} vs $${Math.min(c1.rpmExpected, c2.rpmExpected).toFixed(2)}. However, total earnings also depend on monthly views, upload frequency, and additional revenue streams like sponsorships. These are estimates only.`,
    },
    {
      question: `What niche is ${name1} in vs ${name2}?`,
      answer: `${name1} creates ${c1.nicheLabel} content while ${name2} focuses on ${c2.nicheLabel}. ${c1.creator.niche === c2.creator.niche ? "They compete in the same niche." : "Different niches command different RPM rates from advertisers."}`,
    },
    {
      question: `Which country is ${name1} from vs ${name2}?`,
      answer: `${name1} is based in ${c1.creator.country} while ${name2} is from ${c2.creator.country}. ${c1.creator.countryCode === c2.creator.countryCode ? "Being in the same market, they have similar base RPM rates." : "Different markets have different advertising rates, which affects earnings."}`,
    },
    {
      question: `What is ${name1}'s estimated RPM vs ${name2}'s?`,
      answer: `${name1}'s estimated RPM is $${c1.rpmExpected.toFixed(2)} per 1,000 views (${c1.nicheLabel} in ${c1.creator.country}), while ${name2}'s is $${c2.rpmExpected.toFixed(2)} per 1,000 views (${c2.nicheLabel} in ${c2.creator.country}). RPM depends on country, niche, and content type.`,
    },
  ];
}
