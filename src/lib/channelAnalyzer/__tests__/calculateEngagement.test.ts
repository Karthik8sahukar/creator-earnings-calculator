import { describe, expect, it } from "vitest";

import type { VideoItem } from "@/types/youtube";
import { calculateEngagement } from "../calculateEngagement";

function makeVideo(overrides: Partial<VideoItem> = {}): VideoItem {
  return {
    videoId: "v",
    title: "t",
    description: "",
    thumbnail: "",
    publishedAt: new Date().toISOString(),
    viewCount: 1000,
    likeCount: 50,
    commentCount: 5,
    durationSeconds: 600,
    durationLabel: "10:00",
    isShort: false,
    url: "https://youtube.com/watch?v=v",
    ...overrides,
  };
}

describe("calculateEngagement", () => {
  it("returns all zeros for an empty sample (no NaN)", () => {
    const e = calculateEngagement([]);
    expect(e.averageViews).toBe(0);
    expect(e.averageLikes).toBe(0);
    expect(e.averageComments).toBe(0);
    expect(e.engagementRate).toBe(0);
    expect(e.sampleSize).toBe(0);
  });

  it("returns all zeros for null / undefined input", () => {
    expect(calculateEngagement(null).sampleSize).toBe(0);
    expect(calculateEngagement(undefined).sampleSize).toBe(0);
  });

  it("computes average views / likes / comments across the sample", () => {
    const e = calculateEngagement([
      makeVideo({ viewCount: 1000, likeCount: 40, commentCount: 10 }),
      makeVideo({ viewCount: 2000, likeCount: 80, commentCount: 20 }),
      makeVideo({ viewCount: 3000, likeCount: 120, commentCount: 30 }),
    ]);
    expect(e.averageViews).toBe(2000);
    expect(e.averageLikes).toBe(80);
    expect(e.averageComments).toBe(20);
    expect(e.sampleSize).toBe(3);
  });

  it("computes engagement rate as (likes + comments) / views * 100", () => {
    const e = calculateEngagement([
      makeVideo({ viewCount: 1000, likeCount: 40, commentCount: 10 }),
      makeVideo({ viewCount: 1000, likeCount: 40, commentCount: 10 }),
    ]);
    // avgViews=1000, avgLikes=40, avgComments=10 → (40+10)/1000*100 = 5.00%
    expect(e.engagementRate).toBe(5);
  });

  it("returns 0% engagement when average views is zero (no NaN / Infinity)", () => {
    const e = calculateEngagement([
      makeVideo({ viewCount: 0, likeCount: 10, commentCount: 5 }),
    ]);
    expect(Number.isFinite(e.engagementRate)).toBe(true);
    expect(e.engagementRate).toBe(0);
  });

  it("rounds engagement rate to two decimal places", () => {
    const e = calculateEngagement([
      makeVideo({ viewCount: 3, likeCount: 1, commentCount: 0 }),
    ]);
    // 1/3 * 100 = 33.333... → 33.33
    expect(e.engagementRate).toBe(33.33);
  });

  it("ignores negative / NaN counts (defensive against upstream junk)", () => {
    const e = calculateEngagement([
      makeVideo({ viewCount: 1000, likeCount: 50, commentCount: 5 }),
      makeVideo({
        viewCount: Number.NaN,
        likeCount: -5,
        commentCount: -10,
      }),
    ]);
    // Bad numbers are floored to 0 before averaging (still divide by
    // sampleSize=2), so averages are half the good row.
    expect(e.averageViews).toBe(500);
    expect(e.averageLikes).toBe(25);
    expect(e.averageComments).toBe(3); // 2.5 → rounded to 3
  });
});
