import { describe, expect, it } from "vitest";

import { analyzePerformance } from "../performance";
import type { VideoItem } from "@/types/youtube";

const NOW = Date.now();
const DAY = 86_400_000;

function makeVideo(overrides: Partial<VideoItem>): VideoItem {
  return {
    videoId: "id",
    title: "video",
    description: "",
    thumbnail: "",
    publishedAt: new Date(NOW - 10 * DAY).toISOString(),
    viewCount: 1000,
    likeCount: 0,
    commentCount: 0,
    durationSeconds: 300,
    durationLabel: "5:00",
    isShort: false,
    url: "",
    ...overrides,
  };
}

describe("analyzePerformance", () => {
  it("returns zero values for no videos", () => {
    const r = analyzePerformance([]);
    expect(r.sampleSize).toBe(0);
    expect(r.averageRecentViews).toBe(0);
    expect(r.medianRecentViews).toBe(0);
    expect(r.monthlyViewEstimate).toEqual({ low: 0, expected: 0, high: 0 });
  });

  it("handles a single video", () => {
    const r = analyzePerformance([makeVideo({ viewCount: 500 })]);
    expect(r.sampleSize).toBe(1);
    expect(r.averageRecentViews).toBe(500);
    expect(r.medianRecentViews).toBe(500);
  });

  it("computes average views", () => {
    const r = analyzePerformance(
      [100, 200, 300, 400].map((viewCount, i) =>
        makeVideo({ videoId: `v${i}`, viewCount }),
      ),
    );
    expect(r.averageRecentViews).toBe(250);
  });

  it("computes median for odd count", () => {
    const r = analyzePerformance(
      [10, 30, 50, 70, 90].map((v, i) =>
        makeVideo({ videoId: `v${i}`, viewCount: v }),
      ),
    );
    expect(r.medianRecentViews).toBe(50);
  });

  it("computes median for even count", () => {
    const r = analyzePerformance(
      [10, 20, 30, 40].map((v, i) =>
        makeVideo({ videoId: `v${i}`, viewCount: v }),
      ),
    );
    expect(r.medianRecentViews).toBe(25);
  });

  it("counts uploads in last 30 days correctly", () => {
    const r = analyzePerformance([
      makeVideo({ publishedAt: new Date(NOW - 5 * DAY).toISOString() }),
      makeVideo({ publishedAt: new Date(NOW - 20 * DAY).toISOString() }),
      makeVideo({ publishedAt: new Date(NOW - 45 * DAY).toISOString() }),
      makeVideo({ publishedAt: new Date(NOW - 80 * DAY).toISOString() }),
      makeVideo({ publishedAt: new Date(NOW - 200 * DAY).toISOString() }),
    ]);
    expect(r.uploadsLast30Days).toBe(2);
    expect(r.uploadsLast90Days).toBe(4);
  });

  it("counts uploads across a 60-day span", () => {
    const r = analyzePerformance([
      makeVideo({ publishedAt: new Date(NOW - 10 * DAY).toISOString() }),
      makeVideo({ publishedAt: new Date(NOW - 25 * DAY).toISOString() }),
      makeVideo({ publishedAt: new Date(NOW - 55 * DAY).toISOString() }),
      makeVideo({ publishedAt: new Date(NOW - 75 * DAY).toISOString() }),
    ]);
    // uploads in last 30 days == 2, in last 90 days == 4
    expect(r.uploadsLast30Days).toBe(2);
    expect(r.uploadsLast90Days).toBe(4);
  });

  it("sums observed views across the sample", () => {
    const r = analyzePerformance(
      [100, 200, 300].map((v, i) =>
        makeVideo({ videoId: `v${i}`, viewCount: v }),
      ),
    );
    expect(r.recentObservedViews).toBe(600);
  });

  it("computes shorts and long-form percentages", () => {
    const r = analyzePerformance([
      makeVideo({ isShort: true, videoId: "s1" }),
      makeVideo({ isShort: true, videoId: "s2" }),
      makeVideo({ isShort: false, videoId: "l1" }),
      makeVideo({ isShort: false, videoId: "l2" }),
    ]);
    expect(r.shortsPercentage).toBe(50);
    expect(r.longFormPercentage).toBe(50);
  });

  it("shorts and long-form always sum to 100", () => {
    const cases: VideoItem[][] = [
      [makeVideo({ isShort: true })],
      [makeVideo({ isShort: false })],
      Array.from({ length: 7 }, (_, i) =>
        makeVideo({ videoId: `v${i}`, isShort: i % 3 === 0 }),
      ),
    ];
    for (const videos of cases) {
      const r = analyzePerformance(videos);
      expect(r.shortsPercentage + r.longFormPercentage).toBe(100);
    }
  });

  it("estimate ordering is low <= expected <= high", () => {
    const r = analyzePerformance(
      Array.from({ length: 6 }, (_, i) =>
        makeVideo({
          videoId: `v${i}`,
          viewCount: 1000 + i * 500,
          publishedAt: new Date(NOW - (i + 1) * 5 * DAY).toISOString(),
        }),
      ),
    );
    expect(r.monthlyViewEstimate.low).toBeLessThanOrEqual(
      r.monthlyViewEstimate.expected,
    );
    expect(r.monthlyViewEstimate.expected).toBeLessThanOrEqual(
      r.monthlyViewEstimate.high,
    );
  });

  it("uses 30-day sum when we have >= 3 uploads in last 30 days", () => {
    const videos = Array.from({ length: 4 }, (_, i) =>
      makeVideo({
        videoId: `v${i}`,
        viewCount: 1000,
        publishedAt: new Date(NOW - (i + 1) * 5 * DAY).toISOString(),
      }),
    );
    const r = analyzePerformance(videos);
    expect(r.estimatedMonthlyViews).toBe(4000);
  });

  it("scales 90-day data to 30-day when 30-day sample is sparse", () => {
    // 3 uploads across the last 90 days, none in the last 30
    const videos = [40, 60, 80].map((daysAgo, i) =>
      makeVideo({
        videoId: `v${i}`,
        viewCount: 3000,
        publishedAt: new Date(NOW - daysAgo * DAY).toISOString(),
      }),
    );
    const r = analyzePerformance(videos);
    // 9,000 views / 90 days * 30 == 3,000
    expect(r.estimatedMonthlyViews).toBe(3000);
  });

  it("falls back to per-day rate for sparse channels", () => {
    // Two videos, both older than 90 days → forces the fallback branch
    const videos = [120, 200].map((daysAgo, i) =>
      makeVideo({
        videoId: `v${i}`,
        viewCount: 6000,
        publishedAt: new Date(NOW - daysAgo * DAY).toISOString(),
      }),
    );
    const r = analyzePerformance(videos);
    expect(r.uploadsLast30Days).toBe(0);
    expect(r.uploadsLast90Days).toBe(0);
    expect(r.estimatedMonthlyViews).toBeGreaterThanOrEqual(0);
    expect(r.monthlyViewEstimate.low).toBeLessThanOrEqual(
      r.monthlyViewEstimate.high,
    );
  });

  it("does not blow up on viral outliers", () => {
    const videos = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeVideo({ videoId: `v${i}`, viewCount: 1000 }),
      ),
      makeVideo({ videoId: "viral", viewCount: 1_000_000_000 }),
    ];
    const r = analyzePerformance(videos);
    expect(Number.isFinite(r.averageRecentViews)).toBe(true);
    expect(Number.isFinite(r.medianRecentViews)).toBe(true);
    expect(r.medianRecentViews).toBe(1000);
  });

  it("handles zero-view videos", () => {
    const r = analyzePerformance(
      Array.from({ length: 5 }, (_, i) =>
        makeVideo({ videoId: `v${i}`, viewCount: 0 }),
      ),
    );
    expect(r.averageRecentViews).toBe(0);
    expect(r.medianRecentViews).toBe(0);
  });

  it("handles extremely large view counts", () => {
    const r = analyzePerformance(
      Array.from({ length: 4 }, (_, i) =>
        makeVideo({ videoId: `v${i}`, viewCount: 1e12 }),
      ),
    );
    expect(Number.isFinite(r.averageRecentViews)).toBe(true);
  });
});
