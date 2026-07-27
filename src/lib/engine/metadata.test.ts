import { describe, it, expect, vi } from "vitest";
import {
  createToolMetadata,
  generateToolJsonLd,
  cleanStructuredData,
  safeJsonLdSerialize,
  getToolEyebrow,
  getToolMaxWidth,
} from "./metadata";
import { getToolBySlug } from "@/lib/tools";

vi.mock("@/lib/config", () => ({
  publicConfig: {
    siteName: "BeHumler",
    siteUrl: "https://behumler.com",
    description: "Test",
  },
  BRAND_NAME: "BeHumler",
}));

describe("createToolMetadata", () => {
  it("generates complete metadata for English", async () => {
    const gen = createToolMetadata("coin-flip");
    const meta = await gen({ params: Promise.resolve({ locale: "en" }) });
    expect(meta.title).toBe("Coin Flip");
    expect(meta.description).toBeTruthy();
    expect(meta.robots).toEqual({ index: true, follow: true });
    expect(meta.alternates?.canonical).toBe("https://behumler.com/en/coin-flip");
  });

  it("generates metadata for Spanish locale", async () => {
    const gen = createToolMetadata("coin-flip");
    const meta = await gen({ params: Promise.resolve({ locale: "es" }) });
    expect(meta.alternates?.canonical).toBe("https://behumler.com/es/coin-flip");
    const langs = meta.alternates?.languages as Record<string, string>;
    expect(langs["es"]).toBe("https://behumler.com/es/coin-flip");
    expect(langs["en"]).toBe("https://behumler.com/en/coin-flip");
  });

  it("hreflang includes x-default", async () => {
    const gen = createToolMetadata("coin-flip");
    const meta = await gen({ params: Promise.resolve({ locale: "en" }) });
    const langs = meta.alternates?.languages as Record<string, string>;
    expect(langs["x-default"]).toBe("https://behumler.com/en/coin-flip");
  });

  it("applies title override", async () => {
    const gen = createToolMetadata("coin-flip", { title: "Custom Title" });
    const meta = await gen({ params: Promise.resolve({ locale: "en" }) });
    expect(meta.title).toBe("Custom Title");
  });

  it("includes OG image fallback", async () => {
    const gen = createToolMetadata("coin-flip");
    const meta = await gen({ params: Promise.resolve({ locale: "en" }) });
    const og = meta.openGraph as Record<string, unknown>;
    const images = og.images as Array<Record<string, unknown>>;
    expect(images[0].url).toBe("https://behumler.com/og-default.png");
    expect(images[0].width).toBe(1200);
    expect(images[0].height).toBe(630);
  });

  it("Twitter card has image", async () => {
    const gen = createToolMetadata("coin-flip");
    const meta = await gen({ params: Promise.resolve({ locale: "en" }) });
    const tw = meta.twitter as Record<string, unknown>;
    expect(tw.images).toEqual(["https://behumler.com/og-default.png"]);
  });

  it("returns noindex for invalid slug", async () => {
    const gen = createToolMetadata("nonexistent-xyz");
    const meta = await gen({ params: Promise.resolve({ locale: "en" }) });
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it("does not emit empty keywords", async () => {
    const gen = createToolMetadata("coin-flip");
    const meta = await gen({ params: Promise.resolve({ locale: "en" }) });
    if (meta.keywords) {
      for (const k of meta.keywords as string[]) {
        expect(k.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("no duplicate locale segments in canonical", async () => {
    const gen = createToolMetadata("coin-flip");
    const meta = await gen({ params: Promise.resolve({ locale: "es" }) });
    const canonical = meta.alternates?.canonical as string;
    expect(canonical).not.toMatch(/\/es\/es\//);
  });

  it("OG url is absolute", async () => {
    const gen = createToolMetadata("coin-flip");
    const meta = await gen({ params: Promise.resolve({ locale: "en" }) });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.url).toMatch(/^https:\/\//);
  });
});

describe("generateToolJsonLd", () => {
  it("produces valid BreadcrumbList", () => {
    const result = generateToolJsonLd({ slug: "coin-flip", locale: "en" });
    const bc = result[0] as Record<string, unknown>;
    expect(bc["@type"]).toBe("BreadcrumbList");
    const items = bc.itemListElement as Array<Record<string, unknown>>;
    expect(items.length).toBeGreaterThanOrEqual(2);
    for (const item of items) {
      expect(item.name).toBeTruthy();
      expect(item.item).toMatch(/^https:\/\//);
      expect(item.position).toBeGreaterThan(0);
    }
  });

  it("produces valid SoftwareApplication", () => {
    const result = generateToolJsonLd({ slug: "coin-flip", locale: "en" });
    const app = result[1] as Record<string, unknown>;
    expect(app["@type"]).toBe("SoftwareApplication");
    expect(app.name).toBeTruthy();
    expect(app.description).toBeTruthy();
    expect(app.operatingSystem).toBe("Any");
    expect(app.url).toMatch(/^https:\/\//);
  });

  it("emits FAQPage with valid FAQs", () => {
    const faq = [{ q: "Q1?", a: "A1." }, { q: "Q2?", a: "A2." }];
    const result = generateToolJsonLd({ slug: "coin-flip", locale: "en", faq });
    const faqSchema = result[2] as Record<string, unknown>;
    expect(faqSchema["@type"]).toBe("FAQPage");
    const entities = faqSchema.mainEntity as Array<Record<string, unknown>>;
    expect(entities.length).toBe(2);
  });

  it("omits FAQPage when no FAQs", () => {
    const result = generateToolJsonLd({ slug: "coin-flip", locale: "en" });
    expect(result.length).toBe(2);
  });

  it("filters invalid FAQ entries", () => {
    const faq = [{ q: "", a: "answer" }, { q: "question", a: "" }, { q: "Valid?", a: "Yes." }];
    const result = generateToolJsonLd({ slug: "coin-flip", locale: "en", faq });
    const faqSchema = result[2] as Record<string, unknown>;
    const entities = faqSchema.mainEntity as Array<Record<string, unknown>>;
    expect(entities.length).toBe(1);
    expect(entities[0].name).toBe("Valid?");
  });

  it("URLs preserve locale", () => {
    const result = generateToolJsonLd({ slug: "coin-flip", locale: "de" });
    const bc = result[0] as Record<string, unknown>;
    const items = bc.itemListElement as Array<Record<string, unknown>>;
    expect(items[0].item).toContain("/de");
  });

  it("does not contain invented ratings or reviews", () => {
    const result = generateToolJsonLd({ slug: "coin-flip", locale: "en" });
    const json = JSON.stringify(result);
    expect(json).not.toContain("aggregateRating");
    expect(json).not.toContain("Review");
    expect(json).not.toContain("ratingValue");
  });

  it("can be parsed as valid JSON", () => {
    const result = generateToolJsonLd({ slug: "coin-flip", locale: "en", faq: [{ q: "Q?", a: "A." }] });
    const serialized = JSON.stringify(result);
    expect(() => JSON.parse(serialized)).not.toThrow();
  });
});

describe("cleanStructuredData", () => {
  it("removes undefined and null", () => {
    expect(cleanStructuredData(undefined)).toBeUndefined();
    expect(cleanStructuredData(null)).toBeUndefined();
  });

  it("removes empty strings", () => {
    expect(cleanStructuredData("")).toBeUndefined();
    expect(cleanStructuredData("  ")).toBeUndefined();
  });

  it("preserves false and 0", () => {
    expect(cleanStructuredData(false)).toBe(false);
    expect(cleanStructuredData(0)).toBe(0);
  });

  it("removes empty arrays", () => {
    expect(cleanStructuredData([])).toBeUndefined();
  });

  it("preserves non-empty arrays", () => {
    expect(cleanStructuredData([1, 2])).toEqual([1, 2]);
  });

  it("removes keys with undefined/null/empty values from objects", () => {
    const result = cleanStructuredData({ a: "valid", b: "", c: null, d: undefined });
    expect(result).toEqual({ a: "valid" });
  });

  it("works recursively", () => {
    const input = { name: "Test", nested: { empty: "", kept: "yes" }, arr: [null, "ok"] };
    const result = cleanStructuredData(input);
    expect(result).toEqual({ name: "Test", nested: { kept: "yes" }, arr: ["ok"] });
  });
});

describe("safeJsonLdSerialize", () => {
  it("escapes < to prevent script injection", () => {
    const data = { text: "</script><script>alert(1)</script>" };
    const result = safeJsonLdSerialize(data);
    expect(result).not.toContain("</script>");
    expect(result).toContain("\\u003c");
  });

  it("escapes > and &", () => {
    const data = { a: "x > y & z" };
    const result = safeJsonLdSerialize(data);
    expect(result).not.toContain(">");
    expect(result).not.toContain("&");
  });

  it("produces parseable JSON (after unescaping)", () => {
    const data = [{ "@type": "Test", name: "Hello" }];
    const result = safeJsonLdSerialize(data);
    // The escaped version should still parse correctly when browser interprets it
    const unescaped = result.replace(/\\u003c/g, "<").replace(/\\u003e/g, ">").replace(/\\u0026/g, "&");
    expect(() => JSON.parse(unescaped)).not.toThrow();
  });
});

describe("getToolEyebrow", () => {
  it("returns category label", () => {
    const result = getToolEyebrow("coin-flip");
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns Tool for invalid slug", () => {
    expect(getToolEyebrow("nonexistent")).toBe("Tool");
  });
});

describe("getToolMaxWidth", () => {
  it("returns max-w-5xl for developer tools", () => {
    const tool = getToolBySlug("json-formatter");
    expect(getToolMaxWidth(tool!)).toBe("max-w-5xl");
  });

  it("returns max-w-4xl for decision tools", () => {
    const tool = getToolBySlug("coin-flip");
    expect(getToolMaxWidth(tool!)).toBe("max-w-4xl");
  });
});
