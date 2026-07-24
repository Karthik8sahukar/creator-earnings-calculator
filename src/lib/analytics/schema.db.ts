/**
 * Drizzle ORM schema for analytics tables.
 *
 * This file defines the database schema in TypeScript. Drizzle uses
 * this to:
 *   1. Generate fully-typed queries (no manual row mapping)
 *   2. Generate SQL migrations via drizzle-kit
 *   3. Provide $inferSelect / $inferInsert types
 */

import {
  pgTable,
  text,
  integer,
  bigint,
  numeric,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const creatorSnapshots = pgTable(
  "creator_snapshots",
  {
    id: text("id").primaryKey(),
    creatorSlug: text("creator_slug").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true, mode: "string" }).notNull(),
    timeBucket: text("time_bucket").notNull(),

    // Channel statistics
    subscribers: integer("subscribers"), // nullable — some channels hide this
    totalViews: bigint("total_views", { mode: "number" }).notNull().default(0),
    videoCount: integer("video_count").notNull().default(0),

    // Estimated earnings (USD)
    estimatedDailyEarningsUsd: numeric("estimated_daily_earnings_usd", { precision: 12, scale: 2 }).notNull().default("0"),
    estimatedMonthlyEarningsUsd: numeric("estimated_monthly_earnings_usd", { precision: 12, scale: 2 }).notNull().default("0"),
    estimatedYearlyEarningsUsd: numeric("estimated_yearly_earnings_usd", { precision: 14, scale: 2 }).notNull().default("0"),
    estimatedRpmUsd: numeric("estimated_rpm_usd", { precision: 8, scale: 4 }).notNull().default("0"),
    estimatedCpmUsd: numeric("estimated_cpm_usd", { precision: 8, scale: 4 }).notNull().default("0"),

    // Metadata
    source: text("source").notNull().default("youtube-api"),
    dataQuality: text("data_quality").notNull().default("high"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_snapshots_slug_bucket").on(table.creatorSlug, table.timeBucket),
    index("idx_snapshots_slug_captured").on(table.creatorSlug, table.capturedAt),
    index("idx_snapshots_captured_at").on(table.capturedAt),
    index("idx_snapshots_creator_slug").on(table.creatorSlug),
  ],
);

/** Type for a selected row from creator_snapshots. */
export type CreatorSnapshotSelect = typeof creatorSnapshots.$inferSelect;

/** Type for an insertable row into creator_snapshots. */
export type CreatorSnapshotInsert = typeof creatorSnapshots.$inferInsert;
