/**
 * Domain types that our UI + API routes deal with.
 * These are DTO-style shapes — not raw YouTube API responses.
 */

export interface ChannelSearchResult {
  channelId: string;
  title: string;
  handle: string | null;
  description: string;
  thumbnail: string;
  subscriberCount: number | null;
  hiddenSubscriberCount: boolean;
}

export interface ChannelDetails {
  channelId: string;
  title: string;
  handle: string | null;
  description: string;
  thumbnail: string;
  bannerUrl: string | null;
  subscriberCount: number | null;
  hiddenSubscriberCount: boolean;
  viewCount: number;
  videoCount: number;
  publishedAt: string;
  country: string | null;
  uploadsPlaylistId: string;
  channelUrl: string;
  customUrl: string | null;
}

export interface VideoItem {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  durationSeconds: number;
  durationLabel: string;
  isShort: boolean;
  url: string;
}

export interface PerformanceEstimate {
  low: number;
  expected: number;
  high: number;
}

export interface PerformanceAnalysis {
  averageRecentViews: number;
  medianRecentViews: number;
  uploadsLast30Days: number;
  uploadsLast90Days: number;
  recentObservedViews: number;
  estimatedMonthlyViews: number;
  shortsPercentage: number;
  longFormPercentage: number;
  monthlyViewEstimate: PerformanceEstimate;
  sampleSize: number;
}

export interface EarningsBreakdown {
  daily: number;
  weekly: number;
  monthly: number;
  annual: number;
}

export interface EarningsResult {
  low: EarningsBreakdown;
  expected: EarningsBreakdown;
  high: EarningsBreakdown;
  currency: string;
  monthlyAdRevenue: EarningsBreakdown;
  extras: {
    sponsorship: number;
    affiliate: number;
    membership: number;
  };
}
