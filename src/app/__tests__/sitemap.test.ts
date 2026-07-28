/**
 * Sitemap must enumerate every page with the correct base URL.
 * After the English-only migration, no locale prefix should appear.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config", () => ({
  publicConfig: {
    siteUrl: "https://example.com",
    siteName: "Test",
  },
  BRAND_NAME: "Test",
}));

describe("sitemap", () => {
  it("emits entries without locale prefix", async () => {
    const { default: sitemap } = await import("../sitemap");
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      expect(entry.url).toMatch(/^https:\/\/example\.com/);
      // No locale prefix should appear
      expect(entry.url).not.toMatch(/\/(en|es|hi|pt|de|fr|ja)\//);
    }
  });

  it("includes homepage", async () => {
    const { default: sitemap } = await import("../sitemap");
    const entries = await sitemap();
    const homepage = entries.find((e) => e.url === "https://example.com" || e.url === "https://example.com/");
    expect(homepage).toBeDefined();
  });

  it("includes tool pages", async () => {
    const { default: sitemap } = await import("../sitemap");
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.includes("/coin-flip"))).toBe(true);
    expect(urls.some((u) => u.includes("/json-formatter"))).toBe(true);
  });

  it("includes blog pages", async () => {
    const { default: sitemap } = await import("../sitemap");
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.includes("/blog"))).toBe(true);
  });

  it("does not include /channel/ or /api/ routes", async () => {
    const { default: sitemap } = await import("../sitemap");
    const entries = await sitemap();
    for (const entry of entries) {
      expect(entry.url).not.toMatch(/\/channel\//);
      expect(entry.url).not.toMatch(/\/api\//);
    }
  });
});
