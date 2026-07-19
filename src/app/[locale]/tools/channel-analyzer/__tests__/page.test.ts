import { describe, expect, it } from "vitest";

import { generateMetadata } from "../page";

/**
 * Metadata tests for the Channel Analyzer page.
 *
 * Mirrors `src/app/[locale]/instagram-money-calculator/__tests__/page.test.ts`
 * — validates the canonical + hreflang alternates, OG / Twitter
 * blocks, and target keywords. Also verifies the `?q=` variant
 * emits `noindex, follow` so per-query URLs don't compete with the
 * canonical page.
 */

describe("Channel Analyzer page metadata", () => {
  it("produces canonical + hreflang alternates for the en locale", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });
    expect(meta.title).toBeTruthy();
    expect(meta.description).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canonical = (meta.alternates as any)?.canonical as string;
    expect(canonical).toMatch(/\/en\/tools\/channel-analyzer$/);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const langs = (meta.alternates as any)?.languages as Record<string, string>;
    for (const loc of ["en", "hi", "es", "pt", "de", "fr", "ja"]) {
      expect(langs[loc]).toMatch(
        new RegExp(`/${loc}/tools/channel-analyzer$`),
      );
    }
    expect(langs["x-default"]).toMatch(/\/en\/tools\/channel-analyzer$/);
  });

  it("emits OpenGraph and Twitter blocks", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "hi" }),
      searchParams: Promise.resolve({}),
    });
    expect(meta.openGraph).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((meta.openGraph as any).url).toBe("/hi/tools/channel-analyzer");
    expect(meta.twitter).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((meta.twitter as any).card).toBe("summary_large_image");
  });

  it("includes the target SEO keywords", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });
    const keywords = meta.keywords as string[];
    expect(keywords).toContain("YouTube Channel Analyzer");
    expect(keywords).toContain("YouTube channel earnings");
    expect(keywords).toContain("Estimate YouTube earnings");
  });

  it("marks per-query variants as noindex, follow", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ q: "@MrBeast" }),
    });
    expect(meta.robots).toEqual({ index: false, follow: true });
  });

  it("does NOT mark the canonical page as noindex", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });
    expect(meta.robots).toBeUndefined();
  });
});
