import { describe, expect, it } from "vitest";

import { calculateEarnings } from "../earnings";
import { CONTENT_TYPE_MULTIPLIERS, findCountry, findNiche } from "../rpmData";
import type { EarningsInput } from "../schemas";

const BASE: EarningsInput = {
  monthlyViews: 1_000_000,
  country: "US",
  niche: "other",
  contentType: "long",
  currency: "USD",
  monetizedPercentage: 100,
  sponsorship: 0,
  affiliate: 0,
  membership: 0,
};

describe("calculateEarnings — core ad revenue math", () => {
  it("uses country/niche/content RPM in auto mode", () => {
    const r = calculateEarnings(BASE);
    const us = findCountry("US");
    const other = findNiche("other");
    const mult = CONTENT_TYPE_MULTIPLIERS.long;
    // 1,000,000 views * (RPM/1000) = 1000 * RPM
    expect(r.low.monthly).toBeCloseTo(1000 * us.baseRpm.low * other.rpmMultiplier * mult, 5);
    expect(r.expected.monthly).toBeCloseTo(1000 * us.baseRpm.expected * other.rpmMultiplier * mult, 5);
    expect(r.high.monthly).toBeCloseTo(1000 * us.baseRpm.high * other.rpmMultiplier * mult, 5);
  });

  it("respects a custom RPM override", () => {
    const r = calculateEarnings({ ...BASE, rpm: 10 });
    // With 1,000,000 monetized views @ RPM 10 → $10,000 expected
    expect(r.expected.monthly).toBeCloseTo(10_000, 5);
    // Low/high bands hold
    expect(r.low.monthly).toBeLessThanOrEqual(r.expected.monthly);
    expect(r.high.monthly).toBeGreaterThanOrEqual(r.expected.monthly);
  });

  it("applies monetized percentage exactly once", () => {
    const rFull = calculateEarnings({ ...BASE, monetizedPercentage: 100, rpm: 5 });
    const rHalf = calculateEarnings({ ...BASE, monetizedPercentage: 50, rpm: 5 });
    expect(rHalf.expected.monthly).toBeCloseTo(rFull.expected.monthly / 2, 5);
  });

  it("zero monetized percentage produces zero ad revenue", () => {
    const r = calculateEarnings({ ...BASE, monetizedPercentage: 0, rpm: 5 });
    expect(r.expected.monthly).toBe(0);
    expect(r.monthlyAdRevenue.monthly).toBe(0);
  });

  it("adds sponsorship + affiliate + membership on top of ad revenue", () => {
    const r = calculateEarnings({
      ...BASE,
      rpm: 5,
      sponsorship: 1000,
      affiliate: 500,
      membership: 250,
    });
    const ad = 1_000_000 * 5 / 1000;
    expect(r.expected.monthly).toBeCloseTo(ad + 1000 + 500 + 250, 5);
    expect(r.extras.sponsorship).toBe(1000);
    expect(r.extras.affiliate).toBe(500);
    expect(r.extras.membership).toBe(250);
  });

  it("converts to the target currency", () => {
    const usd = calculateEarnings({ ...BASE, rpm: 5, currency: "USD" });
    const eur = calculateEarnings({ ...BASE, rpm: 5, currency: "EUR" });
    // EUR usdRate is < 1, so EUR total should be lower than USD total
    expect(eur.expected.monthly).toBeLessThan(usd.expected.monthly);
    expect(eur.currency).toBe("EUR");
  });

  it("shorts content produces significantly lower revenue than long-form", () => {
    const long = calculateEarnings({ ...BASE, contentType: "long" });
    const shorts = calculateEarnings({ ...BASE, contentType: "shorts" });
    expect(shorts.expected.monthly).toBeLessThan(long.expected.monthly / 5);
  });

  it("mixed content sits between shorts and long-form", () => {
    const long = calculateEarnings({ ...BASE, contentType: "long" });
    const mixed = calculateEarnings({ ...BASE, contentType: "mixed" });
    const shorts = calculateEarnings({ ...BASE, contentType: "shorts" });
    expect(mixed.expected.monthly).toBeGreaterThan(shorts.expected.monthly);
    expect(mixed.expected.monthly).toBeLessThan(long.expected.monthly);
  });

  it("zero monthly views yields zero ad revenue", () => {
    const r = calculateEarnings({ ...BASE, monthlyViews: 0, rpm: 5 });
    expect(r.expected.monthly).toBe(0);
    expect(r.low.monthly).toBe(0);
    expect(r.high.monthly).toBe(0);
  });

  it("clamps negative monthly views to zero", () => {
    const r = calculateEarnings({ ...BASE, monthlyViews: -1000, rpm: 5 });
    expect(r.expected.monthly).toBe(0);
  });

  it("handles NaN monthly views without producing NaN output", () => {
    const r = calculateEarnings({
      ...BASE,
      monthlyViews: Number.NaN,
      rpm: 5,
    });
    expect(Number.isFinite(r.expected.monthly)).toBe(true);
  });

  it("handles Infinity monthly views by producing Infinity, not NaN", () => {
    const r = calculateEarnings({
      ...BASE,
      monthlyViews: Number.POSITIVE_INFINITY,
      rpm: 5,
    });
    // We accept Infinity here; what we must NOT produce is NaN.
    expect(Number.isNaN(r.expected.monthly)).toBe(false);
  });

  it("handles very large view counts", () => {
    const r = calculateEarnings({
      ...BASE,
      monthlyViews: 1e11,
      rpm: 5,
    });
    expect(Number.isFinite(r.expected.monthly)).toBe(true);
    expect(r.expected.monthly).toBeGreaterThan(0);
  });

  it("ignores an RPM override of 0 and falls back to auto", () => {
    const auto = calculateEarnings({ ...BASE });
    const zero = calculateEarnings({ ...BASE, rpm: 0 });
    expect(zero.expected.monthly).toBeCloseTo(auto.expected.monthly, 5);
  });

  it("estimate ordering: low <= expected <= high on every band", () => {
    const r = calculateEarnings({
      ...BASE,
      rpm: 5,
      sponsorship: 100,
      affiliate: 50,
      membership: 25,
    });
    for (const key of ["daily", "weekly", "monthly", "annual"] as const) {
      expect(r.low[key]).toBeLessThanOrEqual(r.expected[key]);
      expect(r.expected[key]).toBeLessThanOrEqual(r.high[key]);
    }
  });

  it("daily * 30 approximately equals monthly", () => {
    const r = calculateEarnings({ ...BASE, rpm: 5 });
    expect(r.expected.daily * 30).toBeCloseTo(r.expected.monthly, 5);
  });

  it("weekly * (30/7) approximately equals monthly", () => {
    const r = calculateEarnings({ ...BASE, rpm: 5 });
    expect(r.expected.weekly * (30 / 7)).toBeCloseTo(r.expected.monthly, 5);
  });

  it("annual == 12 * monthly", () => {
    const r = calculateEarnings({ ...BASE, rpm: 5 });
    expect(r.expected.annual).toBeCloseTo(r.expected.monthly * 12, 5);
  });
});
