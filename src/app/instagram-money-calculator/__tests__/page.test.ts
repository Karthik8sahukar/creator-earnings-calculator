import { describe, expect, it } from "vitest";

import { generateMetadata } from "../page";

/**
 * generateMetadata is invoked by Next.js at build time. We validate:
 *   - The canonical URL is present (no locale prefix)
 *   - OpenGraph and Twitter metadata are populated
 *   - Keywords include the primary target queries
 */

describe("Instagram calculator page metadata", () => {
  it("produces canonical URL without locale prefix", async () => {
    const meta = await generateMetadata();
    expect(meta.title).toBeTruthy();
    expect(meta.description).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canonical = (meta.alternates as any)?.canonical as string;
    expect(canonical).toMatch(/\/instagram-money-calculator$/);
    expect(canonical).not.toMatch(/\/en\//);
  });

  it("emits OpenGraph and Twitter blocks", async () => {
    const meta = await generateMetadata();
    expect(meta.openGraph).toBeTruthy();
    expect(meta.twitter).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((meta.twitter as any).card).toBe("summary_large_image");
  });

  it("includes the target SEO keywords", async () => {
    const meta = await generateMetadata();
    const keywords = meta.keywords as string[];
    expect(keywords).toContain("Instagram Money Calculator");
    expect(keywords).toContain("Instagram Earnings Calculator");
    expect(keywords).toContain("How much do Instagram influencers make");
  });
});
