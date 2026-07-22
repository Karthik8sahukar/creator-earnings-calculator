/**
 * Phase 6: Leaderboard definitions.
 *
 * Each leaderboard is a filter + sort over the creator dataset.
 * Adding a new leaderboard is a one-entry change — the route
 * and sitemap pick it up automatically.
 */

import type { CreatorEntry } from "./schema";

export interface LeaderboardConfig {
  slug: string;
  title: string;
  description: string;
  intro: string;
  filter: (creator: CreatorEntry) => boolean;
  limit: number;
}

export const LEADERBOARDS: readonly LeaderboardConfig[] = [
  {
    slug: "top-gaming-creators",
    title: "Top Gaming YouTubers — Earnings & Analytics {year}",
    description: "The highest-earning gaming creators on YouTube. Estimated revenue, subscribers, and performance analytics.",
    intro: "These are the biggest gaming channels on YouTube, ranked by estimated reach and earnings potential. From Minecraft to Fortnite, esports to Let's Plays — gaming remains one of YouTube's largest and most competitive categories.",
    filter: (c) => c.niche === "gaming",
    limit: 50,
  },
  {
    slug: "top-indian-creators",
    title: "Top Indian YouTubers — Earnings & Analytics {year}",
    description: "The highest-earning Indian YouTube creators. Estimated revenue, RPM analysis, and channel performance.",
    intro: "India is YouTube's largest market by user count. These creators reach hundreds of millions of viewers across Hindi, English, and regional languages — monetizing through AdSense, sponsorships, and brand partnerships.",
    filter: (c) => c.countryCode === "IN",
    limit: 50,
  },
  {
    slug: "top-tech-creators",
    title: "Top Tech YouTubers — Earnings & Analytics {year}",
    description: "The highest-earning technology creators on YouTube. Revenue estimates and RPM benchmarks for tech channels.",
    intro: "Technology channels command some of the highest RPMs on YouTube thanks to premium advertisers from SaaS, hardware, and consumer electronics brands. These are the leading tech creators by reach and estimated earnings.",
    filter: (c) => c.niche === "tech",
    limit: 50,
  },
  {
    slug: "top-education-channels",
    title: "Top Education YouTubers — Earnings & Analytics {year}",
    description: "The best educational YouTube channels ranked by reach and estimated earnings.",
    intro: "Educational creators serve millions of learners worldwide, from exam prep to animated science explainers. These channels combine high retention, strong RPMs, and meaningful audience impact.",
    filter: (c) => c.niche === "education",
    limit: 50,
  },
  {
    slug: "top-entertainment-creators",
    title: "Top Entertainment YouTubers — Earnings & Analytics {year}",
    description: "The biggest entertainment creators on YouTube by estimated earnings and subscriber count.",
    intro: "Entertainment is YouTube's broadest category — from MrBeast's challenges to comedy sketches, reaction content to variety shows. These creators drive the most views and set platform trends.",
    filter: (c) => c.niche === "entertainment",
    limit: 50,
  },
  {
    slug: "top-creators-by-earnings",
    title: "Highest-Earning YouTubers — Estimated Revenue {year}",
    description: "Which YouTubers earn the most? Estimated monthly revenue for the platform's top creators.",
    intro: "These creators are estimated to earn the most from YouTube AdSense based on their subscriber tier, country RPM, niche multiplier, and content type. Actual earnings vary based on upload frequency, audience geography, and sponsorship deals.",
    filter: (c) => c.subscriberTier === "mega" || c.subscriberTier === "large",
    limit: 50,
  },
] as const;

export function getLeaderboardBySlug(slug: string): LeaderboardConfig | undefined {
  return LEADERBOARDS.find((l) => l.slug === slug);
}

export function listLeaderboardSlugs(): string[] {
  return LEADERBOARDS.map((l) => l.slug);
}
