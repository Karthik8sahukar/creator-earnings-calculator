import type { PerformanceAnalysis, VideoItem } from "@/types/youtube";

/**
 * Turn a list of recent videos into a performance snapshot used by the UI
 * and as a default input for the earnings calculator.
 */
export function analyzePerformance(videos: VideoItem[]): PerformanceAnalysis {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  if (videos.length === 0) {
    return {
      averageRecentViews: 0,
      medianRecentViews: 0,
      uploadsLast30Days: 0,
      uploadsLast90Days: 0,
      recentObservedViews: 0,
      estimatedMonthlyViews: 0,
      shortsPercentage: 0,
      longFormPercentage: 0,
      monthlyViewEstimate: { low: 0, expected: 0, high: 0 },
      sampleSize: 0,
    };
  }

  const viewsSorted = [...videos].map((v) => v.viewCount).sort((a, b) => a - b);
  const sum = viewsSorted.reduce((acc, n) => acc + n, 0);
  const averageRecentViews = Math.round(sum / viewsSorted.length);
  const medianRecentViews =
    viewsSorted.length % 2 === 1
      ? viewsSorted[(viewsSorted.length - 1) / 2]
      : Math.round(
          (viewsSorted[viewsSorted.length / 2 - 1] +
            viewsSorted[viewsSorted.length / 2]) /
            2,
        );

  const in30 = videos.filter(
    (v) => now - new Date(v.publishedAt).getTime() <= 30 * day,
  );
  const in90 = videos.filter(
    (v) => now - new Date(v.publishedAt).getTime() <= 90 * day,
  );

  const uploadsLast30Days = in30.length;
  const uploadsLast90Days = in90.length;

  // "Recent observed views" = sum of views on the analyzed sample.
  const recentObservedViews = sum;

  // If we have data from the last 30 days, we use that directly.
  // Otherwise we scale the sample to a 30-day equivalent using the time
  // span it actually covers.
  let estimatedMonthlyViews: number;
  if (in30.length >= 3) {
    estimatedMonthlyViews = in30.reduce((acc, v) => acc + v.viewCount, 0);
  } else if (in90.length >= 3) {
    // Scale 90 days -> 30 days
    const in90Views = in90.reduce((acc, v) => acc + v.viewCount, 0);
    estimatedMonthlyViews = Math.round(in90Views / 3);
  } else {
    // Fall back to averaging over the observed time window in the sample.
    const publishedTimes = videos
      .map((v) => new Date(v.publishedAt).getTime())
      .filter((t) => Number.isFinite(t));
    const oldest = Math.min(...publishedTimes);
    const spanDays = Math.max((now - oldest) / day, 30);
    estimatedMonthlyViews = Math.round((sum / spanDays) * 30);
  }

  const shortsCount = videos.filter((v) => v.isShort).length;
  const shortsPercentage = Math.round((shortsCount / videos.length) * 100);
  const longFormPercentage = 100 - shortsPercentage;

  // low/expected/high band around the point estimate.
  const monthlyViewEstimate = {
    low: Math.round(estimatedMonthlyViews * 0.7),
    expected: estimatedMonthlyViews,
    high: Math.round(estimatedMonthlyViews * 1.35),
  };

  return {
    averageRecentViews,
    medianRecentViews,
    uploadsLast30Days,
    uploadsLast90Days,
    recentObservedViews,
    estimatedMonthlyViews,
    shortsPercentage,
    longFormPercentage,
    monthlyViewEstimate,
    sampleSize: videos.length,
  };
}
