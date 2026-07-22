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



describe("unverified creator profile — no YouTube API calls", () => {
  it("does not call any YouTube API method for unverified creator", async () => {
    // Mock the youtube module to track calls
    const { vi } = await import("vitest");
    vi.resetModules();

    const getChannelById = vi.fn();
    const getChannelByHandle = vi.fn();
    const getRecentVideos = vi.fn();

    vi.doMock("../youtube", () => ({
      getChannelById,
      getChannelByHandle,
      getRecentVideos,
      YouTubeApiError: class extends Error {
        status: number;
        code: string;
        constructor(s: number, c: string, m: string) {
          super(m);
          this.status = s;
          this.code = c;
        }
      },
    }));

    const { getCreatorProfile } = await import("../creatorProfile");

    // Create an unverified creator (empty channelId)
    const unverifiedCreator = {
      slug: "test-unverified",
      displayName: "Test Unverified",
      youtubeHandle: "@TestUnverified",
      channelId: "", // <-- empty = unverified
      country: "United States",
      countryCode: "US" as const,
      category: "Entertainment",
      nicheId: "entertainment" as const,
      contentType: "long" as const,
      description: "A test unverified creator.",
      relatedCreators: [],
    };

    const profile = await getCreatorProfile(unverifiedCreator);

    // CRITICAL: No YouTube API method should have been called
    expect(getChannelById).not.toHaveBeenCalled();
    expect(getChannelByHandle).not.toHaveBeenCalled();
    expect(getRecentVideos).not.toHaveBeenCalled();

    // Profile should render with fallback
    expect(profile.fallbackReason).toBe("not-verified");
    expect(profile.channel.title).toBe("Test Unverified");
    expect(profile.videos).toEqual([]);
    expect(profile.earnings.monthlyViews).toBe(0);
  });
});

describe("original verified creators preserved", () => {
  it("all 23 verified creators retain their channel IDs", () => {
    const creators = listCreators();
    const verified = creators.filter((c) => c.channelId.length > 0);
    expect(verified.length).toBe(23);

    // Spot-check key creators
    const expectedChannelIds: Record<string, string> = {
      mrbeast: "UCX6OQ3DkcsbYNE6H8uQQuVA",
      markiplier: "UC7_YxT-KID8kRbqZo7MyscQ",
      pewdiepie: "UC-lHJZR3Gqxm24_Vd_AJ5Yw",
      carryminati: "UCj22tfcQrWMFIGCeyKP9hQg",
      ksi: "UCGSfMkBdr4YjBKGRhKKbEgQ",
    };

    for (const [slug, expectedId] of Object.entries(expectedChannelIds)) {
      const c = getCreatorBySlug(slug);
      expect(c).toBeDefined();
      expect(c!.channelId).toBe(expectedId);
    }
  });

  it("verified creators have non-null channel metadata", () => {
    const creators = listCreators();
    const verified = creators.filter((c) => c.channelId.length > 0);
    for (const c of verified) {
      expect(c.displayName).toBeTruthy();
      expect(c.youtubeHandle.startsWith("@")).toBe(true);
      expect(c.country).toBeTruthy();
      expect(c.category).toBeTruthy();
    }
  });
});
