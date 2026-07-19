/**
 * Channel Analyzer — growth heuristic.
 *
 * Given a channel + a performance snapshot + engagement metrics,
 * derive a small handful of growth signals the UI can render:
 *
 *   • uploadFrequency  — uploads per month (rounded to 0.1)
 *   • subsPerVideo     — subscribers ÷ videoCount
 *   • viewsPerSub      — total lifetime views ÷ subscribers
 *   • growthScore      — 0–100 heuristic
 *   • growthLabel      — bucket label derived from the score
 *
 * ─── About the growth score ────────────────────────────────────────
 *
 * This is deliberately a coarse, transparent heuristic — not a
 * black-box model. Every point of the 0–100 score comes from one of
 * four equal-weight signals we CAN observe from public data:
 *
 *   1. Recent output   (0–25pts)  — uploadsLast30Days ÷ 12, capped.
 *      "12 uploads in the past month" is the reference for a channel
 *      publishing ~3 videos a week. Anything at or above that gets a
 *      full 25 points; below it scales linearly.
 *
 *   2. Engagement      (0–25pts)  — engagementRate ÷ 5%, capped.
 *      5% (likes+comments/views) is a strong YouTube engagement rate
 *      per multiple public benchmarks. At or above 5% gives full 25.
 *
 *   3. Reach vs subs   (0–25pts)  — averageRecentViews ÷ (subs × 0.5).
 *      A channel whose average recent video reaches ≥50% of its
 *      subscriber count is finding a wider audience than its own
 *      subscribers — a strong "growth" signal. Below that scales
 *      linearly. Guards against zero subs.
 *
 *   4. Cadence health  (0–25pts)  — uploadsLast30Days ÷ uploadsLast90Days
 *      × 3, capped. If a channel's last 30 days match a third of the
 *      last 90 days (i.e. steady output), the ratio is 1.0 and this
 *      returns the full 25. Below 1.0 signals a slowdown; above 1.0
 *      is capped so a single flurry doesn't dominate.
 *
 * The score is deliberately conservative — a small YouTuber with a
 * strong niche + high engagement can score high, and a large channel
 * with a slow decade can score low. That's the intent: it reflects
 * MOMENTUM, not size.
 *
 * Zero-safe throughout. Missing inputs produce zeros, not NaN.
 */

import type {
  ChannelDetails,
  PerformanceAnalysis,
} from "@/types/youtube";
import type { EngagementMetrics } from "./calculateEngagement";

export type GrowthLabel = "quiet" | "steady" | "growing" | "thriving";

export interface GrowthMetrics {
  /** Uploads per month, inferred from the last-30-day cadence. */
  uploadFrequency: number;
  /** Subscribers ÷ videoCount. `null` when subs are hidden. */
  subsPerVideo: number | null;
  /** Total lifetime views ÷ subscribers. `null` when subs are hidden. */
  viewsPerSub: number | null;
  /** 0–100 momentum score. */
  growthScore: number;
  /** Bucket label derived from `growthScore`. */
  growthLabel: GrowthLabel;
}

const EMPTY_GROWTH: GrowthMetrics = {
  uploadFrequency: 0,
  subsPerVideo: null,
  viewsPerSub: null,
  growthScore: 0,
  growthLabel: "quiet",
};

/** Clamp a numeric value to [min, max]. Zero-safe. */
function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

/** Map a 0–100 score to a bucket label. Thresholds are inclusive of the upper bound. */
export function scoreToLabel(score: number): GrowthLabel {
  const s = clamp(score, 0, 100);
  if (s >= 75) return "thriving";
  if (s >= 50) return "growing";
  if (s >= 25) return "steady";
  return "quiet";
}

export interface GrowthInput {
  channel: ChannelDetails;
  performance: PerformanceAnalysis;
  engagement: EngagementMetrics;
}

export function calculateGrowth(input: GrowthInput): GrowthMetrics {
  const { channel, performance, engagement } = input;

  if (!channel || !performance) return EMPTY_GROWTH;

  // ── Ratios ───────────────────────────────────────────────────────
  const subs =
    !channel.hiddenSubscriberCount && (channel.subscriberCount ?? 0) > 0
      ? (channel.subscriberCount as number)
      : null;

  const subsPerVideo =
    subs !== null && channel.videoCount > 0 ? subs / channel.videoCount : null;

  const viewsPerSub =
    subs !== null && channel.viewCount > 0 ? channel.viewCount / subs : null;

  // ── Upload frequency (per month) ─────────────────────────────────
  //
  // Prefer the last-30-day figure when it's non-zero; otherwise scale
  // the last-90-day figure to a month so we don't drop back to zero
  // for channels that upload monthly.
  const uploadFrequency =
    performance.uploadsLast30Days > 0
      ? performance.uploadsLast30Days
      : Math.round((performance.uploadsLast90Days / 3) * 10) / 10;

  // ── Growth score (0-100) ─────────────────────────────────────────
  //
  // See the module comment for the rationale. Each component is
  // clamped to its own 0-25 window and summed.
  //

  // 1. Recent output
  const outputComponent = clamp(performance.uploadsLast30Days / 12, 0, 1) * 25;

  // 2. Engagement
  const engagementComponent = clamp(engagement.engagementRate / 5, 0, 1) * 25;

  // 3. Reach vs subs — only when we know the sub count.
  //
  // "Half of your subscribers watch each new upload" is a strong
  // reach signal. We scale linearly to that target and cap at 1.
  // If subs are hidden, we neutralize this component to 12.5 (half)
  // rather than 0 — otherwise every hidden-sub channel would look
  // artificially "worse" than a channel with the same public stats.
  const reachComponent =
    subs !== null && subs > 0
      ? clamp(performance.averageRecentViews / (subs * 0.5), 0, 1) * 25
      : 12.5;

  // 4. Cadence health — 30/90 ratio. Neutral at 1.0.
  const cadenceRatio =
    performance.uploadsLast90Days > 0
      ? (performance.uploadsLast30Days / performance.uploadsLast90Days) * 3
      : 0;
  const cadenceComponent = clamp(cadenceRatio, 0, 1) * 25;

  const rawScore =
    outputComponent + engagementComponent + reachComponent + cadenceComponent;
  const growthScore = Math.round(clamp(rawScore, 0, 100));

  return {
    uploadFrequency,
    subsPerVideo,
    viewsPerSub,
    growthScore,
    growthLabel: scoreToLabel(growthScore),
  };
}
