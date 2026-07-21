/**
 * Validation tests for the unified creator data architecture.
 *
 * Confirms that src/lib/creators.ts now serves all 200 creators
 * from the canonical dataset with correct lookups and uniqueness.
 */

import { describe, expect, it } from "vitest";

import {
  getCreatorBySlug,
  listCreatorCategories,
  listCreatorCountries,
  listCreators,
  resolveRelatedCreators,
} from "../creators";

describe("unified creator catalog", () => {
  it("listCreators() returns 200 entries", () => {
    const creators = listCreators();
    expect(creators.length).toBe(200);
  });

  it("all creator slugs are unique", () => {
    const creators = listCreators();
    const slugs = creators.map((c) => c.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it("all non-empty channel IDs are unique", () => {
    const creators = listCreators();
    const ids = creators
      .map((c) => c.channelId)
      .filter((id) => id.length > 0);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("verified channel IDs match UC pattern", () => {
    const creators = listCreators();
    const withId = creators.filter((c) => c.channelId.length > 0);
    for (const c of withId) {
      expect(c.channelId).toMatch(/^UC[A-Za-z0-9_-]{22}$/);
    }
  });

  it("getCreatorBySlug works for an original creator (mrbeast)", () => {
    const creator = getCreatorBySlug("mrbeast");
    expect(creator).toBeDefined();
    expect(creator!.displayName).toBe("MrBeast");
    expect(creator!.channelId).toBe("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(creator!.youtubeHandle).toBe("@MrBeast");
  });

  it("getCreatorBySlug works for a newly added creator (dude-perfect)", () => {
    const creator = getCreatorBySlug("dude-perfect");
    expect(creator).toBeDefined();
    expect(creator!.displayName).toBe("Dude Perfect");
  });

  it("getCreatorBySlug works for a non-US creator (hikakintv)", () => {
    const creator = getCreatorBySlug("hikakintv");
    expect(creator).toBeDefined();
    expect(creator!.country).toContain("Japan");
  });

  it("getCreatorBySlug returns undefined for unknown slug", () => {
    expect(getCreatorBySlug("nonexistent-creator-xyz")).toBeUndefined();
  });

  it("listCreatorCountries returns more than 2 countries", () => {
    const countries = listCreatorCountries();
    expect(countries.length).toBeGreaterThan(5);
    expect(countries).toContain("United States");
    expect(countries).toContain("India");
    expect(countries).toContain("United Kingdom");
  });

  it("listCreatorCategories returns multiple categories", () => {
    const categories = listCreatorCategories();
    expect(categories.length).toBeGreaterThan(5);
    expect(categories).toContain("Gaming");
    expect(categories).toContain("Technology");
    expect(categories).toContain("Entertainment");
  });

  it("resolveRelatedCreators returns valid creators", () => {
    const related = resolveRelatedCreators(["mrbeast", "markiplier"]);
    expect(related.length).toBe(2);
    expect(related[0].slug).toBe("mrbeast");
    expect(related[1].slug).toBe("markiplier");
  });

  it("resolveRelatedCreators silently drops unknown slugs", () => {
    const related = resolveRelatedCreators(["mrbeast", "fake-slug-xyz"]);
    expect(related.length).toBe(1);
    expect(related[0].slug).toBe("mrbeast");
  });

  it("unverified creator has empty channelId", () => {
    // Find any creator with empty channelId
    const creators = listCreators();
    const unverified = creators.find((c) => c.channelId === "");
    expect(unverified).toBeDefined();
    // It should still have all required fields
    expect(unverified!.slug).toBeTruthy();
    expect(unverified!.displayName).toBeTruthy();
    expect(unverified!.youtubeHandle).toBeTruthy();
    expect(unverified!.description).toBeTruthy();
  });

  it("every creator has required fields", () => {
    const creators = listCreators();
    for (const c of creators) {
      expect(c.slug).toBeTruthy();
      expect(c.displayName).toBeTruthy();
      expect(c.youtubeHandle).toBeTruthy();
      expect(c.country).toBeTruthy();
      expect(c.category).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(Array.isArray(c.relatedCreators)).toBe(true);
    }
  });
});
