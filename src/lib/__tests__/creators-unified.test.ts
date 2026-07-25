/**
 * Validation tests for the unified creator data architecture.
 *
 * Confirms that src/lib/creators.ts serves all curated creators
 * from the canonical dataset with correct lookups and uniqueness.
 *
 * The curated dataset intentionally excludes creators whose profiles
 * cannot be fetched reliably. Dynamic YouTube search is unaffected.
 */

import { describe, expect, it } from "vitest";

import {
  getCreatorBySlug,
  listCreatorCategories,
  listCreatorCountries,
  listCreators,
  resolveRelatedCreators,
} from "../creators";

/** Creators excluded from curated pages (still searchable via YouTube API). */
const EXCLUDED_SLUGS = [
  "carryminati", "ashishchanchlani", "totalgaming", "round2hell",
  "ksi", "dantdm", "whindersson-nunes", "pokimane", "jordan-matter",
  "lilly-singh", "dhruvrathee", "unspeakable", "triggeredinsaan",
  "mrballen", "techburner", "samayraina", "garyvee", "oversimplified",
  "supercarblondie", "nick-digiovanni", "ryan-trahan", "abroad-in-japan",
];

describe("unified creator catalog", () => {
  it("listCreators() returns a non-empty dataset", () => {
    const creators = listCreators();
    expect(creators.length).toBeGreaterThan(0);
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

  it("every creator has a valid non-null youtubeChannelId or empty string", () => {
    const creators = listCreators();
    for (const c of creators) {
      expect(typeof c.channelId).toBe("string");
    }
  });

  it("verified channel IDs match UC pattern", () => {
    const creators = listCreators();
    const withId = creators.filter((c) => c.channelId.length > 0);
    expect(withId.length).toBeGreaterThan(0);
    for (const c of withId) {
      expect(c.channelId).toMatch(/^UC[A-Za-z0-9_-]{22}$/);
    }
  });

  it("getCreatorBySlug works for a known creator (mrbeast)", () => {
    const creator = getCreatorBySlug("mrbeast");
    expect(creator).toBeDefined();
    expect(creator!.displayName).toBe("MrBeast");
    expect(creator!.channelId).toBe("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(creator!.youtubeHandle).toBe("@MrBeast");
  });

  it("getCreatorBySlug works for a known creator (dude-perfect)", () => {
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

  it("excluded creators are not in the curated dataset", () => {
    for (const slug of EXCLUDED_SLUGS) {
      expect(
        getCreatorBySlug(slug),
        `${slug} should not exist in curated data`,
      ).toBeUndefined();
    }
  });

  it("listCreatorCountries returns multiple countries", () => {
    const countries = listCreatorCountries();
    expect(countries.length).toBeGreaterThan(2);
    expect(countries).toContain("United States");
  });

  it("listCreatorCategories returns multiple categories", () => {
    const categories = listCreatorCategories();
    expect(categories.length).toBeGreaterThan(3);
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

describe("dynamic search independence", () => {
  it("/api/search route does not import from curated dataset", async () => {
    // Read the search route source to verify it doesn't depend on CREATORS_DATASET
    const fs = await import("node:fs");
    const path = await import("node:path");
    const routePath = path.resolve("src/app/api/search/route.ts");
    const source = fs.readFileSync(routePath, "utf-8");
    expect(source).not.toContain("CREATORS_DATASET");
    expect(source).not.toContain("@/data/creators");
    expect(source).not.toContain("dataset");
  });
});

describe("unverified creator profile — no YouTube API calls", () => {
  it("does not call any YouTube API method for unverified creator", async () => {
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

    const unverifiedCreator = {
      slug: "test-unverified",
      displayName: "Test Unverified",
      youtubeHandle: "@TestUnverified",
      channelId: "",
      country: "United States",
      countryCode: "US" as const,
      category: "Entertainment",
      nicheId: "entertainment" as const,
      contentType: "long" as const,
      description: "A test unverified creator.",
      relatedCreators: [],
    };

    const profile = await getCreatorProfile(unverifiedCreator);

    expect(getChannelById).not.toHaveBeenCalled();
    expect(getChannelByHandle).not.toHaveBeenCalled();
    expect(getRecentVideos).not.toHaveBeenCalled();

    expect(profile.fallbackReason).toBe("not-verified");
    expect(profile.channel.title).toBe("Test Unverified");
    expect(profile.videos).toEqual([]);
    expect(profile.earnings.monthlyViews).toBe(0);
  });
});

describe("verified creators preserved", () => {
  it("verified creators retain their channel IDs", () => {
    const creators = listCreators();
    const verified = creators.filter((c) => c.channelId.length > 0);
    expect(verified.length).toBeGreaterThan(20);

    // Spot-check key creators that remain in the curated dataset
    const expectedChannelIds: Record<string, string> = {
      mrbeast: "UCX6OQ3DkcsbYNE6H8uQQuVA",
      markiplier: "UC7_YxT-KID8kRbqZo7MyscQ",
      pewdiepie: "UC-lHJZR3Gqxm24_Vd_AJ5Yw",
      mkbhd: "UCBJycsmduvYEL83R_U4JriQ",
      linustechtips: "UCXuqSBlHAE6Xw-yeJA0Tunw",
    };

    for (const [slug, expectedId] of Object.entries(expectedChannelIds)) {
      const c = getCreatorBySlug(slug);
      expect(c, `${slug} must exist`).toBeDefined();
      expect(c!.channelId).toBe(expectedId);
    }
  });

  it("verified creators have valid metadata", () => {
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
