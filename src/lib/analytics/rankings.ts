/**
 * Growth-based Rankings
 *
 * Extends the core rankings with analytics-driven growth metrics.
 * Only shows growth rankings when sufficient historical data exists.
 *
 * Available rankings:
 *   - Fastest subscriber growth (30d)
 *   - Fastest view growth (30d)
 *   - Biggest 30-day earnings gain
 *   - Ranking movement (subscriber tier change)
 */

import type { CreatorSnapshot, GrowthMetrics } from "./types";
import { calculateGrowth } from "./growth";
import { getAnalyticsStorage } from "./storage";

// ─── Types ──────────────────────────────────────────────────────────

export interface GrowthRankedCreator {
  rank: number;
  slug: string;
  /** The growth metric used for ranking (absolute value). */
  growthValue: number;
  /** Percentage growth. */
  growthPct: number;
  /** Full growth metrics for the period. */
  metrics: GrowthMetrics;
}

export type GrowthRankingCriteria =
  | "subscriber-growth"
  | "view-growth"
  | "earnings-gain";

// ─── Main function ──────────────────────────────────────────────────

/**
 * Build a growth-based ranking from stored analytics snapshots.
 *
 * Returns an empty array when fewer than 2 creators have sufficient
 * data — this prevents showing misleading "rankings" from sparse data.
 *
 * Performance: Reads per-creator JSON files. For large datasets,
 * consider pre-computing growth during the snapshot script and
 * storing a summary index.
 */
export async function buildGrowthRankings(opts: {
  criteria: GrowthRankingCriteria;
  limit?: number;
  /** Minimum number of snapshots a creator must have to be included. */
  minSnapshots?: number;
}): Promise<GrowthRankedCreator[]> {
  const { criteria, limit = 20, minSnapshots = 2 } = opts;
  const storage = getAnalyticsStorage();

  // Get all tracked creators
  const slugs = await storage.getTrackedCreatorSlugs();
  if (slugs.length === 0) return [];

  // Calculate 30-day growth for each creator
  const results: Array<{ slug: string; metrics: GrowthMetrics }> = [];

  for (const slug of slugs) {
    const snapshots = await storage.getSnapshots({ creatorSlug: slug, range: "all" });
    if (snapshots.length < minSnapshots) continue;

    const growth = calculateGrowth(snapshots, "30d");
    if (!growth.hasData) continue;

    results.push({ slug, metrics: growth });
  }

  // Need at least 2 creators for a meaningful ranking
  if (results.length < 2) return [];

  // Sort by the requested criteria
  results.sort((a, b) => {
    switch (criteria) {
      case "subscriber-growth":
        return (b.metrics.subscriberGrowth ?? 0) - (a.metrics.subscriberGrowth ?? 0);
      case "view-growth":
        return b.metrics.viewGrowth - a.metrics.viewGrowth;
      case "earnings-gain":
        return b.metrics.earningsChange - a.metrics.earningsChange;
      default:
        return 0;
    }
  });

  // Assign ranks and limit
  return results.slice(0, limit).map((item, i) => {
    let growthValue: number;
    let growthPct: number;

    switch (criteria) {
      case "subscriber-growth":
        growthValue = item.metrics.subscriberGrowth ?? 0;
        growthPct = item.metrics.subscriberGrowthPct ?? 0;
        break;
      case "view-growth":
        growthValue = item.metrics.viewGrowth;
        growthPct = item.metrics.viewGrowthPct;
        break;
      case "earnings-gain":
        growthValue = item.metrics.earningsChange;
        growthPct = item.metrics.earningsChangePct;
        break;
      default:
        growthValue = 0;
        growthPct = 0;
    }

    return {
      rank: i + 1,
      slug: item.slug,
      growthValue,
      growthPct,
      metrics: item.metrics,
    };
  });
}

/**
 * Check whether enough data exists to show growth rankings.
 * Returns false until at least 5 creators have 2+ snapshots.
 */
export async function hasGrowthRankingData(): Promise<boolean> {
  const storage = getAnalyticsStorage();
  const slugs = await storage.getTrackedCreatorSlugs();
  if (slugs.length < 5) return false;

  let creatorsWithData = 0;
  for (const slug of slugs) {
    const snapshots = await storage.getSnapshots({ creatorSlug: slug, range: "30d" });
    if (snapshots.length >= 2) {
      creatorsWithData++;
      if (creatorsWithData >= 5) return true;
    }
  }
  return false;
}
