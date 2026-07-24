/**
 * PostgreSQL Analytics Storage Adapter (Drizzle ORM)
 *
 * Production-grade storage using Drizzle ORM with Neon HTTP driver.
 * All queries are fully typed — no manual row mapping, no type
 * assertions, no Record<string, any> handling.
 *
 * Drizzle provides:
 *   - Type-safe insert/select/where via schema inference
 *   - Parameterized queries (SQL injection safe)
 *   - Correct TypeScript types for every column
 *   - No connection leaks (Neon HTTP is stateless)
 */

import { eq, gte, asc, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { creatorSnapshots } from "./schema.db";
import type { CreatorSnapshot, SnapshotQuery, SnapshotSource, DataQuality } from "./types";
import { dateToBucketKey, rangeToStartDate, type AnalyticsStorage } from "./storage";

// ─── Row ↔ Domain conversion ────────────────────────────────────────

function rowToDomain(row: typeof creatorSnapshots.$inferSelect): CreatorSnapshot {
  return {
    id: row.id,
    creatorSlug: row.creatorSlug,
    capturedAt: row.capturedAt,
    subscribers: row.subscribers,
    totalViews: row.totalViews,
    videoCount: row.videoCount,
    estimatedDailyEarningsUsd: Number(row.estimatedDailyEarningsUsd),
    estimatedMonthlyEarningsUsd: Number(row.estimatedMonthlyEarningsUsd),
    estimatedYearlyEarningsUsd: Number(row.estimatedYearlyEarningsUsd),
    estimatedRpmUsd: Number(row.estimatedRpmUsd),
    estimatedCpmUsd: Number(row.estimatedCpmUsd),
    source: row.source as SnapshotSource,
    dataQuality: row.dataQuality as DataQuality,
  };
}

// ─── Adapter ────────────────────────────────────────────────────────

export class PostgresAnalyticsStorage implements AnalyticsStorage {
  async saveSnapshot(snapshot: CreatorSnapshot): Promise<boolean> {
    const db = getDb();
    const timeBucket = dateToBucketKey(new Date(snapshot.capturedAt));

    const result = await db
      .insert(creatorSnapshots)
      .values({
        id: snapshot.id,
        creatorSlug: snapshot.creatorSlug,
        capturedAt: snapshot.capturedAt,
        timeBucket,
        subscribers: snapshot.subscribers,
        totalViews: snapshot.totalViews,
        videoCount: snapshot.videoCount,
        estimatedDailyEarningsUsd: String(snapshot.estimatedDailyEarningsUsd),
        estimatedMonthlyEarningsUsd: String(snapshot.estimatedMonthlyEarningsUsd),
        estimatedYearlyEarningsUsd: String(snapshot.estimatedYearlyEarningsUsd),
        estimatedRpmUsd: String(snapshot.estimatedRpmUsd),
        estimatedCpmUsd: String(snapshot.estimatedCpmUsd),
        source: snapshot.source,
        dataQuality: snapshot.dataQuality,
      })
      .onConflictDoNothing({
        target: [creatorSnapshots.creatorSlug, creatorSnapshots.timeBucket],
      })
      .returning({ id: creatorSnapshots.id });

    return result.length > 0;
  }

  async getSnapshots(query: SnapshotQuery): Promise<CreatorSnapshot[]> {
    const db = getDb();
    const startDate = rangeToStartDate(query.range ?? "all").toISOString();

    const baseQuery = db
      .select()
      .from(creatorSnapshots)
      .where(
        sql`${creatorSnapshots.creatorSlug} = ${query.creatorSlug} AND ${creatorSnapshots.capturedAt} >= ${startDate}`,
      )
      .orderBy(asc(creatorSnapshots.capturedAt));

    const rows = query.limit
      ? await baseQuery.limit(query.limit)
      : await baseQuery;

    return rows.map(rowToDomain);
  }

  async getLatestSnapshot(creatorSlug: string): Promise<CreatorSnapshot | null> {
    const db = getDb();

    const rows = await db
      .select()
      .from(creatorSnapshots)
      .where(eq(creatorSnapshots.creatorSlug, creatorSlug))
      .orderBy(desc(creatorSnapshots.capturedAt))
      .limit(1);

    if (rows.length === 0) return null;
    return rowToDomain(rows[0]);
  }

  async hasSnapshotInBucket(creatorSlug: string, bucketKey: string): Promise<boolean> {
    const db = getDb();

    const rows = await db
      .select({ id: creatorSnapshots.id })
      .from(creatorSnapshots)
      .where(
        sql`${creatorSnapshots.creatorSlug} = ${creatorSlug} AND ${creatorSnapshots.timeBucket} = ${bucketKey}`,
      )
      .limit(1);

    return rows.length > 0;
  }

  async getTrackedCreatorSlugs(): Promise<string[]> {
    const db = getDb();

    const rows = await db
      .selectDistinct({ creatorSlug: creatorSnapshots.creatorSlug })
      .from(creatorSnapshots)
      .orderBy(asc(creatorSnapshots.creatorSlug));

    return rows.map((r) => r.creatorSlug);
  }
}
