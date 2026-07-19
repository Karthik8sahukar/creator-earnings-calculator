import { describe, expect, it } from "vitest";

import {
  buildBreadcrumbListLd,
  buildFaqPageLd,
  buildItemListLd,
  buildOrganizationLd,
  buildPersonLd,
  serializeJsonLd,
} from "../jsonLd";

describe("buildBreadcrumbListLd", () => {
  it("returns a well-formed BreadcrumbList with 1-based positions", () => {
    const ld = buildBreadcrumbListLd([
      { name: "Home", url: "https://example.com/" },
      { name: "Creators", url: "https://example.com/creators" },
      { name: "MrBeast", url: "https://example.com/creator/mrbeast" },
    ]);
    expect(ld["@type"]).toBe("BreadcrumbList");
    const items = ld.itemListElement;
    expect(items).toHaveLength(3);
    expect(items[0].position).toBe(1);
    expect(items[2].position).toBe(3);
    expect(items[2].item).toBe("https://example.com/creator/mrbeast");
  });
});

describe("buildPersonLd", () => {
  it("omits optional fields that are not provided", () => {
    const ld = buildPersonLd({
      name: "MrBeast",
      url: "https://example.com/creator/mrbeast",
    });
    expect(ld.name).toBe("MrBeast");
    expect(ld.url).toBe("https://example.com/creator/mrbeast");
    expect(ld.description).toBeUndefined();
    expect(ld.image).toBeUndefined();
    expect(ld.sameAs).toBeUndefined();
    expect(ld.jobTitle).toBeUndefined();
  });

  it("includes optional fields when provided", () => {
    const ld = buildPersonLd({
      name: "MrBeast",
      url: "https://example.com/creator/mrbeast",
      description: "One of the largest YouTube creators.",
      alternateName: "@MrBeast",
      image: "https://yt3.ggpht.com/mrbeast.jpg",
      sameAs: ["https://youtube.com/@MrBeast"],
      jobTitle: "Entertainment",
      nationality: "USA",
    });
    expect(ld.alternateName).toBe("@MrBeast");
    expect(ld.sameAs).toEqual(["https://youtube.com/@MrBeast"]);
    expect(ld.nationality).toBe("USA");
  });
});

describe("buildOrganizationLd", () => {
  it("builds a minimal Organization schema", () => {
    const ld = buildOrganizationLd({
      name: "BeHumler",
      url: "https://example.com",
    });
    expect(ld["@type"]).toBe("Organization");
    expect(ld.name).toBe("BeHumler");
    expect(ld.logo).toBeUndefined();
  });
});

describe("buildFaqPageLd", () => {
  it("drops entries with empty question or answer", () => {
    const ld = buildFaqPageLd([
      { question: "Q1", answer: "A1" },
      { question: "", answer: "orphaned answer" },
      { question: "Q3", answer: "  " },
      { question: "Q4", answer: "A4" },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((ld.mainEntity as any[]).length).toBe(2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((ld.mainEntity as any[])[0].name).toBe("Q1");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((ld.mainEntity as any[])[1].name).toBe("Q4");
  });
});

describe("buildItemListLd", () => {
  it("assigns 1-based positions and preserves optional description", () => {
    const ld = buildItemListLd([
      {
        name: "MrBeast",
        url: "https://example.com/creator/mrbeast",
        description: "One of the largest YouTube creators.",
      },
      { name: "IShowSpeed", url: "https://example.com/creator/ishowspeed" },
    ]);
    expect(ld["@type"]).toBe("ItemList");
    const items = ld.itemListElement;
    expect(items[0].position).toBe(1);
    expect(items[0].description).toBe(
      "One of the largest YouTube creators.",
    );
    expect(items[1].description).toBeUndefined();
  });
});

describe("serializeJsonLd", () => {
  it("returns a single object as a top-level JSON object", () => {
    const raw = serializeJsonLd([{ hello: "world" }]);
    expect(JSON.parse(raw)).toEqual({ hello: "world" });
  });

  it("returns an array of payloads unchanged", () => {
    const raw = serializeJsonLd([{ a: 1 }, { b: 2 }]);
    expect(JSON.parse(raw)).toEqual([{ a: 1 }, { b: 2 }]);
  });
});
