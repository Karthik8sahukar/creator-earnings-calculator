#!/usr/bin/env npx tsx
/**
 * Automatic channel enrichment script.
 *
 * Iterates over every creator WITHOUT a youtubeChannelId and attempts
 * to identify their official channel using multiple strategies:
 *
 *   1. channels.list(forHandle=@handle) — 1 quota unit (preferred)
 *   2. If handle lookup fails, search.list with name variants — 100 units
 *
 * High-confidence matches are written to:
 *   src/data/creators/auto-matched.json
 *
 * Lower-confidence matches are written to:
 *   reports/manual-review.json
 *
 * Run:  npx tsx scripts/enrich-creators.ts
 *
 * Requires: YOUTUBE_API_KEY environment variable
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ─── Configuration ──────────────────────────────────────────────────

const API_BASE = "https://www.googleapis.com/youtube/v3";
const HIGH_CONFIDENCE_THRESHOLD = 0.80;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.55;
const REQUEST_DELAY_MS = 200; // Throttle between API calls
const MAX_SEARCH_CALLS = 50; // Limit expensive search.list calls

// ─── Types ──────────────────────────────────────────────────────────

interface CreatorInput {
  id: string;
  slug: string;
  name: string;
  handle: string;
  country: string;
  category: string;
  niche: string;
  subscriberTier: string;
  description: string;
}

interface MatchCandidate {
  channelId: string;
  title: string;
  handle: string | null;
  description: string;
  subscriberCount: number | null;
  thumbnail: string;
  country: string | null;
  score: number;
  strategy: string;
  reasons: string[];
}

interface MatchResult {
  creatorId: string;
  creatorName: string;
  handle: string;
  status: "auto-matched" | "manual-review" | "no-match" | "skipped";
  candidate?: MatchCandidate;
}

interface Report {
  runDate: string;
  totalUnverified: number;
  autoMatched: MatchResult[];
  manualReview: MatchResult[];
  noMatch: MatchResult[];
  skipped: MatchResult[];
  quotaUsed: number;
}

// ─── Helpers ────────────────────────────────────────────────────────

const API_KEY = process.env.YOUTUBE_API_KEY;
let quotaUsed = 0;
let searchCallsUsed = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ytFetch<T>(
  endpoint: string,
  params: Record<string, string | number>,
): Promise<T> {
  if (!API_KEY) {
    throw new Error("YOUTUBE_API_KEY not set. Export it before running.");
  }

  const url = new URL(`${API_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  url.searchParams.set("key", API_KEY);

  await sleep(REQUEST_DELAY_MS);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `YouTube API ${res.status}: ${body.slice(0, 200)}`,
    );
  }
  return (await res.json()) as T;
}

// ─── Scoring ────────────────────────────────────────────────────────

function normalizeStr(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function stringSimilarity(a: string, b: string): number {
  const na = normalizeStr(a);
  const nb = normalizeStr(b);
  if (na === nb) return 1.0;
  if (na.length === 0 || nb.length === 0) return 0;

  // Check containment
  if (na.includes(nb) || nb.includes(na)) return 0.85;

  // Levenshtein-based similarity for short strings
  const maxLen = Math.max(na.length, nb.length);
  const dist = levenshtein(na, nb);
  return Math.max(0, 1 - dist / maxLen);
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function subscriberTierMin(tier: string): number {
  switch (tier) {
    case "mega": return 10_000_000;
    case "large": return 1_000_000;
    case "mid": return 100_000;
    case "emerging": return 10_000;
    default: return 0;
  }
}

function scoreCandidate(
  creator: CreatorInput,
  candidate: {
    title: string;
    handle: string | null;
    description: string;
    subscriberCount: number | null;
    country: string | null;
  },
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Title similarity (weight: 0.30)
  const titleSim = stringSimilarity(creator.name, candidate.title);
  score += titleSim * 0.30;
  if (titleSim > 0.9) reasons.push("title exact match");
  else if (titleSim > 0.7) reasons.push("title close match");

  // Handle similarity (weight: 0.25)
  if (candidate.handle) {
    const creatorHandle = creator.handle.replace(/^@/, "").toLowerCase();
    const candidateHandle = candidate.handle.replace(/^@/, "").toLowerCase();
    const handleSim = stringSimilarity(creatorHandle, candidateHandle);
    score += handleSim * 0.25;
    if (handleSim > 0.9) reasons.push("handle exact match");
    else if (handleSim > 0.7) reasons.push("handle close match");
  }

  // Description contains creator name or keywords (weight: 0.10)
  const descLower = (candidate.description || "").toLowerCase();
  const nameLower = creator.name.toLowerCase();
  if (descLower.includes(nameLower)) {
    score += 0.10;
    reasons.push("description mentions creator name");
  } else {
    // Check if niche keyword is in description
    if (descLower.includes(creator.niche)) {
      score += 0.05;
      reasons.push("description mentions niche");
    }
  }

  // Subscriber count plausibility (weight: 0.20)
  if (candidate.subscriberCount !== null) {
    const minExpected = subscriberTierMin(creator.subscriberTier);
    if (candidate.subscriberCount >= minExpected) {
      score += 0.20;
      reasons.push(`subscribers ${candidate.subscriberCount.toLocaleString()} matches tier`);
    } else if (candidate.subscriberCount >= minExpected * 0.5) {
      score += 0.10;
      reasons.push("subscriber count plausible");
    }
  }

  // Country match (weight: 0.10)
  if (candidate.country) {
    // YouTube returns country codes; our dataset has full names
    // Simple heuristic: check if either contains the other
    const ccLower = candidate.country.toLowerCase();
    const countryLower = creator.country.toLowerCase();
    if (
      ccLower === countryLower ||
      countryLower.includes(ccLower) ||
      ccLower.includes(countryLower.slice(0, 2))
    ) {
      score += 0.10;
      reasons.push("country match");
    }
  }

  // Bonus: exact handle match from forHandle lookup (weight: 0.05)
  if (candidate.handle) {
    const ch = candidate.handle.replace(/^@/, "").toLowerCase();
    const eh = creator.handle.replace(/^@/, "").toLowerCase();
    if (ch === eh) {
      score += 0.05;
      reasons.push("handle verified via forHandle API");
    }
  }

  return { score: Math.min(score, 1.0), reasons };
}

// ─── API Strategies ─────────────────────────────────────────────────

interface YtChannelItem {
  id: string;
  snippet?: {
    title: string;
    description: string;
    customUrl?: string;
    country?: string;
    thumbnails?: { default?: { url: string } };
  };
  statistics?: {
    subscriberCount?: string;
    hiddenSubscriberCount?: boolean;
  };
}

interface YtResponse {
  items?: YtChannelItem[];
}

interface YtSearchItem {
  id: { channelId: string };
  snippet: {
    channelId: string;
    title: string;
    description: string;
    thumbnails?: { default?: { url: string } };
  };
}

interface YtSearchResponse {
  items?: YtSearchItem[];
}

function mapYtItem(item: YtChannelItem): Omit<MatchCandidate, "score" | "strategy" | "reasons"> {
  return {
    channelId: item.id,
    title: item.snippet?.title ?? "",
    handle: item.snippet?.customUrl
      ? item.snippet.customUrl.startsWith("@")
        ? item.snippet.customUrl
        : `@${item.snippet.customUrl}`
      : null,
    description: (item.snippet?.description ?? "").slice(0, 300),
    subscriberCount: item.statistics?.hiddenSubscriberCount
      ? null
      : item.statistics?.subscriberCount
        ? Number(item.statistics.subscriberCount)
        : null,
    thumbnail: item.snippet?.thumbnails?.default?.url ?? "",
    country: item.snippet?.country ?? null,
  };
}

/**
 * Strategy 1: channels.list(forHandle=@handle)
 * Cost: 1 quota unit
 */
