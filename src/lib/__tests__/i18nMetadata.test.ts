/**
 * Contract tests for the shared hreflang / canonical builder.
 *
 * The alternates block returned here is consumed by every page's
 * `generateMetadata`; a regression on this helper affects SEO for every
 * URL in the app.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// The helper reads publicConfig.siteUrl. Freeze that to a known base
// URL so assertions stay stable regardless of local env.
vi.mock("../env.public", () => ({
  publicEnv: { siteUrl: "https://example.com" },
}));

// Fresh-import the helper after the env mock is in place.
async function loadHelper() {
  vi.resetModules();
  return (await import("../i18nMetadata")).buildAlternates;
}

describe("buildAlternates", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns a fully-qualified canonical URL for the active locale", async () => {
    const buildAlternates = await loadHelper();
    const meta = buildAlternates({ locale: "hi", pathSuffix: "/about" });
    expect(meta?.canonical).toBe("https://example.com/hi/about");
  });

  it("emits an alternate URL for every supported locale", async () => {
    const buildAlternates = await loadHelper();
    const meta = buildAlternates({ locale: "en", pathSuffix: "/about" });
    const langs = meta?.languages as Record<string, string>;
    // Locales listed in routing.ts — asserted explicitly so a drop is caught.
    for (const loc of ["en", "hi", "es", "pt", "de", "fr", "ja"]) {
      expect(langs[loc]).toBe(`https://example.com/${loc}/about`);
    }
  });

  it("includes an x-default alternate pointing to the English URL", async () => {
    const buildAlternates = await loadHelper();
    const meta = buildAlternates({ locale: "de", pathSuffix: "/privacy" });
    const langs = meta?.languages as Record<string, string>;
    expect(langs["x-default"]).toBe("https://example.com/en/privacy");
  });

  it("collapses the homepage suffix so URLs are clean", async () => {
    const buildAlternates = await loadHelper();
    const meta = buildAlternates({ locale: "en", pathSuffix: "/" });
    expect(meta?.canonical).toBe("https://example.com/en");
    const langs = meta?.languages as Record<string, string>;
    // No trailing slash on the homepage.
    expect(langs["en"]).toBe("https://example.com/en");
    expect(langs["x-default"]).toBe("https://example.com/en");
  });

  it("tolerates a suffix that omits the leading slash", async () => {
    const buildAlternates = await loadHelper();
    const meta = buildAlternates({ locale: "fr", pathSuffix: "terms" });
    expect(meta?.canonical).toBe("https://example.com/fr/terms");
  });
});
