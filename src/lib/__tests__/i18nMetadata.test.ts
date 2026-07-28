/**
 * Contract tests for the shared canonical URL builder.
 *
 * After the English-only migration, buildAlternates returns only a
 * canonical URL without hreflang alternates.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// The helper reads publicConfig.siteUrl. Freeze that to a known base
// URL so assertions stay stable regardless of local env.
vi.mock("../config", () => ({
  publicConfig: { siteUrl: "https://example.com", siteName: "Test" },
  BRAND_NAME: "Test",
}));

// Fresh-import the helper after the mock is in place.
async function loadHelper() {
  vi.resetModules();
  return (await import("../i18nMetadata")).buildAlternates;
}

describe("buildAlternates", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns a canonical URL without locale prefix", async () => {
    const buildAlternates = await loadHelper();
    const meta = buildAlternates({ pathSuffix: "/about" });
    expect(meta?.canonical).toBe("https://example.com/about");
  });

  it("does not include hreflang languages map", async () => {
    const buildAlternates = await loadHelper();
    const meta = buildAlternates({ pathSuffix: "/about" });
    expect(meta).not.toHaveProperty("languages");
  });

  it("collapses the homepage suffix so URLs are clean", async () => {
    const buildAlternates = await loadHelper();
    const meta = buildAlternates({ pathSuffix: "/" });
    expect(meta?.canonical).toBe("https://example.com");
  });

  it("tolerates a suffix that omits the leading slash", async () => {
    const buildAlternates = await loadHelper();
    const meta = buildAlternates({ pathSuffix: "terms" });
    expect(meta?.canonical).toBe("https://example.com/terms");
  });

  it("ignores the deprecated locale parameter", async () => {
    const buildAlternates = await loadHelper();
    const meta = buildAlternates({ locale: "fr", pathSuffix: "/about" });
    // locale is ignored — canonical has no prefix
    expect(meta?.canonical).toBe("https://example.com/about");
  });
});
