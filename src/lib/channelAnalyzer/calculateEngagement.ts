/**
 * Channel Analyzer — engagement metrics.
 *
 * Given a sample of recent videos, compute:
 *
 *   • averageViews      — mean of viewCount across the sample
 *   • averageLikes      — mean of likeCount across the sample
 *   • averageComments   — mean of commentCount across the sample
 *   • engagementRate    — (avgLikes + avgComments) ÷ avgViews × 100
 *   • sampleSize        — number of videos the metric is based on
 *
 * ─── About the engagement-rate formula ─────────────────────────────
 *
 * The industry-standard YouTube engagement rate is
 *
 *     (likes + comments) ÷ views × 100
 *
 * Some sources add shares — but the YouTube Data API v3 does not
 * expose share counts to non-owners, so we can't include them here.
 * The estimate we produce is thus a lower bound on true engagement,
 * which is the right way to be honest with the user.
 *
 * We compute the rate from the AVERAGES (not per-video) so a single
 * viral / dud outlier can't dominate the number. This matches how
 * social-analytics tools like Social Blade + VidIQ report it.
 *
 * Zero-safe. Empty input → all zeros, no NaN.
 */

import type { VideoItem } from "@/types/youtube";

export interface EngagementMetrics {
  averageViews: number;
  averageLikes: number;
  averageComments: number;
  /** Engagement rate as a percentage (e.g. 4.2 for "4.2%"). */
  engagementRate: number;
  sampleSize: number;
}

const EMPTY_ENGAGEMENT: EngagementMetrics = {
  averageViews: 0,
  averageLikes: 0,
  averageComments: 0,
  engagementRate: 0,
  sampleSize: 0,
};

function safeMean(nums: number[]): number {
  if (nums.length === 0) return 0;
  let total = 0;
  for (const n of nums) {
    if (Number.isFinite(n) && n > 0) total += n;
  }
  return Math.round(total / nums.length);
}

export function calculateEngagement(
  videos: VideoItem[] | null | undefined,
): EngagementMetrics {
  if (!videos || videos.length === 0) return EMPTY_ENGAGEMENT;

  const averageViews = safeMean(videos.map((v) => v.viewCount));
  const averageLikes = safeMean(videos.map((v) => v.likeCount));
  const averageComments = safeMean(videos.map((v) => v.commentCount));

  // A zero-view sample makes the ratio undefined. Return 0% rather
  // than NaN or Infinity — the UI can then decide whether to hide
  // the row or show it as "—".
  const engagementRate =
    averageViews > 0
      ? ((averageLikes + averageComments) / averageViews) * 100
      : 0;

  return {
    averageViews,
    averageLikes,
    averageComments,
    // Two decimal places is what YouTube Studio shows.
    engagementRate: Math.round(engagementRate * 100) / 100,
    sampleSize: videos.length,
  };
}
