import { describe, expect, it } from "vitest";

import { INSTAGRAM_DEFAULT_STATE } from "../state";
import {
  calculateInstagramEarnings,
  type InstagramCalculatorInput,
} from "../earnings";

/**
 * Test scenarios cover:
 *   • Ordering invariants (low ≤ expected ≤ high)
 *   • Never NaN under adversarial inputs
 *   • Sensible zero behaviour
 *   • Multipliers actually change the output
 *   • Currency conversion
 *   • Breakdown sums to 100% (across positive lines)
 *   • Confidence heuristic responds to input completeness
 */

const baseline: InstagramCalculatorInput = {
  followers: 100_000,
  avgPostReach: 15_000,
  avgReelViews: 40_000,
  avgStoryViews: 5_000,
  engagementRate: 3,
  country: "US",
  niche: "lifestyle",
  feedPostsPerMonth: 10,
  reelsPerMonth: 10,
  storiesPerMonth: 20,
  enableSponsoredPosts: true,
  enableSponsoredReels: true,
  enableSponsoredStories: true,
  enableAffiliate: true,
  enableSubscriptions: false,
  currency: "USD",
};

describe("calculateInstagramEarnings — invariants", () => {
  it("emits low ≤ expected ≤ high", () => {
    const r = calculateInstagramEarnings(baseline);
    expect(r.low.monthly).toBeLessThanOrEqual(r.expected.monthly);
    expect(r.expected.monthly).toBeLessThanOrEqual(r.high.monthly);
    expect(r.low.yearly).toBeLessThanOrEqual(r.expected.yearly);
    expect(r.expected.yearly).toBeLessThanOrEqual(r.high.yearly);
  });

  it("never produces NaN under NaN / infinity / negative inputs", () => {
    const r = calculateInstagramEarnings({
      ...baseline,
      followers: Number.NaN,
      avgPostReach: Number.POSITIVE_INFINITY,
      avgReelViews: -1_000_000,
      avgStoryViews: Number.NEGATIVE_INFINITY,
      engagementRate: Number.NaN,
      feedPostsPerMonth: Number.NaN,
      reelsPerMonth: Number.NaN,
      storiesPerMonth: Number.NaN,
      affiliateAverageOrderValueUsd: Number.NaN,
    });
    expect(Number.isFinite(r.low.monthly)).toBe(true);
    expect(Number.isFinite(r.expected.monthly)).toBe(true);
    expect(Number.isFinite(r.high.monthly)).toBe(true);
    expect(Number.isFinite(r.averageBrandDealValue)).toBe(true);
    expect(Number.isFinite(r.revenuePerThousandReach)).toBe(true);
  });

  it("returns zero everywhere for zero primary inputs", () => {
    const r = calculateInstagramEarnings({
      ...baseline,
      followers: 0,
      avgPostReach: 0,
      avgReelViews: 0,
      avgStoryViews: 0,
      engagementRate: 0,
    });
    expect(r.expected.monthly).toBe(0);
    expect(r.expected.yearly).toBe(0);
    expect(r.low.monthly).toBe(0);
    expect(r.high.monthly).toBe(0);
    expect(r.largestSource).toBeNull();
  });

  it("breakdown shares (of positive lines) sum to 1", () => {
    const r = calculateInstagramEarnings({
      ...baseline,
      enableSubscriptions: true,
      paidSubscribers: 200,
      subscriptionPriceUsd: 5,
    });
    const positives = r.breakdown.filter((l) => l.amount > 0);
    const total = positives.reduce((sum, l) => sum + l.share, 0);
    expect(total).toBeGreaterThan(0.99);
    expect(total).toBeLessThan(1.01);
  });
});