async function tryHandleLookup(creator: CreatorInput): Promise<MatchCandidate | null> {
  const handle = creator.handle.startsWith("@")
    ? creator.handle
    : `@${creator.handle}`;

  try {
    const res = await ytFetch<YtResponse>("channels", {
      part: "snippet,statistics",
      forHandle: handle,
      maxResults: 1,
    });
    quotaUsed += 1;

    const item = res.items?.[0];
    if (!item) return null;

    const mapped = mapYtItem(item);
    const { score, reasons } = scoreCandidate(creator, mapped);

    return {
      ...mapped,
      score,
      strategy: "forHandle",
      reasons,
    };
  } catch {
    return null;
  }
}

/**
 * Strategy 2: search.list(q=name)
 * Cost: 100 quota units — use sparingly!
 */
async function trySearchLookup(
  creator: CreatorInput,
  query: string,
): Promise<MatchCandidate | null> {
  if (searchCallsUsed >= MAX_SEARCH_CALLS) return null;

  try {
    const searchRes = await ytFetch<YtSearchResponse>("search", {
      part: "snippet",
      q: query,
      type: "channel",
      maxResults: 3,
    });
    quotaUsed += 100;
    searchCallsUsed++;

    const candidates = searchRes.items ?? [];
    if (candidates.length === 0) return null;

    // For each search result, get full channel data
    const channelIds = candidates.map((c) => c.id.channelId || c.snippet.channelId).join(",");
    const channelRes = await ytFetch<YtResponse>("channels", {
      part: "snippet,statistics",
      id: channelIds,
      maxResults: 3,
    });
    quotaUsed += 1;

    const items = channelRes.items ?? [];
    let best: MatchCandidate | null = null;

    for (const item of items) {
      const mapped = mapYtItem(item);
      const { score, reasons } = scoreCandidate(creator, mapped);
      const candidate: MatchCandidate = {
        ...mapped,
        score,
        strategy: `search:"${query}"`,
        reasons,
      };
      if (!best || candidate.score > best.score) {
        best = candidate;
      }
    }

    return best;
  } catch {
    return null;
  }
}

