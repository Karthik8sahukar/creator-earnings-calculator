-- Migration: 001_create_creator_snapshots
-- Description: Create enums and the creator_snapshots table for historical analytics.
-- Must match the Drizzle schema in src/lib/analytics/schema.db.ts exactly.
--
-- Usage:
--   psql $DATABASE_URL -f migrations/001_create_creator_snapshots.sql

-- ─── Enums ──────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE snapshot_source AS ENUM ('youtube-api', 'manual', 'fixture', 'enrichment');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE data_quality_level AS ENUM ('high', 'medium', 'low', 'stale');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── Table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS creator_snapshots (
  id                              TEXT PRIMARY KEY,
  creator_slug                    TEXT NOT NULL,
  captured_at                     TIMESTAMPTZ NOT NULL,
  time_bucket                     TEXT NOT NULL,

  -- Channel statistics
  subscribers                     INTEGER,                    -- nullable: hidden channels
  total_views                     BIGINT NOT NULL DEFAULT 0,
  video_count                     INTEGER NOT NULL DEFAULT 0,

  -- Estimated earnings (USD)
  estimated_daily_earnings_usd    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  estimated_monthly_earnings_usd  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  estimated_yearly_earnings_usd   NUMERIC(14, 2) NOT NULL DEFAULT 0,
  estimated_rpm_usd               NUMERIC(8, 4) NOT NULL DEFAULT 0,
  estimated_cpm_usd               NUMERIC(8, 4) NOT NULL DEFAULT 0,

  -- Metadata (enum-typed for DB-level validation)
  source                          snapshot_source NOT NULL DEFAULT 'youtube-api',
  data_quality                    data_quality_level NOT NULL DEFAULT 'high',
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_snapshots_slug_bucket
  ON creator_snapshots (creator_slug, time_bucket);

CREATE INDEX IF NOT EXISTS idx_snapshots_slug_captured
  ON creator_snapshots (creator_slug, captured_at);

CREATE INDEX IF NOT EXISTS idx_snapshots_captured_at
  ON creator_snapshots (captured_at);

CREATE INDEX IF NOT EXISTS idx_snapshots_creator_slug
  ON creator_snapshots (creator_slug);
