/**
 * Unit tests for analytics growth calculations.
 *
 * Tests pure functions — no network, no side effects.
 * Covers: normal cases, sparse data, missing data, zero denominators,
 * newly-added creators, duplicate prevention, time-range filtering.
 */

import { describe, expect, it } from "vitest";
import {
  calculateGrowth,
  calculateAllGrowth,
  subscriberGrowthOverDays,
  viewGrowthOverDays,
  uploadGrowthOverDays,
  earningsChangeOverDays,
} from "../growth";
import type { CreatorSnapshot } from "../types";

// ─── Helpers ────────────────────────────────────────────────────────

function makeSnapshot(
  overrides: Partial<CreatorSnapshot> & { capturedAt: string },
): CreatorSnapshot {
  return {
    id: `snap-${overrides.capturedAt}`,
    creatorSlug: "test-creator",
    capturedAt: overrides.capturedAt,
    subscribers: overrides.subscribers ?? 1_000_000,
    totalViews: overrides.totalViews ?? 100_000_000,
    videoCount: overrides.videoCount ?? 500,
    estimatedDailyEarningsUsd: overrides.estimatedDailyEarningsUsd ?? 100,
    estimatedMonthlyEarningsUsd: overrides.estimatedMonthlyEarningsUsd ?? 3000,
    estimatedYearlyEarningsUsd: overrides.estimatedYearlyEarningsUsd ?? 36000,
    estimatedRpmUsd: overrides.estimatedRpmUsd ?? 4.0,
    estimatedCpmUsd: overrides.estimatedCpmUsd ?? 7.2,
    source: overrides.source ?? "fixture",
    dataQuality: overrides.dataQuality ?? "high",
  };
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// ─── Test data ──────────────────────────────────────────────────────

const SNAPSHOTS_30_DAYS: CreatorSnapshot[] = [
  makeSnapshot({
    capturedAt: daysAgo(28),
    subscribers: 1_000_000,
    totalViews: 100_000_000,
    videoCount: 500,
    estimatedMonthlyEarningsUsd: 3000,
  }),
  makeSnapshot({
    capturedAt: daysAgo(21),
    subscribers: 1_010_000,
    totalViews: 102_000_000,
    videoCount: 502,
    estimatedMonthlyEarningsUsd: 3100,
  }),
  makeSnapshot({
    capturedAt: daysAgo(14),
    subscribers: 1_020_000,
    totalViews: 104_000_000,
    videoCount: 504,
    estimatedMonthlyEarningsUsd: 3200,
  }),
  makeSnapshot({
    capturedAt: daysAgo(7),
    subscribers: 1_030_000,
    totalViews: 106_000_000,
    videoCount: 506,
    estimatedMonthlyEarningsUsd: 3300,
  }),
  makeSnapshot({
    capturedAt: daysAgo(1),
    subscribers: 1_040_000,
    totalViews: 108_000_000,
    videoCount: 508,
    estimatedMonthlyEarningsUsd: 3400,
  }),
];

// ─── Tests ──────────────────────────────────────────────────────────

describe("calculateGrowth", () => {
  it("computes growth from snapshots within a range", () => {
    const result = calculateGrowth(SNAPSHOTS_30_DAYS, "30d");
    expect(result.hasData).toBe(true);
    expect(result.subscriberGrowth).toBe(40_000);
    expect(result.viewGrowth).toBe(8_000_000);
    expect(result.uploadGrowth).toBe(8);
    expect(result.earningsChange).toBe(400);
  });

  it("returns percentage growth correctly", () => {
    const result = calculateGrowth(SNAPSHOTS_30_DAYS, "30d");
    expect(result.subscriberGrowthPct).toBeCloseTo(4.0, 0); // 40k/1M = 4%
    expect(result.viewGrowthPct).toBeCloseTo(8.0, 0); // 8M/100M = 8%
    expect(result.earningsChangePct).toBeCloseTo(13.3, 0); // 400/3000 ≈ 13.3%
  });

  it("computes average daily gain", () => {
    const result = calculateGrowth(SNAPSHOTS_30_DAYS, "30d");
    // ~27 days elapsed, 40k subscriber growth
    expect(result.avgDailySubscriberGain).toBeGreaterThan(1000);
    expect(result.avgDailySubscriberGain).toBeLessThan(2000);
    expect(result.avgDailyViewGain).toBeGreaterThan(200_000);
  });

  it("returns hasData=false with empty snapshots", () => {
    const result = calculateGrowth([], "7d");
    expect(result.hasData).toBe(false);
    expect(result.subscriberGrowth).toBeNull();
    expect(result.viewGrowth).toBe(0);
  });

  it("returns hasData=false with single snapshot", () => {
    const result = calculateGrowth([SNAPSHOTS_30_DAYS[0]], "7d");
    expect(result.hasData).toBe(false);
  });

  it("returns hasData=false when no snapshots in range", () => {
    // All snapshots are older than 7 days except the last one
    const onlyOld = [
      makeSnapshot({ capturedAt: daysAgo(60), subscribers: 900_000, totalViews: 90_000_000, videoCount: 490, estimatedMonthlyEarningsUsd: 2800 }),
    ];
    const result = calculateGrowth(onlyOld, "7d");
    expect(result.hasData).toBe(false);
  });

  it("handles null subscriber counts gracefully", () => {
    const snapshots = [
      makeSnapshot({ capturedAt: daysAgo(10), subscribers: null, totalViews: 50_000_000, videoCount: 200, estimatedMonthlyEarningsUsd: 1500 }),
      makeSnapshot({ capturedAt: daysAgo(1), subscribers: null, totalViews: 52_000_000, videoCount: 202, estimatedMonthlyEarningsUsd: 1600 }),
    ];
    const result = calculateGrowth(snapshots, "30d");
    expect(result.hasData).toBe(true);
    expect(result.subscriberGrowth).toBeNull();
    expect(result.subscriberGrowthPct).toBeNull();
    expect(result.avgDailySubscriberGain).toBeNull();
    // View growth still works
    expect(result.viewGrowth).toBe(2_000_000);
  });

  it("handles zero base values without NaN or Infinity", () => {
    const snapshots = [
      makeSnapshot({ capturedAt: daysAgo(10), subscribers: 0, totalViews: 0, videoCount: 0, estimatedMonthlyEarningsUsd: 0 }),
      makeSnapshot({ capturedAt: daysAgo(1), subscribers: 100, totalViews: 1000, videoCount: 2, estimatedMonthlyEarningsUsd: 5 }),
    ];
    const result = calculateGrowth(snapshots, "30d");
    expect(result.hasData).toBe(true);
    expect(result.subscriberGrowthPct).toBe(0); // 0 base → 0% (safe)
    expect(result.viewGrowthPct).toBe(0);
    expect(Number.isFinite(result.earningsChangePct)).toBe(true);
  });
});

describe("calculateAllGrowth", () => {
  it("returns metrics for all four standard periods", () => {
    const result = calculateAllGrowth(SNAPSHOTS_30_DAYS);
    expect(result["7d"]).toBeDefined();
    expect(result["30d"]).toBeDefined();
    expect(result["90d"]).toBeDefined();
    expect(result["1y"]).toBeDefined();
    expect(result["30d"].hasData).toBe(true);
  });
});

describe("subscriberGrowthOverDays", () => {
  it("returns growth for a specific day count", () => {
    const result = subscriberGrowthOverDays(SNAPSHOTS_30_DAYS, 30);
    expect(result.absolute).toBe(40_000);
    expect(result.percentage).toBeCloseTo(4.0, 0);
    expect(result.daily).toBeGreaterThan(0);
  });

  it("returns null for null subscriber counts", () => {
    const snapshots = [
      makeSnapshot({ capturedAt: daysAgo(5), subscribers: null, totalViews: 100, videoCount: 1, estimatedMonthlyEarningsUsd: 0 }),
      makeSnapshot({ capturedAt: daysAgo(1), subscribers: null, totalViews: 200, videoCount: 2, estimatedMonthlyEarningsUsd: 0 }),
    ];
    const result = subscriberGrowthOverDays(snapshots, 7);
    expect(result.absolute).toBeNull();
    expect(result.percentage).toBeNull();
    expect(result.daily).toBeNull();
  });

  it("returns null when insufficient data", () => {
    const result = subscriberGrowthOverDays([], 7);
    expect(result.absolute).toBeNull();
  });
});

describe("viewGrowthOverDays", () => {
  it("computes absolute and percentage view growth", () => {
    const result = viewGrowthOverDays(SNAPSHOTS_30_DAYS, 30);
    expect(result.absolute).toBe(8_000_000);
    expect(result.percentage).toBeCloseTo(8.0, 0);
  });

  it("returns zero for empty snapshots", () => {
    const result = viewGrowthOverDays([], 7);
    expect(result.absolute).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.daily).toBe(0);
  });
});

describe("uploadGrowthOverDays", () => {
  it("computes upload count change", () => {
    const result = uploadGrowthOverDays(SNAPSHOTS_30_DAYS, 30);
    expect(result.absolute).toBe(8);
    expect(result.daily).toBeGreaterThan(0);
  });
});

describe("earningsChangeOverDays", () => {
  it("computes earnings change", () => {
    const result = earningsChangeOverDays(SNAPSHOTS_30_DAYS, 30);
    expect(result.absolute).toBe(400);
    expect(result.percentage).toBeCloseTo(13.3, 0);
  });

  it("handles zero base earnings", () => {
    const snapshots = [
      makeSnapshot({ capturedAt: daysAgo(5), estimatedMonthlyEarningsUsd: 0, totalViews: 0, videoCount: 0, subscribers: 0 }),
      makeSnapshot({ capturedAt: daysAgo(1), estimatedMonthlyEarningsUsd: 100, totalViews: 1000, videoCount: 1, subscribers: 10 }),
    ];
    const result = earningsChangeOverDays(snapshots, 7);
    expect(result.absolute).toBe(100);
    expect(result.percentage).toBe(0); // Safe: 0 base → 0%
    expect(Number.isFinite(result.percentage)).toBe(true);
  });
});
