#!/usr/bin/env npx tsx
/**
 * Creator Enrichment Script (v2 — Pipeline-aware)
 *
 * Enriches VERIFIED creators with live YouTube data:
 *   - Avatar URL
 *   - Banner URL
 *   - Subscriber count (for tier computation)
 *   - View count
 *   - Video count
 *   - Channel join date
 *   - Country (if reported by YouTube)
 *
 * Only processes creators that have a verified youtubeChannelId.
 * Uses channels.list(id=...) — 1 quota unit per creator.
 *
 * Usage:
 *   npx tsx scripts/enrich-creators-v2.ts              # dry-run
 *   npx tsx scripts/enrich-creators-v2.ts --write      # apply updates
 *   npx tsx scripts/enrich-creators-v2.ts --stale 7    # only re-enrich if >7 days old
 *
 * Requires: YOUTUBE_API_KEY environment variable
 */

import * as fs from "node:fs";
import {
  PATHS,
  readDatasetEntries,
  readJson,
  writeJson,
  writeText,
  ensureDir,
  log,
  logSuccess,
  logWarn,
  logError,
  logSection,
} from "./pipeline/utils.js";
import type { PipelineCreator } from "./pipeline/types.js";

// ─── Configuration ──────────────────────────────────────────────────

const API_BASE = "https://www.googleapis.com/youtube/v3";
const DELAY_MS = 220;
const MAX_RETRIES = 2;
const BACKOFF_MS = 2000;
const BATCH_SIZE = 50; // channels.list supports up to 50 IDs per call

// ─── Types ──────────────────────────────────────────────────────────

interface ApiChannel {
  id: string;
  snippet: {
    title: string;
    customUrl?: string;
    country?: string;
    publishedAt?: string;
    thumbnails?: {
      default?: { url: string };
      high?: { url: string };
    };
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
    hiddenSubscriberCount?: boolean;
  };
  brandingSettings?: {
    image?: { bannerExternalUrl?: string };
  };
}

interface ApiResponse {
  items?: ApiChannel[];
}

interface EnrichResult {
  slug: string;
  channelId: string;
  status: "enriched" | "skipped" | "not-found" | "error";
  avatar?: string;
  banner?: string;
  subscriberCount?: number;
  viewCount?: number;
  videoCount?: number;
  joinedAt?: string;
  country?: string;
  computedTier?: "mega" | "large" | "mid" | "emerging";
}

// ─── Subscriber tier computation ────────────────────────────────────

function computeTier(subs: number): "mega" | "large" | "mid" | "emerging" {
  if (subs >= 20_000_000) return "mega";
  if (subs >= 3_000_000) return "large";
  if (subs >= 500_000) return "mid";
  return "emerging";
}

// ─── API Client ─────────────────────────────────────────────────────

let API_KEY = "";
let quotaUsed = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Batch-fetch channels by ID. Up to 50 per call (1 quota unit).
 */
