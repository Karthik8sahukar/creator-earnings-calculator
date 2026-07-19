import { describe, expect, it } from "vitest";

import {
  CPM_TO_RPM_RATIO,
  estimateRevenue,
  resolveCountryTier,
} from "../estimateRevenue";

/**
 * Revenue estimation is a thin wrapper on `calculateEarnings`. These
 * tests verify the wrapper's contract:
 *
 *   • Country lookup handles known + unknown codes.
 *   • Zero / negative / NaN view counts produce zero revenue.
 *   • Monthly × 12 relationship holds (annual figure comes from the
 *     earnings engine, we're checking the wrapper doesn't corrupt it).
 *   • CPM = RPM × 1.8 within a small floating-point tolerance.
 *   • Currency is USD in phase-1.
 *   • Country label round-trips through the response.
 */

describe("resolveCountryTier", () => {
  it("returns a known country by ISO code", () => {
    const us = resolveCountryTier("US");
    expect(us.id).toBe("US");
    expect(us.label).toContain("United States");
  });

  it("uppercases the code before matching", () => {
    const us = resolveCountryTier("us");
    expect(us.id).toBe("US");
  });

  it("falls back to OTHER for unknown codes", () => {
    expect(resolveCountryTier("ZZ").id).toBe("OTHER");
  });

  it("falls back to OTHER for null / empty", () => {
    expect(resolveCountryTier(null).id).toBe("OTHER");
    expect(resolveCountryTier(undefined).id).toBe("OTHER");
    expect(resolveCountryTier("").id).toBe("OTHER");
  });
});

describe("estimateRevenue", () => {
  it("returns positive monthly, yearly, rpm, and cpm for a US channel with 1M monthly views", () => {
    const r = estimateRevenue({
      monthlyViews: 1_000_000,
      countryCode: "US",
      contentType: "mixed",
    });

    expect(r.currency).toBe("USD");
    expect(r.country.id).toBe("US");
    expect(r.niche.id).toBe("other");
    expect(r.monthlyViews).toBe(1_000_000);

    // All bands positive and in ascending order.
    expect(r.monthly.low).toBeGreaterThan(0);
    expect(r.monthly.expected).toBeGreaterThan(r.monthly.low);
    expect(r.monthly.high).toBeGreaterThan(r.monthly.expected);

    expect(r.yearly.low).toBeGreaterThan(0);
    expect(r.yearly.expected).toBeGreaterThan(r.yearly.low);
    expect(r.yearly.high).toBeGreaterThan(r.yearly.expected);

    expect(r.rpmExpected).toBeGreaterThan(0);
    expect(r.cpmExpected).toBeGreaterThan(r.rpmExpected);
  });

  it("annual is 12× monthly (delegates cleanly to earnings engine)", () => {
    const r = estimateRevenue({
      monthlyViews: 500_000,
      countryCode: "IN",
      contentType: "long",
    });
    expect(r.yearly.expected).toBeCloseTo(r.monthly.expected * 12, 5);
    expect(r.yearly.low).toBeCloseTo(r.monthly.low * 12, 5);
    expect(r.yearly.high).toBeCloseTo(r.monthly.high * 12, 5);
  });

  it("derives CPM as RPM × 1.8 within tolerance", () => {
    const r = estimateRevenue({
      monthlyViews: 250_000,
      countryCode: "GB",
    });
    expect(r.cpmExpected).toBeCloseTo(r.rpmExpected * CPM_TO_RPM_RATIO, 5);
  });

  it("returns zero revenue for zero views but still populates RPM/CPM defaults", () => {
    const r = estimateRevenue({
      monthlyViews: 0,
      countryCode: "US",
    });
    expect(r.monthly.expected).toBe(0);
    expect(r.yearly.expected).toBe(0);
    // With zero views the engine can't back out an RPM, so we fall
    // back to the raw country × niche baseline. That number is
    // strictly positive.
    expect(r.rpmExpected).toBeGreaterThan(0);
    expect(r.cpmExpected).toBeCloseTo(r.rpmExpected * CPM_TO_RPM_RATIO, 5);
  });

  it("clamps negative and NaN view counts to zero", () => {
    const neg = estimateRevenue({ monthlyViews: -100, countryCode: "US" });
    expect(neg.monthly.expected).toBe(0);
    expect(neg.monthlyViews).toBe(0);

    const nan = estimateRevenue({
      monthlyViews: Number.NaN,
      countryCode: "US",
    });
    expect(nan.monthly.expected).toBe(0);
    expect(nan.monthlyViews).toBe(0);
  });

  it("uses the 'other' country tier as a graceful fallback for unknown ISO codes", () => {
    const r = estimateRevenue({
      monthlyViews: 100_000,
      countryCode: "ZZ",
    });
    expect(r.country.id).toBe("OTHER");
    expect(r.monthly.expected).toBeGreaterThan(0);
  });

  it("US channels earn more per view than 'OTHER' at the same volume", () => {
    // A cross-country sanity check: the RPM tables put the US at
    // ~3× the OTHER tier, so the expected monthly figure must be
    // strictly greater for the same view count. This catches a
    // whole class of accidental table swaps.
    const us = estimateRevenue({
      monthlyViews: 1_000_000,
      countryCode: "US",
      contentType: "long",
    });
    const other = estimateRevenue({
      monthlyViews: 1_000_000,
      countryCode: null,
      contentType: "long",
    });
    expect(us.monthly.expected).toBeGreaterThan(other.monthly.expected);
  });

  it("scales linearly with view count for a fixed country + niche", () => {
    const a = estimateRevenue({
      monthlyViews: 100_000,
      countryCode: "US",
      contentType: "long",
    });
    const b = estimateRevenue({
      monthlyViews: 400_000,
      countryCode: "US",
      contentType: "long",
    });
    // 4× the views ⇒ 4× the earnings (linear formula).
    expect(b.monthly.expected).toBeCloseTo(a.monthly.expected * 4, 5);
  });
});
