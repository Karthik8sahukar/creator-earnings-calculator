/**
 * PostgreSQL Analytics Storage Adapter
 *
 * Production-grade storage for creator analytics snapshots using
 * Neon serverless PostgreSQL (@neondatabase/serverless).
 *
 * Requirements:
 *   - DATABASE_URL environment variable (Neon connection string)
 *   - creator_snapshots table created via migration
 *
 * Typing strategy:
 *   The Neon `neon()` function returns queries typed as
 *   `Record<string, any>[]`. Rather than using type assertions
 *   (which bypass safety), we use validated mapper functions that
 *   extract and convert each field explicitly. This guarantees
 *   runtime type safety even if the database schema drifts.
 *
 * @neondatabase/serverless version: ^0.10.0
 */

import { neon } from "@neondatabase/serverless";
import type { CreatorSnapshot, SnapshotSource, DataQuality, SnapshotQuery } from "./types";
import { dateToBucketKey, rangeToStartDate, type AnalyticsStorage } from "./storage";

// ─── Row Mapper Functions ───────────────────────────────────────────
//
// Each mapper takes a raw `Record<string, unknown>` row from the
// Neon driver and produces a correctly-typed domain object.
// No `as any` assertions — every field is accessed via bracket
// notation and converted explicitly. The only narrowing is from
// `string` to known string-literal unions via validated helper functions.

const VALID_SOURCES: ReadonlySet<string> = new Set(["youtube-api", "manual", "fixture", "enrichment"]);
const VALID_QUALITIES: ReadonlySet<string> = new Set(["high", "medium", "low", "stale"]);

function toSource(value: unknown): SnapshotSource {
  const s = String(value ?? "youtube-api");
  return VALID_SOURCES.has(s) ? (s as SnapshotSource) : "youtube-api";
}

function toDataQuality(value: unknown): DataQuality {
  const s = String(value ?? "high");
  return VALID_QUALITIES.has(s) ? (s as DataQuality) : "high";
}

function mapSnapshotRow(row: Record<string, unknown>): CreatorSnapshot {
  return {
    id: String(row["id"] ?? ""),
    creatorSlug: String(row["creator_slug"] ?? ""),
    capturedAt: String(row["captured_at"] ?? ""),
    subscribers: row["subscribers"] === null || row["subscribers"] === undefined ? null : Number(row["subscribers"]),
    totalViews: Number(row["total_views"] ?? 0),
    videoCount: Number(row["video_count"] ?? 0),
    estimatedDailyEarningsUsd: Number(row["estimated_daily_earnings_usd"] ?? 0),
    estimatedMonthlyEarningsUsd: Number(row["estimated_monthly_earnings_usd"] ?? 0),
    estimatedYearlyEarningsUsd: Number(row["estimated_yearly_earnings_usd"] ?? 0),
    estimatedRpmUsd: Number(row["estimated_rpm_usd"] ?? 0),
    estimatedCpmUsd: Number(row["estimated_cpm_usd"] ?? 0),
    source: toSource(row["source"]),
    dataQuality: toDataQuality(row["data_quality"]),
  };
}

function hasInsertedId(row: Record<string, unknown>): boolean {
  return typeof row["id"] === "string" && row["id"].length > 0;
}

function extractSlug(row: Record<string, unknown>): string {
  return String(row["creator_slug"] ?? "");
}

function hasExistenceRow(rows: Array<Record<string, unknown>>): boolean {
  return rows.length > 0;
}

// ─── Adapter ────────────────────────────────────────────────────────

export class PostgresAnalyticsStorage implements AnalyticsStorage {
  private sql: ReturnType<typeof neon>;

  constructor(databaseUrl: string) {
    this.sql = neon(databaseUrl);
  }

  async saveSnapshot(snapshot: CreatorSnapshot): Promise<boolean> {
    const timeBucket = dateToBucketKey(new Date(snapshot.capturedAt));

    // INSERT with ON CONFLICT — safely handles duplicates.
    // RETURNING id: if insert succeeded, one row; if conflict, zero rows.
    const rows = await this.sql(
      `INSERT INTO creator_snapshots (
        id, creator_slug, captured_at, time_bucket,
        subscribers, total_views, video_count,
        estimated_daily_earnings_usd, estimated_monthly_earnings_usd,
        estimated_yearly_earnings_usd, estimated_rpm_usd, estimated_cpm_usd,
        source, data_quality
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      ON CONFLICT (creator_slug, time_bucket) DO NOTHING
      RETURNING id`,
      [
        snapshot.id,
        snapshot.creatorSlug,
        snapshot.capturedAt,
        timeBucket,
        snapshot.subscribers,
        snapshot.totalViews,
        snapshot.videoCount,
        snapshot.estimatedDailyEarningsUsd,
        snapshot.estimatedMonthlyEarningsUsd,
        snapshot.estimatedYearlyEarningsUsd,
        snapshot.estimatedRpmUsd,
        snapshot.estimatedCpmUsd,
        snapshot.source,
        snapshot.dataQuality,
      ],
    );

    // rows is Record<string, any>[]. Check if any row was returned.
    return Array.isArray(rows) && rows.length > 0 && hasInsertedId(rows[0]);
  }

  async getSnapshots(query: SnapshotQuery): Promise<CreatorSnapshot[]> {
    const startDate = rangeToStartDate(query.range ?? "all").toISOString();

    const rows = query.limit
      ? await this.sql(
          `SELECT * FROM creator_snapshots
           WHERE creator_slug = $1
             AND captured_at >= $2
           ORDER BY captured_at ASC
           LIMIT $3`,
          [query.creatorSlug, startDate, query.limit],
        )
      : await this.sql(
          `SELECT * FROM creator_snapshots
           WHERE creator_slug = $1
             AND captured_at >= $2
           ORDER BY captured_at ASC`,
          [query.creatorSlug, startDate],
        );

    if (!Array.isArray(rows)) return [];
    return rows.map(mapSnapshotRow);
  }

  async getLatestSnapshot(creatorSlug: string): Promise<CreatorSnapshot | null> {
    const rows = await this.sql(
      `SELECT * FROM creator_snapshots
       WHERE creator_slug = $1
       ORDER BY captured_at DESC
       LIMIT 1`,
      [creatorSlug],
    );

    if (!Array.isArray(rows) || rows.length === 0) return null;
    return mapSnapshotRow(rows[0]);
  }

  async hasSnapshotInBucket(creatorSlug: string, bucketKey: string): Promise<boolean> {
    const rows = await this.sql(
      `SELECT 1 FROM creator_snapshots
       WHERE creator_slug = $1
         AND time_bucket = $2
       LIMIT 1`,
      [creatorSlug, bucketKey],
    );

    return Array.isArray(rows) && hasExistenceRow(rows);
  }

  async getTrackedCreatorSlugs(): Promise<string[]> {
    const rows = await this.sql(
      `SELECT DISTINCT creator_slug FROM creator_snapshots
       ORDER BY creator_slug ASC`,
    );

    if (!Array.isArray(rows)) return [];
    return rows.map(extractSlug);
  }
}