// ─── Main ───────────────────────────────────────────────────────────

async function loadCreators(): Promise<CreatorInput[]> {
  // Dynamic import the dataset
  const datasetPath = path.resolve(
    __dirname,
    "../src/data/creators/dataset.ts",
  );
  // We use a simpler approach: parse the file for entries without channelId
  const { CREATORS_DATASET } = await import(datasetPath);

  return (CREATORS_DATASET as Array<{
    id: string; slug: string; name: string; handle: string;
    youtubeChannelId: string | null; country: string;
    category: string; niche: string; subscriberTier: string;
    description: string;
  }>)
    .filter((c) => !c.youtubeChannelId)
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      handle: c.handle,
      country: c.country,
      category: c.category,
      niche: c.niche,
      subscriberTier: c.subscriberTier,
      description: c.description,
    }));
}

async function enrichOne(creator: CreatorInput): Promise<MatchResult> {
  // Strategy 1: Handle lookup (cheapest — 1 unit)
  const handleResult = await tryHandleLookup(creator);

  if (handleResult && handleResult.score >= HIGH_CONFIDENCE_THRESHOLD) {
    return {
      creatorId: creator.id,
      creatorName: creator.name,
      handle: creator.handle,
      status: "auto-matched",
      candidate: handleResult,
    };
  }

  // If handle gave a medium result, keep it but don't auto-match
  if (handleResult && handleResult.score >= MEDIUM_CONFIDENCE_THRESHOLD) {
    return {
      creatorId: creator.id,
      creatorName: creator.name,
      handle: creator.handle,
      status: "manual-review",
      candidate: handleResult,
    };
  }

  // Strategy 2: Search (expensive — 100 units)
  // Try: exact name, then name + "official"
  const searchQueries = [
    creator.name,
    `${creator.name} official`,
  ];

  for (const query of searchQueries) {
    if (searchCallsUsed >= MAX_SEARCH_CALLS) break;

    const searchResult = await trySearchLookup(creator, query);
    if (!searchResult) continue;

    if (searchResult.score >= HIGH_CONFIDENCE_THRESHOLD) {
      return {
        creatorId: creator.id,
        creatorName: creator.name,
        handle: creator.handle,
        status: "auto-matched",
        candidate: searchResult,
      };
    }

    if (searchResult.score >= MEDIUM_CONFIDENCE_THRESHOLD) {
      return {
        creatorId: creator.id,
        creatorName: creator.name,
        handle: creator.handle,
        status: "manual-review",
        candidate: searchResult,
      };
    }
  }

  // No good match found
  return {
    creatorId: creator.id,
    creatorName: creator.name,
    handle: creator.handle,
    status: "no-match",
    candidate: handleResult ?? undefined,
  };
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Creator Channel Enrichment Script");
  console.log("═══════════════════════════════════════════════════\n");

  if (!API_KEY) {
    console.error("ERROR: YOUTUBE_API_KEY is not set.");
    console.error("Export it: export YOUTUBE_API_KEY=your_key_here");
    process.exit(1);
  }

  const creators = await loadCreators();
  console.log(`Found ${creators.length} unverified creators to process.\n`);

  const report: Report = {
    runDate: new Date().toISOString(),
    totalUnverified: creators.length,
    autoMatched: [],
    manualReview: [],
    noMatch: [],
    skipped: [],
    quotaUsed: 0,
  };

  for (let i = 0; i < creators.length; i++) {
    const creator = creators[i];
    const progress = `[${i + 1}/${creators.length}]`;

    try {
      const result = await enrichOne(creator);

      switch (result.status) {
        case "auto-matched":
          report.autoMatched.push(result);
          console.log(
            `${progress} ✓ AUTO-MATCHED: ${creator.name} → ${result.candidate?.channelId} (score: ${result.candidate?.score.toFixed(2)})`,
          );
          break;
        case "manual-review":
          report.manualReview.push(result);
          console.log(
            `${progress} ? REVIEW: ${creator.name} → ${result.candidate?.channelId} (score: ${result.candidate?.score.toFixed(2)})`,
          );
          break;
        case "no-match":
          report.noMatch.push(result);
          console.log(`${progress} ✗ NO MATCH: ${creator.name}`);
          break;
        default:
          report.skipped.push(result);
          console.log(`${progress} - SKIPPED: ${creator.name}`);
      }
    } catch (err) {
      console.error(`${progress} ERROR: ${creator.name} — ${(err as Error).message}`);
      report.skipped.push({
        creatorId: creator.id,
        creatorName: creator.name,
        handle: creator.handle,
        status: "skipped",
      });
    }
  }

  report.quotaUsed = quotaUsed;

  // ─── Write outputs ──────────────────────────────────────────────

  const reportsDir = path.resolve(__dirname, "../reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  // Auto-matched results
  const autoMatchedPath = path.resolve(
    __dirname,
    "../src/data/creators/auto-matched.json",
  );
  const autoMatchedData = Object.fromEntries(
    report.autoMatched
      .filter((r) => r.candidate)
      .map((r) => [r.creatorId, r.candidate!.channelId]),
  );
  fs.writeFileSync(autoMatchedPath, JSON.stringify(autoMatchedData, null, 2));

  // Manual review
  const manualReviewPath = path.resolve(reportsDir, "manual-review.json");
  fs.writeFileSync(
    manualReviewPath,
    JSON.stringify(report.manualReview, null, 2),
  );

  // Full report
  const reportPath = path.resolve(reportsDir, "enrichment-run.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // ─── Summary ────────────────────────────────────────────────────

  console.log("\n═══════════════════════════════════════════════════");
  console.log("  ENRICHMENT COMPLETE");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Total unverified:       ${report.totalUnverified}`);
  console.log(`  Auto-matched:           ${report.autoMatched.length}`);
  console.log(`  Manual review required: ${report.manualReview.length}`);
  console.log(`  No match found:         ${report.noMatch.length}`);
  console.log(`  Skipped (errors):       ${report.skipped.length}`);
  console.log(`  API quota used:         ${report.quotaUsed} units`);
  console.log(`  Search calls used:      ${searchCallsUsed}/${MAX_SEARCH_CALLS}`);
  console.log("");
  console.log(`  Auto-matched saved to:  ${autoMatchedPath}`);
  console.log(`  Manual review saved to: ${manualReviewPath}`);
  console.log(`  Full report saved to:   ${reportPath}`);
  console.log("═══════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
