/**
 * Analytics module barrel export.
 *
 * Usage:
 *   import { getCreatorAnalytics, calculateGrowth, type CreatorSnapshot } from "@/lib/analytics";
 */

export type {
  CreatorSnapshot,
  CreatorAnalytics,
  GrowthMetrics,
  TimeRange,
  SnapshotQuery,
  SnapshotSource,
  DataQuality,
} from "./types";

export {
  calculateGrowth,
  calculateAllGrowth,
  subscriberGrowthOverDays,
  viewGrowthOverDays,
  uploadGrowthOverDays,
  earningsChangeOverDays,
} from "./growth";

export {
  type AnalyticsStorage,
  getAnalyticsStorage,
  getAnalyticsStorageSafe,
  setAnalyticsStorage,
  resetAnalyticsStorage,
  StorageUnavailableError,
  JsonFileAdapter,
  rangeToStartDate,
  dateToBucketKey,
} from "./storage";

export { PostgresAnalyticsStorage } from "./postgres";

export { getDb, type AnalyticsDb } from "./db";
export { creatorSnapshots, type CreatorSnapshotSelect, type CreatorSnapshotInsert } from "./schema.db";

export { getCreatorAnalytics } from "./service";

export {
  buildGrowthRankings,
  hasGrowthRankingData,
  type GrowthRankedCreator,
  type GrowthRankingCriteria,
} from "./rankings";
