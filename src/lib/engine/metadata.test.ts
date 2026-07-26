import { describe, it, expect, vi } from "vitest";

import {
  createToolMetadata,
  generateToolJsonLd,
  getToolEyebrow,
  getToolMaxWidth,
} from "./metadata";
import { getToolBySlug } from "@/lib/tools";

// We need to mock the publicConfig siteUrl for deterministic URLs
vi.mock("@/lib/config", () => ({
  publicConfig: {
    siteName: "BeHumler",
    siteUrl: "https://behumler.com",
    description: "Test description",
  },
  BRAND_NAME: "BeHumler",
}));

describe("createToolMetadata", () => {
  it("generates metadata for a valid slug", async () => {
    const generate = createToolMetadata("coin-flip");
    const params = Promise.resolve({ locale: "en" });
    const metadata = await generate({ params });

    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
    expect(metadata.alternates).toBeDefined();
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.twitter).toBeDefined();
  });

  it("returns 'Tool Not Found' for invalid slug", async () => {
    const generate = createToolMetadata("nonexistent-tool-xyz");
    const params = Promise.resolve({ locale: "en" });
    const metadata = await generate({ params });

    expect(metadata.title).toBe("Tool Not Found");
  });

  it("uses registry title by default", async () => {
    const generate = createToolMetadata("coin-flip");
    const params = Promise.resolve({ locale: "en" });
    const metadata = await generate({ params });

    expect(metadata.title).toBe("Coin Flip");
  });

  it("applies title override", async () => {
    const generate = createToolMetadata("coin-flip", {
      title: "Custom Title Override",
    });
    const params = Promise.resolve({ locale: "en" });
    const metadata = await generate({ params });

    expect(metadata.title).toBe("Custom Title Override");
  });

  it("applies description override", async () => {
    const generate = createToolMetadata("coin-flip", {
      description: "My custom description",
    });
    const params = Promise.resolve({ locale: "en" });
    const metadata = await generate({ params });

    expect(metadata.description).toBe("My custom description");
  });

  it("includes tool tags as keywords", async () => {
    const generate = createToolMetadata("coin-flip");
    const params = Promise.resolve({ locale: "en" });
    const metadata = await generate({ params });

    const tool = getToolBySlug("coin-flip");
    expect(metadata.keywords).toEqual(expect.arrayContaining(tool!.tags));
  });

  it("merges override keywords with tool tags", async () => {
    const generate = createToolMetadata("coin-flip", {
      keywords: ["extra-keyword"],
    });
    const params = Promise.resolve({ locale: "en" });
    const metadata = await generate({ params });

    expect(metadata.keywords).toContain("extra-keyword");
  });

  it("builds correct openGraph URL with locale", async () => {
    const generate = createToolMetadata("coin-flip");
    const params = Promise.resolve({ locale: "es" });
    const metadata = await generate({ params });

    expect((metadata.openGraph as Record<string, unknown>)?.url).toBe(
      "https://behumler.com/es/coin-flip",
    );
  });
});

describe("generateToolJsonLd", () => {
  it("returns empty array for invalid slug", () => {
    const result = generateToolJsonLd({
      slug: "nonexistent-tool-xyz",
      locale: "en",
    });
    expect(result).toEqual([]);
  });

  it("returns BreadcrumbList and SoftwareApplication for valid slug", () => {
    const result = generateToolJsonLd({
      slug: "coin-flip",
      locale: "en",
    });

    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toMatchObject({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
    });
    expect(result[1]).toMatchObject({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
    });
  });

  it("includes FAQPage when faq is provided", () => {
    const faq = [
      { q: "Is it free?", a: "Yes." },
      { q: "Is it random?", a: "Yes." },
    ];
    const result = generateToolJsonLd({
      slug: "coin-flip",
      locale: "en",
      faq,
    });

    expect(result.length).toBe(3);
    expect(result[2]).toMatchObject({
      "@context": "https://schema.org",
      "@type": "FAQPage",
    });
    // Check FAQ items mapped correctly
    const faqSchema = result[2] as Record<string, unknown>;
    const mainEntity = faqSchema.mainEntity as Array<Record<string, unknown>>;
    expect(mainEntity.length).toBe(2);
    expect(mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: "Is it free?",
    });
  });

  it("does not include FAQPage when faq is empty", () => {
    const result = generateToolJsonLd({
      slug: "coin-flip",
      locale: "en",
      faq: [],
    });

    expect(result.length).toBe(2);
  });

  it("uses locale in URLs", () => {
    const result = generateToolJsonLd({
      slug: "coin-flip",
      locale: "de",
    });

    const breadcrumb = result[0] as Record<string, unknown>;
    const items = (breadcrumb as Record<string, unknown>).itemListElement as Array<Record<string, unknown>>;
    expect(items[0].item).toBe("https://behumler.com/de");
    expect(items[1].item).toContain("/de/coin-flip");
  });

  it("respects breadcrumbName override", () => {
    const result = generateToolJsonLd({
      slug: "coin-flip",
      locale: "en",
      breadcrumbName: "Flip a Coin",
    });

    const breadcrumb = result[0] as Record<string, unknown>;
    const items = (breadcrumb as Record<string, unknown>).itemListElement as Array<Record<string, unknown>>;
    expect(items[1].name).toBe("Flip a Coin");
  });

  it("respects applicationCategory override", () => {
    const result = generateToolJsonLd({
      slug: "coin-flip",
      locale: "en",
      applicationCategory: "GameApplication",
    });

    const app = result[1] as Record<string, unknown>;
    expect(app.applicationCategory).toBe("GameApplication");
  });

  it("sets SoftwareApplication price to 0 (free)", () => {
    const result = generateToolJsonLd({
      slug: "coin-flip",
      locale: "en",
    });

    const app = result[1] as Record<string, unknown>;
    const offers = app.offers as Record<string, unknown>;
    expect(offers.price).toBe("0");
    expect(offers.priceCurrency).toBe("USD");
  });
});

describe("getToolEyebrow", () => {
  it("returns category label for valid slug", () => {
    const eyebrow = getToolEyebrow("coin-flip");
    // coin-flip is in "decision-random" category
    expect(eyebrow).toBeTruthy();
    expect(typeof eyebrow).toBe("string");
    expect(eyebrow.length).toBeGreaterThan(0);
  });

  it("returns 'Tool' for invalid slug", () => {
    const eyebrow = getToolEyebrow("nonexistent-xyz");
    expect(eyebrow).toBe("Tool");
  });
});

describe("getToolMaxWidth", () => {
  it("returns max-w-5xl for developer tools", () => {
    const tool = getToolBySlug("json-formatter");
    if (tool) {
      const maxWidth = getToolMaxWidth(tool);
      expect(maxWidth).toBe("max-w-5xl");
    }
  });

  it("returns max-w-4xl for decision tools", () => {
    const tool = getToolBySlug("coin-flip");
    if (tool) {
      const maxWidth = getToolMaxWidth(tool);
      expect(maxWidth).toBe("max-w-4xl");
    }
  });

  it("returns max-w-4xl for calculator tools", () => {
    const tool = getToolBySlug("youtube-rpm-calculator");
    if (tool) {
      const maxWidth = getToolMaxWidth(tool);
      expect(maxWidth).toBe("max-w-4xl");
    }
  });
});
