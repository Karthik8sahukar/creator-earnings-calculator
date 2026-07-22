/**
 * Category metadata for dynamic /creators/[category] pages.
 *
 * Adding a new category is a one-line entry. The route, sitemap,
 * and internal linking pick it up automatically.
 */

import type { CategoryMeta } from "./schema";

export const CATEGORIES: readonly CategoryMeta[] = [
  {
    slug: "gaming",
    label: "Gaming",
    nicheId: "gaming",
    title: "Top Gaming YouTubers — Earnings & Analytics {year}",
    description: "Explore the highest-earning gaming YouTubers. Estimated revenue, RPM analysis, and channel statistics for top gaming creators worldwide.",
    intro: "Gaming is one of the largest categories on YouTube, with creators earning through AdSense, sponsorships, and live streaming. From Let's Plays to esports commentary, gaming creators build massive audiences across every region.",
    priority: 1,
  },
  {
    slug: "technology",
    label: "Technology",
    nicheId: "tech",
    title: "Top Tech YouTubers — Earnings & Analytics {year}",
    description: "Discover how much top tech YouTubers earn. Revenue estimates, RPM data, and performance analytics for leading technology channels.",
    intro: "Technology creators review gadgets, explain software, and cover the latest in AI, smartphones, and computing. Tech channels attract premium advertisers, resulting in some of the highest RPMs on the platform.",
    priority: 2,
  },
  {
    slug: "education",
    label: "Education",
    nicheId: "education",
    title: "Top Education YouTubers — Earnings & Analytics {year}",
    description: "See how much educational YouTubers earn. Revenue analysis, RPM benchmarks, and channel performance for top education creators.",
    intro: "Educational content on YouTube spans tutorials, online courses, science explainers, and academic lectures. These creators benefit from high audience retention and strong advertiser interest in engaged learners.",
    priority: 3,
  },
  {
    slug: "finance",
    label: "Finance",
    nicheId: "finance",
    title: "Top Finance YouTubers — Earnings & Analytics {year}",
    description: "Analyze earnings of top finance and investing YouTubers. Highest RPM niche with premium advertiser demand.",
    intro: "Personal finance and investing channels consistently earn the highest RPMs on YouTube due to premium advertiser demand from banks, brokerages, and fintech companies. Finance creators educate audiences on wealth building, budgeting, and market analysis.",
    priority: 4,
  },
  {
    slug: "entertainment",
    label: "Entertainment",
    nicheId: "entertainment",
    title: "Top Entertainment YouTubers — Earnings & Analytics {year}",
    description: "Explore earnings of the biggest entertainment YouTubers. Challenge videos, sketches, and viral content creators worldwide.",
    intro: "Entertainment is YouTube's broadest category — encompassing challenges, pranks, sketches, reaction videos, and variety content. Top entertainment creators like MrBeast have redefined what's possible on the platform.",
    priority: 5,
  },
  {
    slug: "comedy",
    label: "Comedy",
    nicheId: "entertainment",
    title: "Top Comedy YouTubers — Earnings & Analytics {year}",
    description: "Discover how much comedy YouTubers earn. Revenue estimates and analytics for top sketch, standup, and comedy creators.",
    intro: "Comedy creators produce sketches, roasts, standup clips, and comedic commentary that drives massive engagement. From Bollywood-inspired shorts to English-language sketch comedy, this category thrives globally.",
    priority: 6,
  },
  {
    slug: "science",
    label: "Science",
    nicheId: "science",
    title: "Top Science YouTubers — Earnings & Analytics {year}",
    description: "How much do science YouTubers earn? Revenue analysis and RPM data for popular science and STEM channels.",
    intro: "Science creators make complex topics accessible through experiments, animations, and deep-dive explainers. Channels covering physics, biology, chemistry, and space attract curious audiences and quality advertisers.",
    priority: 7,
  },
  {
    slug: "sports",
    label: "Sports",
    nicheId: "sports",
    title: "Top Sports YouTubers — Earnings & Analytics {year}",
    description: "Explore earnings of sports YouTubers. Revenue estimates for football, cricket, basketball, and fitness creators.",
    intro: "Sports creators cover everything from match highlights and analysis to training vlogs and athlete interviews. With passionate fanbases and recurring events, sports channels maintain strong viewer loyalty.",
    priority: 8,
  },
  {
    slug: "music",
    label: "Music",
    nicheId: "music",
    title: "Top Music YouTubers — Earnings & Analytics {year}",
    description: "How much do music channels earn on YouTube? Revenue analysis for artists, producers, and music educators.",
    intro: "Music is one of YouTube's most-watched categories, though creator RPMs are lower due to licensing arrangements. Music creators earn through a combination of ad revenue, streaming royalties, and sponsorships.",
    priority: 9,
  },
  {
    slug: "business",
    label: "Business",
    nicheId: "business",
    title: "Top Business YouTubers — Earnings & Analytics {year}",
    description: "Discover earnings of business and entrepreneurship YouTubers. High-RPM niche with B2B and SaaS advertiser demand.",
    intro: "Business and entrepreneurship channels attract professionals and aspiring founders. With B2B advertisers competing for this audience, business creators enjoy above-average RPMs and strong sponsorship rates.",
    priority: 10,
  },
] as const;

/** Lookup a category by slug. */
export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/** All category slugs for route generation. */
export function listCategorySlugs(): string[] {
  return CATEGORIES.map((c) => c.slug);
}
