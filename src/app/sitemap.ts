import type { MetadataRoute } from "next";

import { listCategorySlugs, listCountrySlugs, COUNTRY_PAGES } from "@/data/creators";
import { listLeaderboardSlugs } from "@/data/creators/leaderboards";
import { BLOG_CATEGORIES, loadPosts } from "@/lib/blog";
import { getAllCategorySlugs } from "@/lib/categoryData";
import { publicConfig } from "@/lib/config";
import { getAllCountrySlugs, COUNTRY_SLUGS } from "@/lib/countryData";
import { listCreators } from "@/lib/creators";
import { getAllRankingFilterSlugs } from "@/lib/rankings";

/**
 * Sitemap.
 *
 * Structure by URL type:
 *
 * 1. Marketing / product pages (home, calculators, methodology, ...):
 *    one entry per (locale × path) pair, with full `alternates.languages`
 *    covering every supported locale and `x-default` → English.
 *
 * 2. Blog listing (/blog) and category pages (/blog/category/[slug]):
 *    one entry per (locale × path) pair — the listing UI is translated
 *    for every locale, so all seven variants are indexable.
 *
 * 3. Blog article pages (/blog/[slug]):
 *    ONLY the English canonical URL is included. Non-English article
 *    pages render a `<TranslationPending />` notice and are marked
 *    `robots: noindex, follow` in metadata — including them in the
 *    sitemap would contradict that signal. Search engines still
 *    discover the article's `alternates.languages` block on the page
 *    itself if they arrive via another route.
 *
 * `/channel/[channelId]` and `/api/*` are never emitted.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicConfig.siteUrl;
  const now = new Date();

  const staticRoutes = [
    "",
    "/methodology",
    "/disclaimer",
    "/privacy",
    "/terms",
    "/about",
    "/youtube-rpm-calculator",
    "/youtube-cpm-calculator",
    "/youtube-shorts-calculator",
    "/youtube-sponsorship-calculator",
    "/youtube-engagement-calculator",
    "/youtube-adsense-calculator",
    "/youtube-channel-valuation-calculator",
    "/youtube-affiliate-calculator",
    "/youtube-membership-calculator",
    "/youtube-merch-calculator",
    "/instagram-money-calculator",
    "/twitch-bits-calculator",
    "/yes-no-picker-wheel",
    "/random-team-generator",
    "/spin-the-wheel",
    "/coin-flip",
    "/dice-roller",
    "/random-number-generator",
    "/random-name-picker",
    "/character-counter",
    "/word-counter",
    "/random-color-generator",
    "/truth-or-dare-generator",
    "/developer-tools",
    "/jwt-decoder",
    "/json-formatter",
    "/base64-encoder-decoder",
    "/uuid-generator",
    "/cron-expression-generator",
    "/unix-timestamp-converter",
    "/url-encoder-decoder",
    "/regex-tester",
    "/sql-to-json-converter",
    "/csv-to-json-converter",
    "/blog",
    "/creators",
    "/top-creators",
  ];

  const blogCategoryRoutes = BLOG_CATEGORIES.map((c) => `/blog/category/${c.slug}`);

  const perLocaleWithAlternates = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) => {
    const url = `${base}${path}`;
    return [{
      url,
      lastModified: now,
      changeFrequency,
      priority,
    }];
  };

  const entries: MetadataRoute.Sitemap = [];

  // 1 + 2: marketing pages, blog listing, category listings.
  for (const path of staticRoutes) {
    const isHome = path === "";
    entries.push(
      ...perLocaleWithAlternates(
        path,
        isHome ? 1 : path === "/blog" ? 0.8 : 0.6,
        isHome || path === "/blog" ? "weekly" : "monthly",
      ),
    );
  }
  for (const path of blogCategoryRoutes) {
    entries.push(...perLocaleWithAlternates(path, 0.5, "weekly"));
  }

  // Creator profile pages — one per (locale × slug) with full
  // alternates so search engines route the right locale to the right
  // reader. Priority is slightly below the /creators index page.
  for (const creator of listCreators()) {
    entries.push(
      ...perLocaleWithAlternates(`/creator/${creator.slug}`, 0.6, "weekly"),
    );
  }

  // Category pages: /creators/[category]
  for (const slug of listCategorySlugs()) {
    entries.push(
      ...perLocaleWithAlternates(`/creators/${slug}`, 0.6, "weekly"),
    );
  }

  // Country pages: /creators/country/[country]
  for (const slug of listCountrySlugs()) {
    entries.push(
      ...perLocaleWithAlternates(`/creators/country/${slug}`, 0.6, "weekly"),
    );
  }

  // Leaderboard pages: /leaderboard/[slug]
  for (const slug of listLeaderboardSlugs()) {
    entries.push(
      ...perLocaleWithAlternates(`/leaderboard/${slug}`, 0.6, "weekly"),
    );
  }

  // Ranking filter pages: /top-creators/[filter] (country + category slugs)
  for (const filter of getAllRankingFilterSlugs()) {
    entries.push(
      ...perLocaleWithAlternates(`/top-creators/${filter}`, 0.5, "weekly"),
    );
  }

  // NOTE: /country/[slug] and /category/[slug] are intentionally excluded
  // when they overlap with /creators/country/[country] or /creators/[category].
  // Only non-overlapping routes (unique content with no curated equivalent)
  // are included. Overlap is detected via countryCode for countries and
  // slug match for categories.

  // Country codes already covered by /creators/country/[country]
  const curatedCountryCodes = new Set(COUNTRY_PAGES.map((c) => c.countryCode));
  // Category slugs already covered by /creators/[category]
  const curatedCategorySlugs = new Set(listCategorySlugs());

  for (const slug of getAllCountrySlugs()) {
    const countryCode = COUNTRY_SLUGS[slug];
    if (countryCode && curatedCountryCodes.has(countryCode)) continue; // duplicate
    entries.push(
      ...perLocaleWithAlternates(`/country/${slug}`, 0.5, "monthly"),
    );
  }

  for (const slug of getAllCategorySlugs()) {
    if (curatedCategorySlugs.has(slug)) continue; // duplicate
    entries.push(
      ...perLocaleWithAlternates(`/category/${slug}`, 0.5, "monthly"),
    );
  }

  // 3: blog article pages — English canonical only.
  try {
    const posts = await loadPosts();
    for (const post of posts) {
      const url = `${base}/blog/${post.slug}`;
      entries.push({
        url,
        lastModified: post.updatedDate
          ? new Date(post.updatedDate)
          : new Date(post.publishedDate),
        changeFrequency: "monthly",
        priority: 0.7,
        // Deliberately no `alternates.languages` — non-English article
        // pages are noindex, so declaring them here would contradict
        // the page-level robots signal.
      });
    }
  } catch {
    // If the content directory is missing (fresh clone before any
    // posts, or a broken filesystem read), we return marketing +
    // category entries and swallow the error. Missing posts should
    // never crash sitemap generation.
  }

  return entries;
}
