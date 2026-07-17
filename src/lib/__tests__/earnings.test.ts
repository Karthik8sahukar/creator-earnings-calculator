import { describe, expect, it } from "vitest";

import { calculateEarnings } from "../earnings";
import {
  BAND_FACTORS,
  MIXED_LONG_SHARE,
  MIXED_SHORTS_SHARE,
  findCountry,
  findNiche,
} from "../rpmData";
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

describe("calculateEarnings — core ad revenue math (long-form)", () => {
  it("uses country × niche RPM (no content-type multiplier for long-form)", () => {
    const r = calculateEarnings(BASE);
    const us = findCountry("US");
    const other = findNiche("other");
    // 1,000,000 views × RPM / 1000 = 1000 × RPM
    expect(r.low.monthly).toBeCloseTo(1000 * us.baseRpm.low * other.rpmMultiplier, 5);
    expect(r.expected.monthly).toBeCloseTo(
      1000 * us.baseRpm.expected * other.rpmMultiplier,
      5,
    );
    expect(r.high.monthly).toBeCloseTo(
      1000 * us.baseRpm.high * other.rpmMultiplier,
      5,
    );
  });

  it("respects a custom RPM override and applies the configured band factors", () => {
    const r = calculateEarnings({ ...BASE, rpm: 10 });
    // 1,000,000 monetized views @ RPM 10 → $10,000 expected
    expect(r.expected.monthly).toBeCloseTo(10_000, 5);
    expect(r.low.monthly).toBeCloseTo(10_000 * BAND_FACTORS.conservative, 5);
    expect(r.high.monthly).toBeCloseTo(10_000 * BAND_FACTORS.optimistic, 5);
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
    const ad = (1_000_000 * 5) / 1000;
    expect(r.expected.monthly).toBeCloseTo(ad + 1000 + 500 + 250, 5);
    expect(r.extras.sponsorship).toBe(1000);
    expect(r.extras.affiliate).toBe(500);
    expect(r.extras.membership).toBe(250);
  });

  it("converts to the target currency", () => {
    const usd = calculateEarnings({ ...BASE, rpm: 5, currency: "USD" });
    const eur = calculateEarnings({ ...BASE, rpm: 5, currency: "EUR" });
    expect(eur.expected.monthly).toBeLessThan(usd.expected.monthly);
    expect(eur.currency).toBe("EUR");
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
    const r = calculateEarnings({ ...BASE, monthlyViews: Number.NaN, rpm: 5 });
    expect(Number.isFinite(r.expected.monthly)).toBe(true);
  });

  it("handles Infinity monthly views by producing Infinity, not NaN", () => {
    const r = calculateEarnings({
      ...BASE,
      monthlyViews: Number.POSITIVE_INFINITY,
      rpm: 5,
    });
    expect(Number.isNaN(r.expected.monthly)).toBe(false);
  });

  it("handles very large view counts without overflow", () => {
    const r = calculateEarnings({ ...BASE, monthlyViews: 1e11, rpm: 5 });
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

  it("daily × 30 ≈ monthly", () => {
    const r = calculateEarnings({ ...BASE, rpm: 5 });
    expect(r.expected.daily * 30).toBeCloseTo(r.expected.monthly, 5);
  });

  it("weekly × (30/7) ≈ monthly", () => {
    const r = calculateEarnings({ ...BASE, rpm: 5 });
    expect(r.expected.weekly * (30 / 7)).toBeCloseTo(r.expected.monthly, 5);
  });

  it("annual = 12 × monthly", () => {
    const r = calculateEarnings({ ...BASE, rpm: 5 });
    expect(r.expected.annual).toBeCloseTo(r.expected.monthly * 12, 5);
  });
});

describe("calculateEarnings — Shorts have their own path (not a long-form multiplier)", () => {
  it("uses country.shortsRpm × niche.shortsRpmMultiplier for shorts", () => {
    const r = calculateEarnings({ ...BASE, contentType: "shorts" });
    const us = findCountry("US");
    const other = findNiche("other");
    expect(r.expected.monthly).toBeCloseTo(
      (1_000_000 / 1000) * us.shortsRpm.expected * other.shortsRpmMultiplier,
      5,
    );
  });

  it("shorts revenue is roughly an order of magnitude below long-form for the same channel", () => {
    const long = calculateEarnings({ ...BASE, contentType: "long" });
    const shorts = calculateEarnings({ ...BASE, contentType: "shorts" });
    expect(shorts.expected.monthly).toBeLessThan(long.expected.monthly / 20);
    expect(shorts.expected.monthly).toBeGreaterThan(0);
  });

  it("mixed content sits between shorts and long-form", () => {
    const long = calculateEarnings({ ...BASE, contentType: "long" });
    const mixed = calculateEarnings({ ...BASE, contentType: "mixed" });
    const shorts = calculateEarnings({ ...BASE, contentType: "shorts" });
    expect(mixed.expected.monthly).toBeGreaterThan(shorts.expected.monthly);
    expect(mixed.expected.monthly).toBeLessThan(long.expected.monthly);
  });

  it("mixed content is a weighted blend of long and shorts, not a fixed factor", () => {
    const long = calculateEarnings({ ...BASE, contentType: "long" });
    const shorts = calculateEarnings({ ...BASE, contentType: "shorts" });
    const mixed = calculateEarnings({ ...BASE, contentType: "mixed" });
    // With defaults MIXED_LONG_SHARE = 0.6, MIXED_SHORTS_SHARE = 0.4
    // the blended expected should equal 0.6 × long + 0.4 × shorts.
    const blended =
      long.expected.monthly * MIXED_LONG_SHARE +
      shorts.expected.monthly * MIXED_SHORTS_SHARE;
    expect(mixed.expected.monthly).toBeCloseTo(blended, 5);
  });

  it("a US general Shorts channel at 1M monthly views earns tens of dollars, not thousands", () => {
    // Sanity check anchored to real-world creator reports:
    // 1M US-audience Shorts views typically ≈ $30–$100/mo.
    const r = calculateEarnings({ ...BASE, contentType: "shorts" });
    expect(r.expected.monthly).toBeGreaterThan(20);
    expect(r.expected.monthly).toBeLessThan(200);
  });
});

describe("calculateEarnings — niche premium ordering", () => {
  const at = (niche: string, contentType: "long" | "shorts" = "long") =>
    calculateEarnings({ ...BASE, niche, contentType }).expected.monthly;

  it("finance > business > tech > general > gaming > music > kids for long-form", () => {
    expect(at("finance")).toBeGreaterThan(at("business"));
    expect(at("business")).toBeGreaterThan(at("tech"));
    expect(at("tech")).toBeGreaterThan(at("other"));
    expect(at("other")).toBeGreaterThan(at("gaming"));
    expect(at("gaming")).toBeGreaterThan(at("music"));
    expect(at("music")).toBeGreaterThan(at("kids"));
  });

  it("news is bumped above the previous 0.7× — now closer to general", () => {
    const news = findNiche("news");
    // Regression guard: don't drift back to <= 0.75.
    expect(news.rpmMultiplier).toBeGreaterThan(0.85);
    expect(news.rpmMultiplier).toBeLessThanOrEqual(1.0);
  });

  it("lifestyle is present as a distinct niche with a plausible multiplier", () => {
    const lifestyle = findNiche("lifestyle");
    expect(lifestyle.id).toBe("lifestyle");
    expect(lifestyle.rpmMultiplier).toBeGreaterThan(0.5);
    expect(lifestyle.rpmMultiplier).toBeLessThan(1.5);
  });

  it("business is distinct from finance and priced between finance and general", () => {
    const finance = findNiche("finance");
    const business = findNiche("business");
    const other = findNiche("other");
    expect(business.id).toBe("business");
    expect(business.rpmMultiplier).toBeLessThan(finance.rpmMultiplier);
    expect(business.rpmMultiplier).toBeGreaterThan(other.rpmMultiplier);
  });

  it("Shorts niche premium is compressed vs. long-form", () => {
    // Finance's advantage over "other" should be smaller for shorts
    // than for long-form, because the Shorts revenue pool is less
    // niche-sensitive.
    const finance = findNiche("finance");
    const other = findNiche("other");
    const longRatio = finance.rpmMultiplier / other.rpmMultiplier;
    const shortsRatio = finance.shortsRpmMultiplier / other.shortsRpmMultiplier;
    expect(shortsRatio).toBeLessThan(longRatio);
  });
});

describe("calculateEarnings — geography ordering", () => {
  const at = (country: string) =>
    calculateEarnings({ ...BASE, country }).expected.monthly;

  it("US > GB > IN for the same niche/content", () => {
    expect(at("US")).toBeGreaterThan(at("GB"));
    expect(at("GB")).toBeGreaterThan(at("IN"));
  });

  it("The 'OTHER' fallback sits between top tiers and tier-3", () => {
    const other = at("OTHER");
    expect(other).toBeLessThan(at("US"));
    expect(other).toBeGreaterThan(at("IN"));
  });
});

describe("calculateEarnings — realistic magnitudes anchored to public reports", () => {
  // These bounds are deliberately wide because real creator earnings
  // vary a lot. Their purpose is to catch a formula regression that
  // e.g. multiplies by CPM instead of RPM (which would give ~2× the
  // true value) or drops the /1000 step.

  it("US Finance long-form @ 1M views: ~$8k–$20k/mo expected", () => {
    const r = calculateEarnings({
      ...BASE,
      country: "US",
      niche: "finance",
      contentType: "long",
    });
    expect(r.expected.monthly).toBeGreaterThan(8_000);
    expect(r.expected.monthly).toBeLessThan(25_000);
  });

  it("US Tech long-form @ 1M views: ~$6k–$14k/mo expected", () => {
    const r = calculateEarnings({
      ...BASE,
      country: "US",
      niche: "tech",
      contentType: "long",
    });
    expect(r.expected.monthly).toBeGreaterThan(6_000);
    expect(r.expected.monthly).toBeLessThan(18_000);
  });

  it("US Gaming long-form @ 1M views: ~$2k–$6k/mo expected", () => {
    const r = calculateEarnings({
      ...BASE,
      country: "US",
      niche: "gaming",
      contentType: "long",
    });
    expect(r.expected.monthly).toBeGreaterThan(2_000);
    expect(r.expected.monthly).toBeLessThan(8_000);
  });

  it("India General long-form @ 1M views: ~$500–$2k/mo expected", () => {
    const r = calculateEarnings({
      ...BASE,
      country: "IN",
      niche: "other",
      contentType: "long",
    });
    expect(r.expected.monthly).toBeGreaterThan(500);
    expect(r.expected.monthly).toBeLessThan(2_500);
  });

  it("US Music Shorts @ 1M views is a rounding error on the same scale", () => {
    const r = calculateEarnings({
      ...BASE,
      country: "US",
      niche: "music",
      contentType: "shorts",
    });
    // Music Shorts ≈ $0.06 RPM; 1M views ≈ $60/mo.
    expect(r.expected.monthly).toBeGreaterThan(20);
    expect(r.expected.monthly).toBeLessThan(150);
  });
});
