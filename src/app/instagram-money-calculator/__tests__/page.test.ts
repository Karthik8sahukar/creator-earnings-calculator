import { describe, expect, it } from "vitest";

import { generateMetadata } from "../page";

/**
 * generateMetadata is invoked by Next.js at build time. We validate:
 *   - The canonical URL is present and locale-prefixed
 *   - hreflang alternates cover every supported locale + x-default
 *   - OpenGraph and Twitter metadata are populated
 *   - Keywords include the primary target queries
 */

describe("Instagram calculator page metadata", () => {
  it("produces canonical + hreflang alternates for the en locale", async () => {
    const params = Promise.resolve({ locale: "en" });
    const meta = await generateMetadata({ params });
    expect(meta.title).toBeTruthy();
    expect(meta.description).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canonical = (meta.alternates as any)?.canonical as string;
    expect(canonical).toMatch(/\/en\/instagram-money-calculator$/);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const langs = (meta.alternates as any)?.languages as Record<string, string>;
    for (const loc of ["en", "hi", "es", "pt", "de", "fr", "ja"]) {
      expect(langs[loc]).toMatch(new RegExp(`/${loc}/instagram-money-calculator$`));
    }
    expect(langs["x-default"]).toMatch(/\/en\/instagram-money-calculator$/);
  });

  it("emits OpenGraph and Twitter blocks", async () => {
    const params = Promise.resolve({ locale: "hi" });
    const meta = await generateMetadata({ params });
    expect(meta.openGraph).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((meta.openGraph as any).url).toBe("/hi/instagram-money-calculator");
    expect(meta.twitter).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((meta.twitter as any).card).toBe("summary_large_image");
  });

  it("includes the target SEO keywords", async () => {
    const params = Promise.resolve({ locale: "en" });
    const meta = await generateMetadata({ params });
    const keywords = meta.keywords as string[];
    expect(keywords).toContain("Instagram Money Calculator");
    expect(keywords).toContain("Instagram Earnings Calculator");
    expect(keywords).toContain("How much do Instagram influencers make");
  });
});
