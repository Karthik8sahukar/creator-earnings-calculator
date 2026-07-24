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
 * Features:
 *   - Parameterized queries only (no SQL interpolation)
 *   - Duplicate insert safety via ON CONFLICT
 *   - Deterministic ordering (captured_at ASC)
 *   - Connection pooling via Neon's HTTP driver
 *   - Compatible with Vercel serverless runtime
 *   - No connection leaks (stateless HTTP queries)
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { CreatorSnapshot, SnapshotQuery, SnapshotSource, DataQuality } from "./types";
import { dateToBucketKey, rangeToStartDate, type AnalyticsStorage } from "./storage";

// ─── Row Types ──────────────────────────────────────────────────────

/** Row returned by INSERT ... RETURNING id */
interface InsertedRow {
  id: string;
}

/** Row returned by SELECT * FROM creator_snapshots */
interface SnapshotRow {
  id: string;
  creator_slug: string;
  captured_at: string;
  time_bucket: string;
  subscribers: number | null;
  total_views: string; // bigint comes back as string from pg
  video_count: number;
  estimated_daily_earnings_usd: string; // numeric comes as string
  estimated_monthly_earnings_usd: string;
  estimated_yearly_earnings_usd: string;
  estimated_rpm_usd: string;
  estimated_cpm_usd: string;
  source: string;
  data_quality: string;
  created_at: string;
}

/** Row returned by SELECT 1 ... (existence check) */
interface ExistsRow {
  "?column?": number;
}

/** Row returned by SELECT DISTINCT creator_slug */
interface SlugRow {
  creator_slug: string;
}

// ─── Row → Domain mapping ───────────────────────────────────────────

function rowToSnapshot(row: SnapshotRow): CreatorSnapshot {
  return {
    id: row.id,
    creatorSlug: row.creator_slug,
    capturedAt: row.captured_at,
    subscribers: row.subscribers,
    totalViews: Number(row.total_views),
    videoCount: row.video_count,
    estimatedDailyEarningsUsd: Number(row.estimated_daily_earnings_usd),
    estimatedMonthlyEarningsUsd: Number(row.estimated_monthly_earnings_usd),
    estimatedYearlyEarningsUsd: Number(row.estimated_yearly_earnings_usd),
    estimatedRpmUsd: Number(row.estimated_rpm_usd),
    estimatedCpmUsd: Number(row.estimated_cpm_usd),
    source: row.source as SnapshotSource,
    dataQuality: row.data_quality as DataQuality,
  };
}

// ─── Adapter ────────────────────────────────────────────────────────

export class PostgresAnalyticsStorage implements AnalyticsStorage {
  private sql: NeonQueryFunction<false, false>;

  constructor(databaseUrl: string) {
    this.sql = neon(databaseUrl);
  }

  async saveSnapshot(snapshot: CreatorSnapshot): Promise<boolean> {
    const timeBucket = dateToBucketKey(new Date(snapshot.capturedAt));

    // INSERT with ON CONFLICT — safely handles duplicates.
    // RETURNING id gives us a row array: if insert succeeded it has
    // one element; if ON CONFLICT triggered, the array is empty.
    const rows: InsertedRow[] = await this.sql(
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

    return rows.length > 0;
  }

  async getSnapshots(query: SnapshotQuery): Promise<CreatorSnapshot[]> {
    const startDate = rangeToStartDate(query.range ?? "all").toISOString();

    let rows: SnapshotRow[];

    if (query.limit) {
      rows = await this.sql(
        `SELECT * FROM creator_snapshots
         WHERE creator_slug = $1
           AND captured_at >= $2
         ORDER BY captured_at ASC
         LIMIT $3`,
        [query.creatorSlug, startDate, query.limit],
      );
    } else {
      rows = await this.sql(
        `SELECT * FROM creator_snapshots
         WHERE creator_slug = $1
           AND captured_at >= $2
         ORDER BY captured_at ASC`,
        [query.creatorSlug, startDate],
      );
    }

    return rows.map(rowToSnapshot);
  }

  async getLatestSnapshot(creatorSlug: string): Promise<CreatorSnapshot | null> {
    const rows: SnapshotRow[] = await this.sql(
      `SELECT * FROM creator_snapshots
       WHERE creator_slug = $1
       ORDER BY captured_at DESC
       LIMIT 1`,
      [creatorSlug],
    );

    if (rows.length === 0) return null;
    return rowToSnapshot(rows[0]);
  }

  async hasSnapshotInBucket(creatorSlug: string, bucketKey: string): Promise<boolean> {
    const rows: ExistsRow[] = await this.sql(
      `SELECT 1 FROM creator_snapshots
       WHERE creator_slug = $1
         AND time_bucket = $2
       LIMIT 1`,
      [creatorSlug, bucketKey],
    );

    return rows.length > 0;
  }

  async getTrackedCreatorSlugs(): Promise<string[]> {
    const rows: SlugRow[] = await this.sql(
      `SELECT DISTINCT creator_slug FROM creator_snapshots
       ORDER BY creator_slug ASC`,
    );

    return rows.map((r) => r.creator_slug);
  }
}
