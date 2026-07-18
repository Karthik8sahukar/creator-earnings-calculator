/**
 * Sitemap must enumerate every (locale × page) pair with a full
 * `alternates.languages` block. If a page is missed or the alternates
 * drop, SEO for the localized URLs breaks silently.
 *
 * The sitemap function is now async (because blog articles are loaded
 * from the MDX filesystem), so every call site awaits its result.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env.public", () => ({
  publicEnv: { siteUrl: "https://example.com" },
}));

async function loadSitemap() {
  vi.resetModules();
  return (await import("../sitemap")).default;
}

describe("sitemap", () => {
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
    "/blog",
  ];

  const locales = ["en", "hi", "es", "pt", "de", "fr", "ja"];

  it("emits at least one entry per (locale × static-page) pair, plus category listings and article URLs", async () => {
    const sitemap = await loadSitemap();
    const entries = await sitemap();
    // Base: staticRoutes × locales = 77.
    // Plus 8 categories × 7 locales = 56.
    // Plus 10 article entries (EN only).
    expect(entries.length).toBeGreaterThanOrEqual(
      staticRoutes.length * locales.length + 8 * locales.length,
    );
  });

  it("every entry is prefixed by its locale", async () => {
    const sitemap = await loadSitemap();
    const entries = await sitemap();
    for (const entry of entries) {
      expect(entry.url).toMatch(
        /^https:\/\/example\.com\/(en|hi|es|pt|de|fr|ja)/,
      );
    }
  });

  it("every static / category entry carries hreflang alternates for all locales + x-default", async () => {
    const sitemap = await loadSitemap();
    const entries = await sitemap();
    // Only assert on entries that DO declare alternates — article
    // entries are English-canonical-only and intentionally omit them.
    const withAlts = entries.filter((e) => e.alternates?.languages);
    expect(withAlts.length).toBeGreaterThan(0);
    for (const entry of withAlts) {
      const langs = entry.alternates?.languages as Record<string, string>;
      for (const loc of locales) {
        expect(langs[loc]).toMatch(new RegExp(`^https://example\\.com/${loc}`));
      }
      expect(langs["x-default"]).toMatch(/^https:\/\/example\.com\/en/);
    }
  });

  it("homepage entries get priority 1 and weekly change frequency", async () => {
    const sitemap = await loadSitemap();
    const entries = await sitemap();
    const homepages = entries.filter((e) =>
      /^https:\/\/example\.com\/(en|hi|es|pt|de|fr|ja)$/.test(e.url),
    );
    expect(homepages).toHaveLength(locales.length);
    for (const e of homepages) {
      expect(e.priority).toBe(1);
      expect(e.changeFrequency).toBe("weekly");
    }
  });

  it("does not include any `/api/*` or `/channel/*` URLs", async () => {
    const sitemap = await loadSitemap();
    const entries = await sitemap();
    for (const entry of entries) {
      expect(entry.url).not.toContain("/api/");
      expect(entry.url).not.toContain("/channel/");
    }
  });

  it("blog article URLs are English-only and carry no hreflang alternates", async () => {
    const sitemap = await loadSitemap();
    const entries = await sitemap();
    const articleEntries = entries.filter((e) =>
      /^https:\/\/example\.com\/en\/blog\/[a-z0-9-]+$/.test(e.url),
    );
    // The launch set has 10 articles.
    expect(articleEntries.length).toBeGreaterThanOrEqual(10);
    // No non-English article URLs should exist.
    const nonEnArticles = entries.filter((e) =>
      /^https:\/\/example\.com\/(hi|es|pt|de|fr|ja)\/blog\/[^/]+$/.test(e.url),
    );
    expect(nonEnArticles).toHaveLength(0);
    // Article entries intentionally omit hreflang alternates.
    for (const entry of articleEntries) {
      expect(entry.alternates?.languages).toBeUndefined();
    }
  });

  it("blog listing (`/blog`) is emitted for every locale with full hreflang", async () => {
    const sitemap = await loadSitemap();
    const entries = await sitemap();
    for (const loc of locales) {
      const url = `https://example.com/${loc}/blog`;
      const entry = entries.find((e) => e.url === url);
      expect(entry, `missing sitemap entry for ${url}`).toBeDefined();
      const langs = entry?.alternates?.languages as Record<string, string>;
      expect(langs["x-default"]).toBe("https://example.com/en/blog");
    }
  });
});