async function fetchChannelsBatch(ids: string[]): Promise<Map<string, ApiChannel>> {
  const url = new URL(`${API_BASE}/channels`);
  url.searchParams.set("part", "id,snippet,statistics,brandingSettings");
  url.searchParams.set("id", ids.join(","));
  url.searchParams.set("maxResults", "50");
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
      const map = new Map<string, ApiChannel>();
      for (const item of data.items ?? []) {
        map.set(item.id, item);
      }
      return map;
    } catch (err) {
      if ((err as Error).message === "QUOTA_EXCEEDED") throw err;
      if (attempt === MAX_RETRIES) return new Map();
      await sleep(BACKOFF_MS * (attempt + 1));
    }
  }
  return new Map();
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const writeMode = args.includes("--write");
  const staleIdx = args.indexOf("--stale");
  const staleDays = staleIdx >= 0 ? parseInt(args[staleIdx + 1] ?? "7", 10) : 30;

  logSection("Creator Enrichment Pipeline (v2)");
  log(`  Mode: ${writeMode ? "WRITE" : "DRY-RUN"}`);
  log(`  Stale threshold: ${staleDays} days`);

  API_KEY = process.env.YOUTUBE_API_KEY ?? "";
  if (!API_KEY || API_KEY.length < 10) {
    logError("YOUTUBE_API_KEY not set.");
    process.exit(1);
  }
  log("  API key: present ✓\n");

  // ── Gather verified creators with channel IDs ─────────────────
  const datasetEntries = readDatasetEntries();
  const pipelineEntries = readJson<PipelineCreator[]>(PATHS.creatorsJson) ?? [];

  interface ToEnrich {
    slug: string;
    channelId: string;
    source: "dataset" | "pipeline";
    lastEnriched?: string;
  }

  const toEnrich: ToEnrich[] = [];
  const now = Date.now();
  const staleMs = staleDays * 24 * 60 * 60 * 1000;

  for (const e of datasetEntries) {
    if (!e.youtubeChannelId || !e.verified) continue;
    toEnrich.push({ slug: e.slug, channelId: e.youtubeChannelId, source: "dataset" });
  }

  for (const e of pipelineEntries) {
    if (!e.youtubeChannelId || !e.verified) continue;
    if (toEnrich.some(t => t.slug === e.slug)) continue;

    // Check staleness
    if (e.metadata.enrichedAt) {
      const enrichedAt = new Date(e.metadata.enrichedAt).getTime();
      if (now - enrichedAt < staleMs) {
        continue; // Not stale yet
      }
    }

    toEnrich.push({
      slug: e.slug,
      channelId: e.youtubeChannelId,
      source: "pipeline",
      lastEnriched: e.metadata.enrichedAt,
    });
  }

  log(`  Verified creators to enrich: ${toEnrich.length}`);

  // ── Process in batches of 50 ──────────────────────────────────
  const results: EnrichResult[] = [];
  let stopped = false;

  for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
    const batch = toEnrich.slice(i, i + BATCH_SIZE);
    const ids = batch.map(c => c.channelId);

    log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: fetching ${ids.length} channels...`);

    let channelMap: Map<string, ApiChannel>;
    try {
      channelMap = await fetchChannelsBatch(ids);
    } catch (err) {
      if ((err as Error).message === "QUOTA_EXCEEDED") {
        logError("Quota exceeded — stopping");
        stopped = true;
        break;
      }
      logError(`Batch error: ${(err as Error).message}`);
      for (const c of batch) {
        results.push({ slug: c.slug, channelId: c.channelId, status: "error" });
      }
      continue;
    }

    for (const c of batch) {
      const channel = channelMap.get(c.channelId);
      if (!channel) {
        results.push({ slug: c.slug, channelId: c.channelId, status: "not-found" });
        continue;
      }

      const stats = channel.statistics;
      const subCount = stats?.subscriberCount ? parseInt(stats.subscriberCount, 10) : undefined;
      const viewCount = stats?.viewCount ? parseInt(stats.viewCount, 10) : undefined;
      const videoCount = stats?.videoCount ? parseInt(stats.videoCount, 10) : undefined;

      results.push({
        slug: c.slug,
        channelId: c.channelId,
        status: "enriched",
        avatar: channel.snippet.thumbnails?.high?.url ?? undefined,
        banner: channel.brandingSettings?.image?.bannerExternalUrl ?? undefined,
        subscriberCount: subCount,
        viewCount,
        videoCount,
        joinedAt: channel.snippet.publishedAt ?? undefined,
        country: channel.snippet.country ?? undefined,
        computedTier: subCount ? computeTier(subCount) : undefined,
      });
    }

    await sleep(DELAY_MS);
  }

  // ── Summary ────────────────────────────────────────────────────
  const enriched = results.filter(r => r.status === "enriched");
  const notFound = results.filter(r => r.status === "not-found");
  const errors = results.filter(r => r.status === "error");

  logSection("Enrichment Summary");
  log(`  Enriched:     ${enriched.length}`);
  log(`  Not found:    ${notFound.length}`);
  log(`  Errors:       ${errors.length}`);
  log(`  Quota used:   ~${quotaUsed} units`);
  if (stopped) log("  ⚠ Run stopped early (quota exceeded)");

  // ── Apply to pipeline ──────────────────────────────────────────
  if (writeMode && enriched.length > 0) {
    const now = new Date().toISOString();
    let pipelineChanges = 0;

    // Update pipeline creators
    const pipeline = readJson<PipelineCreator[]>(PATHS.creatorsJson) ?? [];
    for (const r of enriched) {
      const entry = pipeline.find(c => c.slug === r.slug);
      if (!entry) continue;

      if (r.avatar) entry.avatar = r.avatar;
      if (r.banner) entry.banner = r.banner;
      if (r.subscriberCount) entry.metadata.subscriberCount = r.subscriberCount;
      if (r.viewCount) entry.metadata.viewCount = r.viewCount;
      if (r.videoCount) entry.metadata.videoCount = r.videoCount;
      if (r.joinedAt) entry.metadata.joinedAt = r.joinedAt;
      if (r.computedTier) entry.subscriberTier = r.computedTier;
      entry.metadata.enrichedAt = now;
      pipelineChanges++;
    }

    if (pipelineChanges > 0) {
      writeJson(PATHS.creatorsJson, pipeline);
      logSuccess(`Pipeline updates: ${pipelineChanges}`);
    }
  }

  // ── Write enrichment report ────────────────────────────────────
  let md = `# Enrichment Report\n\nGenerated: ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n| Metric | Count |\n|--------|-------|\n`;
  md += `| Enriched | ${enriched.length} |\n`;
  md += `| Not found | ${notFound.length} |\n`;
  md += `| Errors | ${errors.length} |\n`;
  md += `| Quota used | ~${quotaUsed} |\n\n`;

  if (enriched.length > 0) {
    md += `## Enriched Creators\n\n`;
    md += `| Slug | Subscribers | Views | Videos | Tier |\n`;
    md += `|------|-------------|-------|--------|------|\n`;
    for (const r of enriched.slice(0, 50)) {
      md += `| ${r.slug} | ${r.subscriberCount?.toLocaleString() ?? "—"} | ${r.viewCount?.toLocaleString() ?? "—"} | ${r.videoCount ?? "—"} | ${r.computedTier ?? "—"} |\n`;
    }
    if (enriched.length > 50) md += `| ... | ${enriched.length - 50} more | | | |\n`;
    md += `\n`;
  }

  ensureDir(PATHS.reports);
  writeText(PATHS.reports + "/enrichment-report.md", md);
  logSuccess(`Report: ${PATHS.reports}/enrichment-report.md`);
}

main().catch((err) => {
  logError(`Fatal: ${(err as Error).message}`);
  process.exit(1);
});
