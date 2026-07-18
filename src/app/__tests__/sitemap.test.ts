/**
 * Sitemap must enumerate every (locale × page) pair with a full
 * `alternates.languages` block. If a page is missed or the alternates
 * drop, SEO for the localized URLs breaks silently.
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
  const routes = [
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
  ];

  const locales = ["en", "hi", "es", "pt", "de", "fr", "ja"];

  it("emits exactly one entry per (locale × page) pair", async () => {
    const sitemap = await loadSitemap();
    const entries = sitemap();
    expect(entries).toHaveLength(routes.length * locales.length);
  });

  it("every entry is prefixed by its locale", async () => {
    const sitemap = await loadSitemap();
    const entries = sitemap();
    for (const entry of entries) {
      expect(entry.url).toMatch(
        /^https:\/\/example\.com\/(en|hi|es|pt|de|fr|ja)/,
      );
    }
  });

  it("every entry carries hreflang alternates for all locales + x-default", async () => {
    const sitemap = await loadSitemap();
    const entries = sitemap();
    for (const entry of entries) {
      const langs = entry.alternates?.languages as Record<string, string>;
      expect(langs).toBeDefined();
      for (const loc of locales) {
        expect(langs[loc]).toMatch(new RegExp(`^https://example\\.com/${loc}`));
      }
      expect(langs["x-default"]).toMatch(/^https:\/\/example\.com\/en/);
    }
  });

  it("homepage entries get priority 1 and weekly change frequency", async () => {
    const sitemap = await loadSitemap();
    const entries = sitemap();
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
    const entries = sitemap();
    for (const entry of entries) {
      expect(entry.url).not.toContain("/api/");
      expect(entry.url).not.toContain("/channel/");
    }
  });
});
