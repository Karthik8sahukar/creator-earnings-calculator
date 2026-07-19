import { describe, expect, it } from "vitest";

import type {
  ChannelDetails,
  PerformanceAnalysis,
} from "@/types/youtube";
import { calculateGrowth, scoreToLabel } from "../calculateGrowth";
import type { EngagementMetrics } from "../calculateEngagement";

function makeChannel(overrides: Partial<ChannelDetails> = {}): ChannelDetails {
  return {
    channelId: "UC1",
    title: "Test",
    handle: "@test",
    description: "",
    thumbnail: "",
    bannerUrl: null,
    subscriberCount: 100_000,
    hiddenSubscriberCount: false,
    viewCount: 10_000_000,
    videoCount: 500,
    publishedAt: "2020-01-01T00:00:00Z",
    country: "US",
    uploadsPlaylistId: "UU1",
    channelUrl: "https://youtube.com/@test",
    customUrl: "@test",
    ...overrides,
  };
}

function makePerformance(
  overrides: Partial<PerformanceAnalysis> = {},
): PerformanceAnalysis {
  return {
    averageRecentViews: 20_000,
    medianRecentViews: 18_000,
    uploadsLast30Days: 6,
    uploadsLast90Days: 18,
    recentObservedViews: 240_000,
    estimatedMonthlyViews: 120_000,
    shortsPercentage: 30,
    longFormPercentage: 70,
    monthlyViewEstimate: { low: 100_000, expected: 120_000, high: 150_000 },
    sampleSize: 12,
    ...overrides,
  };
}

function makeEngagement(
  overrides: Partial<EngagementMetrics> = {},
): EngagementMetrics {
  return {
    averageViews: 20_000,
    averageLikes: 800,
    averageComments: 100,
    engagementRate: 4.5,
    sampleSize: 12,
    ...overrides,
  };
}

describe("scoreToLabel", () => {
  it("maps the 0-100 score to four buckets", () => {
    expect(scoreToLabel(0)).toBe("quiet");
    expect(scoreToLabel(24)).toBe("quiet");
    expect(scoreToLabel(25)).toBe("steady");
    expect(scoreToLabel(49)).toBe("steady");
    expect(scoreToLabel(50)).toBe("growing");
    expect(scoreToLabel(74)).toBe("growing");
    expect(scoreToLabel(75)).toBe("thriving");
    expect(scoreToLabel(100)).toBe("thriving");
  });

  it("clamps out-of-range inputs", () => {
    expect(scoreToLabel(-10)).toBe("quiet");
    expect(scoreToLabel(200)).toBe("thriving");
    expect(scoreToLabel(Number.NaN)).toBe("quiet");
  });
});

describe("calculateGrowth", () => {
  it("computes uploadFrequency from the last 30 days when non-zero", () => {
    const g = calculateGrowth({
      channel: makeChannel(),
      performance: makePerformance({
        uploadsLast30Days: 8,
        uploadsLast90Days: 20,
      }),
      engagement: makeEngagement(),
    });
    expect(g.uploadFrequency).toBe(8);
  });

  it("falls back to last-90-days ÷ 3 when the last 30 days is empty", () => {
    const g = calculateGrowth({
      channel: makeChannel(),
      performance: makePerformance({
        uploadsLast30Days: 0,
        uploadsLast90Days: 9,
      }),
      engagement: makeEngagement(),
    });
    expect(g.uploadFrequency).toBe(3);
  });

  it("computes subsPerVideo and viewsPerSub when subs are visible", () => {
    const g = calculateGrowth({
      channel: makeChannel({
        subscriberCount: 100_000,
        videoCount: 200,
        viewCount: 50_000_000,
      }),
      performance: makePerformance(),
      engagement: makeEngagement(),
    });
    expect(g.subsPerVideo).toBe(500); // 100k / 200
    expect(g.viewsPerSub).toBe(500); // 50M / 100k
  });

  it("returns null ratios when subscribers are hidden", () => {
    const g = calculateGrowth({
      channel: makeChannel({
        hiddenSubscriberCount: true,
        subscriberCount: null,
      }),
      performance: makePerformance(),
      engagement: makeEngagement(),
    });
    expect(g.subsPerVideo).toBeNull();
    expect(g.viewsPerSub).toBeNull();
  });

  it("returns a 0-100 growth score", () => {
    const g = calculateGrowth({
      channel: makeChannel(),
      performance: makePerformance(),
      engagement: makeEngagement(),
    });
    expect(g.growthScore).toBeGreaterThanOrEqual(0);
    expect(g.growthScore).toBeLessThanOrEqual(100);
    expect(g.growthLabel).toBe(scoreToLabel(g.growthScore));
  });

  it("gives the maximum score for a channel that maxes every signal", () => {
    // 12+ uploads/mo, 5%+ engagement, avg views ≥ 50% of subs,
    // and a steady 30/90 cadence.
    const g = calculateGrowth({
      channel: makeChannel({ subscriberCount: 100_000 }),
      performance: makePerformance({
        uploadsLast30Days: 15,
        uploadsLast90Days: 45,
        averageRecentViews: 60_000, // 60% of subs
      }),
      engagement: makeEngagement({ engagementRate: 6 }),
    });
    expect(g.growthScore).toBe(100);
    expect(g.growthLabel).toBe("thriving");
  });

  it("gives a low score for a channel with no recent activity", () => {
    const g = calculateGrowth({
      channel: makeChannel({ subscriberCount: 100_000 }),
      performance: makePerformance({
        uploadsLast30Days: 0,
        uploadsLast90Days: 0,
        averageRecentViews: 0,
      }),
      engagement: makeEngagement({ engagementRate: 0 }),
    });
    // With subs known and other components zero, the reach term is
    // 0 too — everything nets out to 0.
    expect(g.growthScore).toBe(0);
    expect(g.growthLabel).toBe("quiet");
  });

  it("neutralizes the reach component (12.5 pts) when subs are hidden", () => {
    // With everything else zero but subs hidden, the growth score
    // should be 12.5 → rounded to 13 → still "quiet".
    const g = calculateGrowth({
      channel: makeChannel({
        hiddenSubscriberCount: true,
        subscriberCount: null,
      }),
      performance: makePerformance({
        uploadsLast30Days: 0,
        uploadsLast90Days: 0,
        averageRecentViews: 0,
      }),
      engagement: makeEngagement({ engagementRate: 0 }),
    });
    expect(g.growthScore).toBe(13);
    expect(g.growthLabel).toBe("quiet");
  });

  it("clamps out-of-range signals — a viral video doesn't tip over 100", () => {
    // A channel that dropped a single mega-viral upload should score
    // no more than the max — the individual signal caps at 25.
    const g = calculateGrowth({
      channel: makeChannel({ subscriberCount: 10_000 }),
      performance: makePerformance({
        uploadsLast30Days: 100,
        uploadsLast90Days: 100,
        averageRecentViews: 100_000_000,
      }),
      engagement: makeEngagement({ engagementRate: 30 }),
    });
    expect(g.growthScore).toBeLessThanOrEqual(100);
  });
});
