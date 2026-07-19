import { describe, expect, it } from "vitest";

import {
  CREATORS,
  getCreatorBySlug,
  getCreatorCountryTier,
  getCreatorNiche,
  listCreatorCategories,
  listCreatorCountries,
  listCreators,
  resolveCountryCode,
  resolveNicheId,
  resolveRelatedCreators,
} from "../creators";

/**
 * Data-integrity tests. These are the safeguards that protect the
 * dynamic route from ever rendering a broken profile — every slug
 * must be unique, every relatedCreators reference must resolve, and
 * every countryCode / nicheId must exist in the rpmData tables.
 */
describe("creators catalog", () => {
  it("has at least twenty phase-1 creators", () => {
    expect(CREATORS.length).toBeGreaterThanOrEqual(20);
  });

  it("has unique slugs", () => {
    const seen = new Set<string>();
    for (const c of CREATORS) {
      expect(seen.has(c.slug), `duplicate slug ${c.slug}`).toBe(false);
      seen.add(c.slug);
    }
  });

  it("every relatedCreators reference resolves to a real slug", () => {
    const validSlugs = new Set(CREATORS.map((c) => c.slug));
    for (const c of CREATORS) {
      for (const r of c.relatedCreators) {
        expect(
          validSlugs.has(r),
          `${c.slug} references unknown related slug ${r}`,
        ).toBe(true);
      }
    }
  });

  it("every displayName is non-empty and every handle starts with @", () => {
    for (const c of CREATORS) {
      expect(c.displayName.trim().length).toBeGreaterThan(0);
      expect(c.youtubeHandle.startsWith("@")).toBe(true);
    }
  });

  it("every country and category label is non-empty", () => {
    for (const c of CREATORS) {
      expect(c.country.length).toBeGreaterThan(0);
      expect(c.category.length).toBeGreaterThan(0);
    }
  });
});

describe("getCreatorBySlug", () => {
  it("returns the creator for a known slug", () => {
    const c = getCreatorBySlug("mrbeast");
    expect(c?.slug).toBe("mrbeast");
    expect(c?.displayName).toBe("MrBeast");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getCreatorBySlug("no-such-slug")).toBeUndefined();
  });
});

describe("listCreators / listCreatorCountries / listCreatorCategories", () => {
  it("listCreators returns the full catalog in order", () => {
    expect(listCreators().length).toBe(CREATORS.length);
    expect(listCreators()[0].slug).toBe(CREATORS[0].slug);
  });

  it("listCreatorCountries returns unique, sorted labels", () => {
    const countries = listCreatorCountries();
    expect(new Set(countries).size).toBe(countries.length);
    const sorted = [...countries].sort((a, b) => a.localeCompare(b));
    expect(countries).toEqual(sorted);
  });

  it("listCreatorCategories returns unique, sorted labels", () => {
    const categories = listCreatorCategories();
    expect(new Set(categories).size).toBe(categories.length);
    const sorted = [...categories].sort((a, b) => a.localeCompare(b));
    expect(categories).toEqual(sorted);
  });
});

describe("resolveRelatedCreators", () => {
  it("silently drops unknown slugs and dedupes", () => {
    const result = resolveRelatedCreators([
      "mrbeast",
      "ishowspeed",
      "mrbeast", // duplicate
      "does-not-exist",
    ]);
    expect(result.map((c) => c.slug)).toEqual(["mrbeast", "ishowspeed"]);
  });

  it("returns an empty array when no slug matches", () => {
    expect(resolveRelatedCreators(["nope", "still-nope"])).toEqual([]);
  });
});

describe("resolveNicheId / resolveCountryCode", () => {
  it("uses the explicit nicheId when present", () => {
    const mrbeast = getCreatorBySlug("mrbeast")!;
    expect(resolveNicheId(mrbeast)).toBe(mrbeast.nicheId);
  });

  it("derives a niche from the category when nicheId is missing", () => {
    const custom = {
      slug: "custom",
      displayName: "Custom",
      youtubeHandle: "@custom",
      channelId: "",
      country: "Neverland",
      category: "Finance",
      description: "",
      relatedCreators: [],
    };
    expect(resolveNicheId(custom)).toBe("finance");
  });

  it("falls back to 'other' when neither nicheId nor category matches", () => {
    const custom = {
      slug: "custom",
      displayName: "Custom",
      youtubeHandle: "@custom",
      channelId: "",
      country: "Neverland",
      category: "Not A Known Category",
      description: "",
      relatedCreators: [],
    };
    expect(resolveNicheId(custom)).toBe("other");
  });

  it("resolveCountryCode falls back to OTHER when missing", () => {
    const custom = {
      slug: "custom",
      displayName: "Custom",
      youtubeHandle: "@custom",
      channelId: "",
      country: "Neverland",
      category: "Entertainment",
      description: "",
      relatedCreators: [],
    };
    expect(resolveCountryCode(custom)).toBe("OTHER");
  });
});

describe("getCreatorCountryTier / getCreatorNiche", () => {
  it("returns real rpmData records for every catalog creator", () => {
    for (const c of CREATORS) {
      const tier = getCreatorCountryTier(c);
      const niche = getCreatorNiche(c);
      expect(tier.baseRpm).toBeGreaterThan(0);
      expect(niche.rpmMultiplier).toBeGreaterThan(0);
    }
  });
});
