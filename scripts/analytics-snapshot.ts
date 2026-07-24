#!/usr/bin/env npx tsx
/**
 * Analytics Snapshot Script
 *
 * Captures a point-in-time snapshot of YouTube channel statistics
 * for all verified creators. Stores snapshots via the analytics
 * storage adapter (append-only — never overwrites existing data).
 *
 * Behaviour:
 *   1. Reads verified creators from the dataset (those with a channelId)
 *   2. Fetches current stats via channels.list in batches of 50
 *   3. Computes estimated earnings using existing RPM engine
 *   4. Creates one CreatorSnapshot per creator per run
 *   5. Skips creators that already have a snapshot for today's bucket
 *   6. Records API failures without touching existing data
 *
 * Usage:
 *   npx tsx scripts/analytics-snapshot.ts                  # full run
 *   npx tsx scripts/analytics-snapshot.ts --dry-run        # preview only
 *   npx tsx scripts/analytics-snapshot.ts --limit=10       # first 10 only
 *   npx tsx scripts/analytics-snapshot.ts --slug=mrbeast   # single creator
 *
 * Environment:
 *   YOUTUBE_API_KEY — required
 *
 * npm script:
 *   npm run analytics:snapshot -- --dry-run --limit=10
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

// ─── Configuration ──────────────────────────────────────────────────

const API_BASE = "https://www.googleapis.com/youtube/v3";
const BATCH_SIZE = 50; // channels.list supports up to 50 IDs
const DELAY_MS = 250; // Delay between batches to respect quota
const MAX_RETRIES = 2;
const BACKOFF_MS = 2000;

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const DATASET_PATH = path.join(ROOT, "src/data/creators/dataset.ts");
const ANALYTICS_PATH = path.join(ROOT, "data/analytics");

// ─── Types ──────────────────────────────────────────────────────────

interface ChannelStats {
  id: string;
  subscriberCount: number | null;
  viewCount: number;
  videoCount: number;
  hiddenSubscribers: boolean;
  country: string | null;
  publishedAt: string | null;
}

interface ApiChannel {
  id: string;
  snippet?: {
    publishedAt?: string;
    country?: string;
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
    hiddenSubscriberCount?: boolean;
  };
}

interface ApiResponse {
  items?: ApiChannel[];
}

interface CreatorRecord {
  slug: string;
  name: string;
  channelId: string;
  countryCode: string;
  niche: string;
  contentType: string;
}

interface SnapshotResult {
  slug: string;
  status: "captured" | "skipped-duplicate" | "skipped-no-data" | "api-error";
  snapshot?: CreatorSnapshotLocal;
  reason?: string;
}

interface CreatorSnapshotLocal {
  id: string;
  creatorSlug: string;
  capturedAt: string;
  subscribers: number | null;
  totalViews: number;
  videoCount: number;
  estimatedDailyEarningsUsd: number;
  estimatedMonthlyEarningsUsd: number;
  estimatedYearlyEarningsUsd: number;
  estimatedRpmUsd: number;
  estimatedCpmUsd: number;
  source: "youtube-api";
  dataQuality: "high" | "medium";
}

// ─── RPM Data (inline to avoid module resolution issues in scripts) ─

interface CountryTier { id: string; baseRpm: number; shortsRpm: number }
interface NicheEntry { id: string; rpmMultiplier: number; shortsRpmMultiplier: number }

const COUNTRIES: CountryTier[] = [
  { id: "US", baseRpm: 6.5, shortsRpm: 0.08 },
  { id: "GB", baseRpm: 5.5, shortsRpm: 0.07 },
  { id: "CA", baseRpm: 5.5, shortsRpm: 0.07 },
  { id: "AU", baseRpm: 5.8, shortsRpm: 0.07 },
  { id: "DE", baseRpm: 4.8, shortsRpm: 0.06 },
  { id: "FR", baseRpm: 3.8, shortsRpm: 0.05 },
  { id: "NL", baseRpm: 4.6, shortsRpm: 0.06 },
  { id: "SE", baseRpm: 4.4, shortsRpm: 0.06 },
  { id: "JP", baseRpm: 3.5, shortsRpm: 0.05 },
  { id: "KR", baseRpm: 2.8, shortsRpm: 0.04 },
  { id: "IN", baseRpm: 1.1, shortsRpm: 0.012 },
  { id: "BR", baseRpm: 1.4, shortsRpm: 0.018 },
  { id: "MX", baseRpm: 1.6, shortsRpm: 0.02 },
  { id: "ES", baseRpm: 3, shortsRpm: 0.04 },
  { id: "IT", baseRpm: 2.8, shortsRpm: 0.04 },
  { id: "ID", baseRpm: 0.9, shortsRpm: 0.012 },
  { id: "PH", baseRpm: 1, shortsRpm: 0.013 },
  { id: "ZA", baseRpm: 1.2, shortsRpm: 0.02 },
  { id: "AE", baseRpm: 4, shortsRpm: 0.05 },
  { id: "OTHER", baseRpm: 2.2, shortsRpm: 0.03 },
];

const NICHES: NicheEntry[] = [
  { id: "finance", rpmMultiplier: 2.4, shortsRpmMultiplier: 1.5 },
  { id: "business", rpmMultiplier: 1.9, shortsRpmMultiplier: 1.4 },
  { id: "marketing", rpmMultiplier: 1.8, shortsRpmMultiplier: 1.35 },
  { id: "tech", rpmMultiplier: 1.6, shortsRpmMultiplier: 1.3 },
  { id: "education", rpmMultiplier: 1.4, shortsRpmMultiplier: 1.2 },
  { id: "health", rpmMultiplier: 1.2, shortsRpmMultiplier: 1.1 },
  { id: "auto", rpmMultiplier: 1.1, shortsRpmMultiplier: 1.05 },
  { id: "science", rpmMultiplier: 1.1, shortsRpmMultiplier: 1.05 },
  { id: "beauty", rpmMultiplier: 1.0, shortsRpmMultiplier: 1.0 },
  { id: "lifestyle", rpmMultiplier: 0.9, shortsRpmMultiplier: 0.95 },
  { id: "food", rpmMultiplier: 0.9, shortsRpmMultiplier: 0.95 },
  { id: "travel", rpmMultiplier: 0.9, shortsRpmMultiplier: 0.95 },
  { id: "news", rpmMultiplier: 0.9, shortsRpmMultiplier: 0.9 },
  { id: "diy", rpmMultiplier: 0.9, shortsRpmMultiplier: 0.95 },
  { id: "sports", rpmMultiplier: 0.85, shortsRpmMultiplier: 0.9 },
  { id: "entertainment", rpmMultiplier: 0.8, shortsRpmMultiplier: 0.9 },
  { id: "gaming", rpmMultiplier: 0.7, shortsRpmMultiplier: 0.85 },
  { id: "music", rpmMultiplier: 0.6, shortsRpmMultiplier: 0.75 },
  { id: "kids", rpmMultiplier: 0.4, shortsRpmMultiplier: 0.55 },
  { id: "other", rpmMultiplier: 1.0, shortsRpmMultiplier: 1.0 },
];

function findCountry(code: string): CountryTier {
  return COUNTRIES.find(c => c.id === code) ?? COUNTRIES[COUNTRIES.length - 1];
}

function findNiche(id: string): NicheEntry {
  return NICHES.find(n => n.id === id) ?? NICHES[NICHES.length - 1];
}

// ─── Utilities ──────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function generateId(): string {
  return crypto.randomUUID();
}

function todayBucket(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Dataset Reader ─────────────────────────────────────────────────

function readVerifiedCreators(): CreatorRecord[] {
  const content = fs.readFileSync(DATASET_PATH, "utf-8");
  const records: CreatorRecord[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{ id:")) continue;

    const get = (key: string): string | null => {
      const m = trimmed.match(new RegExp(`${key}:\\s*(?:"([^"]*)"|(null))`));
      if (!m) return null;
      return m[2] === "null" ? null : (m[1] ?? null);
    };
    const getBool = (key: string): boolean => {
      const m = trimmed.match(new RegExp(`${key}:\\s*(true|false)`));
      return m?.[1] === "true";
    };

    const channelId = get("youtubeChannelId");
    if (!channelId || !getBool("verified")) continue;

    records.push({
      slug: get("slug") ?? "",
      name: get("name") ?? "",
      channelId,
      countryCode: get("countryCode") ?? "OTHER",
      niche: get("niche") ?? "other",
      contentType: get("contentType") ?? "long",
    });
  }

  return records;
}

// ─── Storage (direct JSON file I/O for scripts) ─────────────────────

function readExistingSnapshots(slug: string): CreatorSnapshotLocal[] {
  const filePath = path.join(ANALYTICS_PATH, `${slug}.json`);
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function writeSnapshots(slug: string, snapshots: CreatorSnapshotLocal[]): void {
  fs.mkdirSync(ANALYTICS_PATH, { recursive: true });
  const filePath = path.join(ANALYTICS_PATH, `${slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(snapshots, null, 2) + "\n", "utf-8");
}

function hasSnapshotToday(slug: string): boolean {
  const existing = readExistingSnapshots(slug);
  const today = todayBucket();
  return existing.some(s => s.capturedAt.slice(0, 10) === today);
}

// ─── YouTube API ────────────────────────────────────────────────────

let API_KEY = "";
let quotaUsed = 0;

async function fetchChannelBatch(channelIds: string[]): Promise<Map<string, ChannelStats>> {
  const url = new URL(`${API_BASE}/channels`);
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("id", channelIds.join(","));
  url.searchParams.set("maxResults", String(BATCH_SIZE));
  url.searchParams.set("key", API_KEY);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url.toString());
      quotaUsed++;

      if (res.status === 403) {
        const body = await res.json().catch(() => ({})) as { error?: { errors?: Array<{ reason?: string }> } };
        if (body.error?.errors?.[0]?.reason === "quotaExceeded") {
          throw new Error("QUOTA_EXCEEDED");
        }
        return new Map();
      }

      if (res.status === 429 || res.status >= 500) {
        if (attempt === MAX_RETRIES) return new Map();
        await sleep(BACKOFF_MS * (attempt + 1));
        continue;
      }

      if (!res.ok) return new Map();

      const data = await res.json() as ApiResponse;
      const result = new Map<string, ChannelStats>();

      for (const item of data.items ?? []) {
        const stats = item.statistics;
        const hidden = stats?.hiddenSubscriberCount ?? false;
        result.set(item.id, {
          id: item.id,
          subscriberCount: hidden ? null : (stats?.subscriberCount ? parseInt(stats.subscriberCount, 10) : null),
          viewCount: stats?.viewCount ? parseInt(stats.viewCount, 10) : 0,
          videoCount: stats?.videoCount ? parseInt(stats.videoCount, 10) : 0,
          hiddenSubscribers: hidden,
          country: item.snippet?.country ?? null,
          publishedAt: item.snippet?.publishedAt ?? null,
        });
      }

      return result;
    } catch (err) {
      if ((err as Error).message === "QUOTA_EXCEEDED") throw err;
      if (attempt === MAX_RETRIES) return new Map();
      await sleep(BACKOFF_MS * (attempt + 1));
    }
  }
  return new Map();
}

// ─── Earnings Estimation ────────────────────────────────────────────

function estimateEarnings(
  creator: CreatorRecord,
  stats: ChannelStats,
): { daily: number; monthly: number; yearly: number; rpm: number; cpm: number } {
  const country = findCountry(creator.countryCode);
  const niche = findNiche(creator.niche);
  const rpm = country.baseRpm * niche.rpmMultiplier;
  const cpm = rpm * 1.8;

  // Estimate monthly views from total views and channel age
  let monthlyViews = 0;
  if (stats.publishedAt && stats.viewCount > 0) {
    const joinedMs = new Date(stats.publishedAt).getTime();
    const monthsSince = Math.max(1, (Date.now() - joinedMs) / (30 * 24 * 60 * 60 * 1000));
    monthlyViews = Math.round(stats.viewCount / monthsSince);
  } else if (stats.viewCount > 0 && stats.videoCount > 0) {
    // Fallback: assume ~2 videos/month cadence
    const estimatedMonths = Math.max(1, stats.videoCount / 2);
    monthlyViews = Math.round(stats.viewCount / estimatedMonths);
  }

  const monthly = (monthlyViews / 1000) * rpm;
  const daily = monthly / 30;
  const yearly = monthly * 12;

  return { daily, monthly, yearly, rpm, cpm };
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find(a => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
  const slugArg = args.find(a => a.startsWith("--slug="));
  const targetSlug = slugArg ? slugArg.split("=")[1] : null;

  console.log("═══════════════════════════════════════════════");
  console.log("  Analytics Snapshot — Channel Statistics");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Mode: ${dryRun ? "DRY-RUN (no writes)" : "CAPTURE"}`);
  if (limit < Infinity) console.log(`  Limit: ${limit} creators`);
  if (targetSlug) console.log(`  Target: ${targetSlug}`);
  console.log();

  API_KEY = process.env.YOUTUBE_API_KEY ?? "";
  if (!API_KEY || API_KEY.length < 10) {
    console.error("❌ YOUTUBE_API_KEY not set.");
    console.error("   export YOUTUBE_API_KEY=AIza...");
    process.exit(1);
  }
  console.log("  API key: present ✓\n");

  // ── Read verified creators ────────────────────────────────────
  let creators = readVerifiedCreators();
  console.log(`  Verified creators in dataset: ${creators.length}`);

  if (targetSlug) {
    creators = creators.filter(c => c.slug === targetSlug);
    if (creators.length === 0) {
      console.error(`  ❌ Creator "${targetSlug}" not found or not verified.`);
      process.exit(1);
    }
  }

  if (limit < creators.length) {
    creators = creators.slice(0, limit);
  }

  // ── Skip creators already captured today ──────────────────────
  const toCapture: CreatorRecord[] = [];
  const skippedToday: string[] = [];

  for (const c of creators) {
    if (hasSnapshotToday(c.slug)) {
      skippedToday.push(c.slug);
    } else {
      toCapture.push(c);
    }
  }

  if (skippedToday.length > 0) {
    console.log(`  Skipped (already captured today): ${skippedToday.length}`);
  }
  console.log(`  To capture: ${toCapture.length}\n`);

  if (toCapture.length === 0) {
    console.log("  Nothing to do — all creators have today's snapshot.");
    process.exit(0);
  }

  // ── Fetch in batches ──────────────────────────────────────────
  const results: SnapshotResult[] = [];
  const capturedAt = new Date().toISOString();
  let stopped = false;

  for (let i = 0; i < toCapture.length; i += BATCH_SIZE) {
    const batch = toCapture.slice(i, i + BATCH_SIZE);
    const channelIds = batch.map(c => c.channelId);

    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} channels...`);

    let statsMap: Map<string, ChannelStats>;
    try {
      statsMap = await fetchChannelBatch(channelIds);
    } catch (err) {
      if ((err as Error).message === "QUOTA_EXCEEDED") {
        console.log("  🛑 Quota exceeded — stopping");
        stopped = true;
        for (const c of batch) {
          results.push({ slug: c.slug, status: "api-error", reason: "quota exceeded" });
        }
        break;
      }
      console.log(`  ❌ Batch error: ${(err as Error).message}`);
      for (const c of batch) {
        results.push({ slug: c.slug, status: "api-error", reason: (err as Error).message });
      }
      continue;
    }

    for (const creator of batch) {
      const stats = statsMap.get(creator.channelId);
      if (!stats) {
        results.push({ slug: creator.slug, status: "skipped-no-data", reason: "channel not returned by API" });
        continue;
      }

      const earnings = estimateEarnings(creator, stats);
      const snapshot: CreatorSnapshotLocal = {
        id: generateId(),
        creatorSlug: creator.slug,
        capturedAt,
        subscribers: stats.subscriberCount,
        totalViews: stats.viewCount,
        videoCount: stats.videoCount,
        estimatedDailyEarningsUsd: Math.round(earnings.daily * 100) / 100,
        estimatedMonthlyEarningsUsd: Math.round(earnings.monthly * 100) / 100,
        estimatedYearlyEarningsUsd: Math.round(earnings.yearly * 100) / 100,
        estimatedRpmUsd: Math.round(earnings.rpm * 100) / 100,
        estimatedCpmUsd: Math.round(earnings.cpm * 100) / 100,
        source: "youtube-api",
        dataQuality: stats.subscriberCount !== null ? "high" : "medium",
      };

      if (!dryRun) {
        const existing = readExistingSnapshots(creator.slug);
        existing.push(snapshot);
        existing.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
        writeSnapshots(creator.slug, existing);
      }

      results.push({ slug: creator.slug, status: "captured", snapshot });
    }

    if (i + BATCH_SIZE < toCapture.length) {
      await sleep(DELAY_MS);
    }
  }

  // ── Summary ───────────────────────────────────────────────────
  const captured = results.filter(r => r.status === "captured");
  const errors = results.filter(r => r.status === "api-error");
  const noData = results.filter(r => r.status === "skipped-no-data");

  console.log("\n═══════════════════════════════════════════════");
  console.log("  RESULTS");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Captured:                ${captured.length}`);
  console.log(`  Skipped (today):         ${skippedToday.length}`);
  console.log(`  Skipped (no data):       ${noData.length}`);
  console.log(`  API errors:              ${errors.length}`);
  console.log(`  Quota used:              ~${quotaUsed} units`);
  console.log(`  Batches:                 ${Math.ceil(toCapture.length / BATCH_SIZE)}`);
  if (stopped) console.log("  ⚠ Run stopped early (quota exceeded)");
  if (dryRun) console.log("\n  ℹ️  Dry-run mode — no files written.");
  console.log("═══════════════════════════════════════════════\n");

  // Show sample captures
  if (captured.length > 0) {
    console.log("  Sample captures:");
    for (const r of captured.slice(0, 5)) {
      const s = r.snapshot!;
      console.log(`    ${r.slug}: ${s.subscribers?.toLocaleString() ?? "hidden"} subs, $${s.estimatedMonthlyEarningsUsd.toLocaleString()}/mo`);
    }
    if (captured.length > 5) console.log(`    ... and ${captured.length - 5} more`);
  }
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
