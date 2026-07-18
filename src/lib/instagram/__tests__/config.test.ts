import { describe, expect, it } from "vitest";

import {
  engagementMultiplier,
  ENGAGEMENT_MAX_MULTIPLIER,
  ENGAGEMENT_MIN_MULTIPLIER,
  findInstagramCountry,
  findInstagramNiche,
  followerTierMultiplier,
  INSTAGRAM_BASE_RATES_USD,
  INSTAGRAM_COUNTRIES,
  INSTAGRAM_NICHES,
  REFERENCE_ENGAGEMENT_PCT,
} from "../config";

describe("instagram/config — niches", () => {
  it("has a stable set of niches with unique IDs", () => {
    const ids = INSTAGRAM_NICHES.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("finds a known niche by id", () => {
    expect(findInstagramNiche("finance").multiplier).toBeGreaterThan(1);
  });

  it("falls back to the last niche when id is unknown", () => {
    expect(findInstagramNiche("does-not-exist").id).toBe("other");
  });

  it("premium niches (finance / luxury) pay more than general", () => {
    const general = findInstagramNiche("other").multiplier;
    expect(findInstagramNiche("finance").multiplier).toBeGreaterThan(general);
    expect(findInstagramNiche("luxury").multiplier).toBeGreaterThan(general);
  });
});

describe("instagram/config — countries", () => {
  it("US is the reference (multiplier = 1.0)", () => {
    expect(findInstagramCountry("US").multiplier).toBe(1.0);
  });

  it("India multiplier < US multiplier", () => {
    expect(findInstagramCountry("IN").multiplier).toBeLessThan(
      findInstagramCountry("US").multiplier,
    );
  });

  it("falls back to Rest of World for unknown ids", () => {
    expect(findInstagramCountry("XX").id).toBe("OTHER");
  });

  it("every country id is unique", () => {
    const ids = INSTAGRAM_COUNTRIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("instagram/config — engagement multiplier", () => {
  it("returns 1.0 at the reference engagement rate", () => {
    expect(engagementMultiplier(REFERENCE_ENGAGEMENT_PCT)).toBeCloseTo(1, 5);
  });

  it("is clamped between the min and max multipliers", () => {
    expect(engagementMultiplier(0.01)).toBe(ENGAGEMENT_MIN_MULTIPLIER);
    expect(engagementMultiplier(100)).toBe(ENGAGEMENT_MAX_MULTIPLIER);
  });

  it("is 0.5 (min) for non-finite or negative input", () => {
    expect(engagementMultiplier(Number.NaN)).toBe(ENGAGEMENT_MIN_MULTIPLIER);
    expect(engagementMultiplier(-5)).toBe(ENGAGEMENT_MIN_MULTIPLIER);
  });
});

describe("instagram/config — follower tier", () => {
  it("nano-tier gets a premium (>1)", () => {
    expect(followerTierMultiplier(5_000)).toBeGreaterThan(1);
  });

  it("mega-tier gets a discount (<1)", () => {
    expect(followerTierMultiplier(5_000_000)).toBeLessThan(1);
  });

  it("returns a finite number for zero, negative and NaN followers", () => {
    expect(Number.isFinite(followerTierMultiplier(0))).toBe(true);
    expect(Number.isFinite(followerTierMultiplier(-100))).toBe(true);
    expect(Number.isFinite(followerTierMultiplier(Number.NaN))).toBe(true);
  });
});

describe("instagram/config — base rates ordering", () => {
  it("reels > posts > stories per unit of audience", () => {
    expect(INSTAGRAM_BASE_RATES_USD.reelPerThousandViews).toBeGreaterThan(
      INSTAGRAM_BASE_RATES_USD.feedPostPerThousandReach,
    );
    expect(INSTAGRAM_BASE_RATES_USD.feedPostPerThousandReach).toBeGreaterThan(
      INSTAGRAM_BASE_RATES_USD.storyPerThousandViews,
    );
  });
});
