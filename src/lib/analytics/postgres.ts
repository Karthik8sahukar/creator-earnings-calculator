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

import { neon } from "@neondatabase/serverless";
import type { CreatorSnapshot, SnapshotQuery, SnapshotSource, DataQuality } from "./types";
import { dateToBucketKey, rangeToStartDate } from "./storage";

// ─── Types ──────────────────────────────────────────────────────────

interface SnapshotRow {
  id: string;
  creator_slug: string;
  captured_at: string;
  time_bucket: string;
  subscribers: number | null;
  total_views: string; // bigint comes back as string
  video_count: number;
  estimated_daily_earnings_usd: string;
  estimated_monthly_earnings_usd: string;
  estimated_yearly_earnings_usd: string;
  estimated_rpm_usd: string;
  estimated_cpm_usd: string;
  source: string;
  data_quality: string;
  created_at: string;
}

// ─── Row ↔ Domain mapping ───────────────────────────────────────────

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

import type { AnalyticsStorage } from "./storage";

export class PostgresAnalyticsStorage implements AnalyticsStorage {
  private sql: ReturnType<typeof neon>;

  constructor(databaseUrl: string) {
    this.sql = neon(databaseUrl);
  }

  async saveSnapshot(snapshot: CreatorSnapshot): Promise<boolean> {
    const timeBucket = dateToBucketKey(new Date(snapshot.capturedAt));

    // INSERT with ON CONFLICT — safely handles duplicates
    const result = await this.sql`
      INSERT INTO creator_snapshots (
        id, creator_slug, captured_at, time_bucket,
        subscribers, total_views, video_count,
        estimated_daily_earnings_usd, estimated_monthly_earnings_usd,
        estimated_yearly_earnings_usd, estimated_rpm_usd, estimated_cpm_usd,
        source, data_quality
      ) VALUES (
        ${snapshot.id},
        ${snapshot.creatorSlug},
        ${snapshot.capturedAt},
        ${timeBucket},
        ${snapshot.subscribers},
        ${snapshot.totalViews},
        ${snapshot.videoCount},
        ${snapshot.estimatedDailyEarningsUsd},
        ${snapshot.estimatedMonthlyEarningsUsd},
        ${snapshot.estimatedYearlyEarningsUsd},
        ${snapshot.estimatedRpmUsd},
        ${snapshot.estimatedCpmUsd},
        ${snapshot.source},
        ${snapshot.dataQuality}
      )
      ON CONFLICT (creator_slug, time_bucket) DO NOTHING
      RETURNING id
    `;

    // If RETURNING gives us a row, the insert succeeded.
    // If ON CONFLICT triggered, no row is returned → duplicate.
    return result.length > 0;
  }

  async getSnapshots(query: SnapshotQuery): Promise<CreatorSnapshot[]> {
    const startDate = rangeToStartDate(query.range ?? "all").toISOString();

    let rows: SnapshotRow[];

    if (query.limit) {
      rows = await this.sql`
        SELECT * FROM creator_snapshots
        WHERE creator_slug = ${query.creatorSlug}
          AND captured_at >= ${startDate}
        ORDER BY captured_at ASC
        LIMIT ${query.limit}
      ` as SnapshotRow[];
    } else {
      rows = await this.sql`
        SELECT * FROM creator_snapshots
        WHERE creator_slug = ${query.creatorSlug}
          AND captured_at >= ${startDate}
        ORDER BY captured_at ASC
      ` as SnapshotRow[];
    }

    return rows.map(rowToSnapshot);
  }

  async getLatestSnapshot(creatorSlug: string): Promise<CreatorSnapshot | null> {
    const rows = await this.sql`
      SELECT * FROM creator_snapshots
      WHERE creator_slug = ${creatorSlug}
      ORDER BY captured_at DESC
      LIMIT 1
    ` as SnapshotRow[];

    if (rows.length === 0) return null;
    return rowToSnapshot(rows[0]);
  }

  async hasSnapshotInBucket(creatorSlug: string, bucketKey: string): Promise<boolean> {
    const rows = await this.sql`
      SELECT 1 FROM creator_snapshots
      WHERE creator_slug = ${creatorSlug}
        AND time_bucket = ${bucketKey}
      LIMIT 1
    `;

    return rows.length > 0;
  }

  async getTrackedCreatorSlugs(): Promise<string[]> {
    const rows = await this.sql`
      SELECT DISTINCT creator_slug FROM creator_snapshots
      ORDER BY creator_slug ASC
    ` as Array<{ creator_slug: string }>;

    return rows.map((r) => r.creator_slug);
  }
}
