import { describe, expect, it } from "vitest";

import {
  calculateCpm,
  calculateRpm,
  calculateSponsorship,
} from "../simpleCalculators";

describe("calculateRpm", () => {
  it("returns the correct RPM for typical inputs", () => {
    expect(calculateRpm({ revenue: 100, totalViews: 25_000 }).rpm).toBeCloseTo(4, 5);
  });

  it("guards against division by zero", () => {
    const r = calculateRpm({ revenue: 500, totalViews: 0 });
    expect(r.valid).toBe(false);
    expect(r.rpm).toBe(0);
    expect(r.reason).toMatch(/zero/i);
  });

  it("rejects negative inputs", () => {
    expect(calculateRpm({ revenue: -1, totalViews: 100 }).valid).toBe(false);
    expect(calculateRpm({ revenue: 100, totalViews: -1 }).valid).toBe(false);
  });

  it("rejects NaN inputs", () => {
    expect(calculateRpm({ revenue: Number.NaN, totalViews: 100 }).valid).toBe(false);
    expect(calculateRpm({ revenue: 100, totalViews: Number.NaN }).valid).toBe(false);
  });
});

describe("calculateCpm", () => {
  it("returns the correct CPM for typical inputs", () => {
    expect(
      calculateCpm({ grossAdRevenue: 200, monetizedImpressions: 40_000 }).cpm,
    ).toBeCloseTo(5, 5);
  });

  it("guards against division by zero", () => {
    const r = calculateCpm({ grossAdRevenue: 500, monetizedImpressions: 0 });
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/zero/i);
  });

  it("rejects negative inputs", () => {
    expect(
      calculateCpm({ grossAdRevenue: -1, monetizedImpressions: 100 }).valid,
    ).toBe(false);
  });
});

describe("calculateSponsorship", () => {
  const base = {
    subscribers: 100_000,
    averageViews: 50_000,
    engagementRate: 5,
    nicheMultiplier: 1,
    countryMultiplier: 1,
    deliverable: "integration" as const,
    usageRights: "standard" as const,
    exclusivity: "none" as const,
    videoCount: 1,
  };

  it("returns a low/expected/high band that is monotonically ordered", () => {
    const r = calculateSponsorship(base);
    expect(r.low).toBeLessThanOrEqual(r.expected);
    expect(r.expected).toBeLessThanOrEqual(r.high);
    expect(r.perVideoLow).toBeLessThanOrEqual(r.perVideoExpected);
    expect(r.perVideoExpected).toBeLessThanOrEqual(r.perVideoHigh);
  });

  it("scales linearly with the number of sponsored videos", () => {
    const one = calculateSponsorship(base);
    const three = calculateSponsorship({ ...base, videoCount: 3 });
    expect(three.expected).toBeCloseTo(one.expected * 3, 5);
  });

  it("dedicated videos are worth more than integrations", () => {
    const dedicated = calculateSponsorship({ ...base, deliverable: "dedicated" });
    const integration = calculateSponsorship({ ...base, deliverable: "integration" });
    expect(dedicated.expected).toBeGreaterThan(integration.expected);
  });

  it("full exclusivity is worth more than no exclusivity", () => {
    const full = calculateSponsorship({ ...base, exclusivity: "full" });
    const none = calculateSponsorship({ ...base, exclusivity: "none" });
    expect(full.expected).toBeGreaterThan(none.expected);
  });

  it("perpetual usage rights are worth more than standard", () => {
    const perpetual = calculateSponsorship({ ...base, usageRights: "perpetual" });
    const standard = calculateSponsorship({ ...base, usageRights: "standard" });
    expect(perpetual.expected).toBeGreaterThan(standard.expected);
  });

  it("applies the subscriber floor when views are near zero", () => {
    const r = calculateSponsorship({
      ...base,
      averageViews: 0,
      subscribers: 100_000,
    });
    // 100_000 * 0.005 = 500
    expect(r.perVideoExpected).toBeGreaterThanOrEqual(500);
  });

  it("does not produce NaN for extreme inputs", () => {
    const r = calculateSponsorship({
      ...base,
      averageViews: Number.NaN,
      engagementRate: Number.NaN,
    });
    expect(Number.isFinite(r.expected)).toBe(true);
    expect(Number.isFinite(r.perVideoExpected)).toBe(true);
  });
});