describe("calculateInstagramEarnings — sensitivity", () => {
  it("a higher-paying niche produces higher expected earnings", () => {
    const lifestyle = calculateInstagramEarnings(baseline);
    const finance = calculateInstagramEarnings({ ...baseline, niche: "finance" });
    expect(finance.expected.monthly).toBeGreaterThan(lifestyle.expected.monthly);
  });

  it("a lower-paying market produces lower expected earnings", () => {
    const us = calculateInstagramEarnings(baseline);
    const india = calculateInstagramEarnings({ ...baseline, country: "IN" });
    expect(india.expected.monthly).toBeLessThan(us.expected.monthly);
  });

  it("higher engagement produces higher earnings", () => {
    const low = calculateInstagramEarnings({ ...baseline, engagementRate: 1 });
    const high = calculateInstagramEarnings({ ...baseline, engagementRate: 8 });
    expect(high.expected.monthly).toBeGreaterThan(low.expected.monthly);
  });

  it("disabling all sponsored streams zeroes out sponsored breakdown lines", () => {
    const r = calculateInstagramEarnings({
      ...baseline,
      enableSponsoredPosts: false,
      enableSponsoredReels: false,
      enableSponsoredStories: false,
      enableAffiliate: false,
    });
    expect(r.expected.monthly).toBe(0);
    for (const line of r.breakdown) {
      expect(line.amount).toBe(0);
    }
  });

  it("a custom reel rate overrides the derived rate", () => {
    const derived = calculateInstagramEarnings({
      ...baseline,
      enableSponsoredPosts: false,
      enableSponsoredStories: false,
      enableAffiliate: false,
    });
    const overridden = calculateInstagramEarnings({
      ...baseline,
      enableSponsoredPosts: false,
      enableSponsoredStories: false,
      enableAffiliate: false,
      customReelRateUsd: 100, // way above default
    });
    expect(overridden.expected.monthly).toBeGreaterThan(derived.expected.monthly);
  });
});

describe("calculateInstagramEarnings — currency", () => {
  it("USD and INR produce different absolute values but same ordering", () => {
    const usd = calculateInstagramEarnings({ ...baseline, currency: "USD" });
    const inr = calculateInstagramEarnings({ ...baseline, currency: "INR" });
    expect(inr.expected.monthly).toBeGreaterThan(usd.expected.monthly);
    expect(inr.low.monthly).toBeLessThanOrEqual(inr.expected.monthly);
    expect(inr.expected.monthly).toBeLessThanOrEqual(inr.high.monthly);
    expect(inr.currency).toBe("INR");
    expect(inr.usdRate).toBeGreaterThan(1); // 1 USD ≈ 83 INR
  });

  it("falls back to USD when currency is unknown", () => {
    const r = calculateInstagramEarnings({ ...baseline, currency: "ZZZ" });
    expect(r.currency).toBe("USD");
  });
});

describe("calculateInstagramEarnings — subscriptions", () => {
  it("subscriptions add flat revenue across all bands", () => {
    const noSubs = calculateInstagramEarnings({
      ...baseline,
      enableSubscriptions: false,
    });
    const withSubs = calculateInstagramEarnings({
      ...baseline,
      enableSubscriptions: true,
      paidSubscribers: 1_000,
      subscriptionPriceUsd: 5,
    });
    // 1000 * 5 = 5000 USD across every band
    expect(withSubs.expected.monthly - noSubs.expected.monthly).toBeCloseTo(5_000, 0);
    expect(withSubs.low.monthly - noSubs.low.monthly).toBeCloseTo(5_000, 0);
    expect(withSubs.high.monthly - noSubs.high.monthly).toBeCloseTo(5_000, 0);
  });
});

describe("calculateInstagramEarnings — confidence", () => {
  it("returns 'low' when primary inputs are missing", () => {
    const r = calculateInstagramEarnings({
      ...baseline,
      followers: 0,
    });
    expect(r.confidence).toBe("low");
  });

  it("returns 'high' for plausible full inputs", () => {
    const r = calculateInstagramEarnings(baseline);
    expect(r.confidence).toBe("high");
  });

  it("returns 'moderate' for suspicious engagement", () => {
    const r = calculateInstagramEarnings({
      ...baseline,
      engagementRate: 40, // way too high for a 100k account
    });
    expect(r.confidence).toBe("moderate");
  });
});

describe("calculateInstagramEarnings — using default state", () => {
  it("produces a sensible positive estimate", () => {
    const r = calculateInstagramEarnings(INSTAGRAM_DEFAULT_STATE);
    expect(r.expected.monthly).toBeGreaterThan(0);
    expect(r.expected.yearly).toBeGreaterThan(r.expected.monthly);
    expect(r.averageBrandDealValue).toBeGreaterThan(0);
    expect(r.revenuePerThousandReach).toBeGreaterThan(0);
    expect(r.largestSource).not.toBeNull();
  });
});
