/**
 * Historical Creator Analytics — Data Model
 *
 * Defines the snapshot schema and related types for tracking
 * creator growth over time. Snapshots are append-only — once
 * captured, they are never modified or deleted.
 */

/**
 * A single point-in-time snapshot of a creator's channel statistics.
 *
 * Captured by the analytics:snapshot script and stored via the
 * storage adapter. Each snapshot represents one creator at one
 * moment in time.
 */
export interface CreatorSnapshot {
  /** UUID or composite key for this snapshot. */
  id: string;
  /** Creator slug — foreign key to the dataset. */
  creatorSlug: string;
  /** ISO-8601 timestamp when this snapshot was captured. */
  capturedAt: string;

  // ─── Channel Statistics ───────────────────────────────────────
  /** Subscriber count (integer). Null if hidden by channel. */
  subscribers: number | null;
  /** Total lifetime views (integer). */
  totalViews: number;
  /** Total uploaded videos (integer). */
  videoCount: number;

  // ─── Estimated Earnings (USD) ─────────────────────────────────
  /** Estimated daily ad earnings in USD. */
  estimatedDailyEarningsUsd: number;
  /** Estimated monthly ad earnings in USD. */
  estimatedMonthlyEarningsUsd: number;
  /** Estimated yearly ad earnings in USD. */
  estimatedYearlyEarningsUsd: number;
  /** Estimated RPM (revenue per 1,000 views) in USD. */
  estimatedRpmUsd: number;
  /** Estimated CPM (advertiser cost per 1,000 impressions) in USD. */
  estimatedCpmUsd: number;

  // ─── Metadata ─────────────────────────────────────────────────
  /** Source of this snapshot (e.g., "youtube-api", "manual", "fixture"). */
  source: SnapshotSource;
  /** Quality indicator for this data point. */
  dataQuality: DataQuality;
}

export type SnapshotSource = "youtube-api" | "manual" | "fixture" | "enrichment";

export type DataQuality =
  | "high"      // Live API data, all fields present
  | "medium"    // API data but some fields estimated
  | "low"       // Estimated from limited data
  | "stale";    // Re-used from a prior snapshot (API failure)

/**
 * Time range for querying snapshots.
 */
export type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";

/**
 * Query options for retrieving snapshots.
 */
export interface SnapshotQuery {
  creatorSlug: string;
  range?: TimeRange;
  /** Maximum number of points to return (for downsampling). */
  limit?: number;
}

/**
 * Growth metrics derived from comparing two snapshots.
 */
export interface GrowthMetrics {
  /** Period label (e.g., "7d", "30d"). */
  period: TimeRange;
  /** Subscriber change (absolute). */
  subscriberGrowth: number | null;
  /** Subscriber growth percentage. */
  subscriberGrowthPct: number | null;
  /** View change (absolute). */
  viewGrowth: number;
  /** View growth percentage. */
  viewGrowthPct: number;
  /** Video count change. */
  uploadGrowth: number;
  /** Average daily subscriber gain over the period. */
  avgDailySubscriberGain: number | null;
  /** Average daily view gain over the period. */
  avgDailyViewGain: number;
  /** Earnings change (monthly, USD). */
  earningsChange: number;
  /** Earnings change percentage. */
  earningsChangePct: number;
  /** Whether sufficient data exists for this period. */
  hasData: boolean;
}

/**
 * Complete analytics response for a creator.
 */
export interface CreatorAnalytics {
  creatorSlug: string;
  snapshots: CreatorSnapshot[];
  growth: {
    "7d": GrowthMetrics;
    "30d": GrowthMetrics;
    "90d": GrowthMetrics;
    "1y": GrowthMetrics;
  };
  lastUpdated: string | null;
}
