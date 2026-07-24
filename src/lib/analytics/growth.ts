/**
 * Growth Calculation Functions
 *
 * Pure, reusable functions for computing creator growth metrics
 * from historical snapshots. Every function:
 *
 *   - Is a pure function (no side effects)
 *   - Handles missing data gracefully (returns null/0)
 *   - Handles zero denominators
 *   - Handles sparse history
 *   - Never fabricates missing data points
 */

import type { CreatorSnapshot, GrowthMetrics, TimeRange } from "./types";
import { rangeToStartDate } from "./storage";

// ─── Core Growth Calculation ────────────────────────────────────────

/**
 * Calculate growth metrics between the first and last snapshot
 * within a given time range.
 *
 * If fewer than 2 data points exist for the range, returns a
 * GrowthMetrics object with hasData=false and all values at 0/null.
 */
export function calculateGrowth(
  snapshots: CreatorSnapshot[],
  range: TimeRange,
): GrowthMetrics {
  const empty: GrowthMetrics = {
    period: range,
    subscriberGrowth: null,
    subscriberGrowthPct: null,
    viewGrowth: 0,
    viewGrowthPct: 0,
    uploadGrowth: 0,
    avgDailySubscriberGain: null,
    avgDailyViewGain: 0,
    earningsChange: 0,
    earningsChangePct: 0,
    hasData: false,
  };

  if (snapshots.length < 2) return empty;

  const startDate = rangeToStartDate(range);
  const startMs = startDate.getTime();

  // Filter to range
  const inRange = snapshots.filter(
    (s) => new Date(s.capturedAt).getTime() >= startMs,
  );

  if (inRange.length < 2) return empty;

  const oldest = inRange[0];
  const newest = inRange[inRange.length - 1];

  // Days between the two points
  const msElapsed =
    new Date(newest.capturedAt).getTime() - new Date(oldest.capturedAt).getTime();
  const daysElapsed = Math.max(1, msElapsed / (24 * 60 * 60 * 1000));

  // Subscriber growth
  let subscriberGrowth: number | null = null;
  let subscriberGrowthPct: number | null = null;
  let avgDailySubscriberGain: number | null = null;

  if (oldest.subscribers !== null && newest.subscribers !== null) {
    subscriberGrowth = newest.subscribers - oldest.subscribers;
    subscriberGrowthPct = safePercentage(subscriberGrowth, oldest.subscribers);
    avgDailySubscriberGain = subscriberGrowth / daysElapsed;
  }

  // View growth
  const viewGrowth = newest.totalViews - oldest.totalViews;
  const viewGrowthPct = safePercentage(viewGrowth, oldest.totalViews);
  const avgDailyViewGain = viewGrowth / daysElapsed;

  // Upload growth
  const uploadGrowth = newest.videoCount - oldest.videoCount;

  // Earnings change
  const earningsChange =
    newest.estimatedMonthlyEarningsUsd - oldest.estimatedMonthlyEarningsUsd;
  const earningsChangePct = safePercentage(
    earningsChange,
    oldest.estimatedMonthlyEarningsUsd,
  );

  return {
    period: range,
    subscriberGrowth,
    subscriberGrowthPct,
    viewGrowth,
    viewGrowthPct,
    uploadGrowth,
    avgDailySubscriberGain,
    avgDailyViewGain,
    earningsChange,
    earningsChangePct,
    hasData: true,
  };
}

/**
 * Calculate growth for all standard time ranges.
 */
export function calculateAllGrowth(
  snapshots: CreatorSnapshot[],
): Record<"7d" | "30d" | "90d" | "1y", GrowthMetrics> {
  return {
    "7d": calculateGrowth(snapshots, "7d"),
    "30d": calculateGrowth(snapshots, "30d"),
    "90d": calculateGrowth(snapshots, "90d"),
    "1y": calculateGrowth(snapshots, "1y"),
  };
}

// ─── Specific Growth Functions ──────────────────────────────────────

/**
 * Subscriber growth over a specific number of days.
 */
export function subscriberGrowthOverDays(
  snapshots: CreatorSnapshot[],
  days: number,
): { absolute: number | null; percentage: number | null; daily: number | null } {
  const range = findRangeSnapshots(snapshots, days);
  if (!range) return { absolute: null, percentage: null, daily: null };

  const { oldest, newest, daysElapsed } = range;
  if (oldest.subscribers === null || newest.subscribers === null) {
    return { absolute: null, percentage: null, daily: null };
  }

  const absolute = newest.subscribers - oldest.subscribers;
  return {
    absolute,
    percentage: safePercentage(absolute, oldest.subscribers),
    daily: absolute / daysElapsed,
  };
}

/**
 * View growth over a specific number of days.
 */
export function viewGrowthOverDays(
  snapshots: CreatorSnapshot[],
  days: number,
): { absolute: number; percentage: number; daily: number } {
  const range = findRangeSnapshots(snapshots, days);
  if (!range) return { absolute: 0, percentage: 0, daily: 0 };

  const { oldest, newest, daysElapsed } = range;
  const absolute = newest.totalViews - oldest.totalViews;
  return {
    absolute,
    percentage: safePercentage(absolute, oldest.totalViews),
    daily: absolute / daysElapsed,
  };
}

/**
 * Upload frequency (videos added per period).
 */
export function uploadGrowthOverDays(
  snapshots: CreatorSnapshot[],
  days: number,
): { absolute: number; daily: number } {
  const range = findRangeSnapshots(snapshots, days);
  if (!range) return { absolute: 0, daily: 0 };

  const { oldest, newest, daysElapsed } = range;
  const absolute = newest.videoCount - oldest.videoCount;
  return { absolute, daily: absolute / daysElapsed };
}

/**
 * Earnings change over a specific number of days.
 */
export function earningsChangeOverDays(
  snapshots: CreatorSnapshot[],
  days: number,
): { absolute: number; percentage: number } {
  const range = findRangeSnapshots(snapshots, days);
  if (!range) return { absolute: 0, percentage: 0 };

  const { oldest, newest } = range;
  const absolute =
    newest.estimatedMonthlyEarningsUsd - oldest.estimatedMonthlyEarningsUsd;
  return {
    absolute,
    percentage: safePercentage(absolute, oldest.estimatedMonthlyEarningsUsd),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Find the oldest and newest snapshots within a day range.
 * Returns null if fewer than 2 points exist.
 */
function findRangeSnapshots(
  snapshots: CreatorSnapshot[],
  days: number,
): { oldest: CreatorSnapshot; newest: CreatorSnapshot; daysElapsed: number } | null {
  if (snapshots.length < 2) return null;

  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  const inRange = snapshots.filter(
    (s) => new Date(s.capturedAt).getTime() >= cutoff,
  );

  if (inRange.length < 2) return null;

  const oldest = inRange[0];
  const newest = inRange[inRange.length - 1];
  const msElapsed =
    new Date(newest.capturedAt).getTime() - new Date(oldest.capturedAt).getTime();
  const daysElapsed = Math.max(1, msElapsed / (24 * 60 * 60 * 1000));

  return { oldest, newest, daysElapsed };
}

/**
 * Safely compute percentage change avoiding division by zero.
 * Returns 0 when the base value is 0.
 */
function safePercentage(change: number, base: number): number {
  if (base === 0) return 0;
  return (change / base) * 100;
}
