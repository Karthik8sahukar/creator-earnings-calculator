#!/usr/bin/env npx tsx
/**
 * Creator Enrichment Script — Live YouTube API Verification
 *
 * Verifies and enriches ALL creators using the YouTube Data API.
 *
 * Behavior:
 *   1. The original 23 creators (verified before commit 53589e2) are TRUSTED.
 *   2. The 61 creators added in commit 53589e2 are REVALIDATED against the API.
 *   3. All remaining unverified creators are processed for the first time.
 *
 * Strategy per creator:
 *   1. channels.list(forHandle=@handle) — 1 quota unit (preferred)
 *   2. If no result: search.list(q=name, type=channel) — 100 units
 *   3. If no result: search.list(q=name+" official") — 100 units
 *
 * Validation:
 *   - Handle match (customUrl vs stored handle)
 *   - Title similarity (Levenshtein)
 *   - Country match (when available)
 *   - Confidence score ≥ 95% required for auto-verification
 *
 * Output:
 *   - reports/enrichment-report.md
 *   - reports/manual-review.json
 *   - (with --write) updated src/data/creators/dataset.ts
 *
 * Usage:
 *   npx tsx scripts/enrich-creators.ts              # dry-run
 *   npx tsx scripts/enrich-creators.ts --write      # apply changes
 *
 * Requires: YOUTUBE_API_KEY environment variable
 */

import * as fs from "node:fs";
import * as path from "node:path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);


// ─── Configuration ──────────────────────────────────────────────────

const API_BASE = "https://www.googleapis.com/youtube/v3";
const DELAY_MS = 250;
const MAX_RETRIES = 2;
const BACKOFF_MS = 2000;
const CONFIDENCE_THRESHOLD = 0.95;
const MAX_SEARCH_CALLS = 80; // Limit expensive search.list usage

const DATASET_PATH = path.resolve(__dirname, "../src/data/creators/dataset.ts");
const REPORT_MD_PATH = path.resolve(__dirname, "../reports/enrichment-report.md");
const MANUAL_REVIEW_PATH = path.resolve(__dirname, "../reports/manual-review.json");

// The original 23 creators verified BEFORE commit 53589e2.
// These are TRUSTED and will NOT be revalidated.
const ORIGINAL_TRUSTED: ReadonlySet<string> = new Set([
  "mrbeast", "markiplier", "ishowspeed", "coryxkenshin", "loganpaul",
  "jakepaul", "joerogan", "pewdiepie", "carryminati", "techburner",
  "ashishchanchlani", "bbkivines", "triggeredinsaan", "totalgaming",
  "round2hell", "samayraina", "sandeepmaheshwari", "dhruvrathee",
  "mythpat", "slayypointofficial", "flying-beast", "ksi", "sidemen",
]);

// ─── Types ──────────────────────────────────────────────────────────

interface DatasetCreator {
  id: string;
  slug: string;
  name: string;
  handle: string;
  youtubeChannelId: string | null;
  country: string;
  countryCode: string;
  category: string;
  niche: string;
  verified: boolean;
}


interface ApiChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    country?: string;
    thumbnails?: {
      default?: { url: string };
      high?: { url: string };
    };
  };
  brandingSettings?: {
    image?: { bannerExternalUrl?: string };
  };
}

interface ApiResponse { items?: ApiChannel[]; }
interface SearchItem { id: { channelId: string }; snippet: { title: string; description: string } }
interface SearchResponse { items?: SearchItem[]; }

type ResultStatus =
  | "trusted"          // Original 23 — not touched
  | "confirmed"       // Revalidated: API returned same ID
  | "corrected"       // Revalidated: API returned DIFFERENT ID
  | "revoked"         // Revalidated: no reliable match — set back to null
  | "newly-verified"  // Previously unverified, now confirmed
  | "manual-review"   // Confidence < 95%
  | "not-found"       // No channel found for handle
  | "api-error";      // Quota/network issue

interface EnrichmentResult {
  slug: string;
  name: string;
  handle: string;
  previousChannelId: string | null;
  status: ResultStatus;
  apiChannelId?: string;
  apiTitle?: string;
  apiHandle?: string;
  apiAvatar?: string;
  apiBanner?: string;
  apiCountry?: string;
  confidence?: number;
  reason?: string;
}

// ─── Utilities ──────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const na = normalize(a), nb = normalize(b);
  if (na === nb) return 1.0;
  if (!na || !nb) return 0;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  return Math.max(0, 1 - levenshtein(na, nb) / Math.max(na.length, nb.length));
}


// ─── API Client ─────────────────────────────────────────────────────

let quotaUsed = 0;
let searchCallsUsed = 0;
let API_KEY = "";

async function ytFetch<T>(endpoint: string, params: Record<string, string>): Promise<T | null> {
  const url = new URL(`${API_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", API_KEY);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url.toString());
      if (res.status === 403) {
        const body = await res.json().catch(() => ({})) as { error?: { errors?: Array<{ reason?: string }> } };
        if (body.error?.errors?.[0]?.reason === "quotaExceeded") {
          throw new Error("QUOTA_EXCEEDED");
        }
        return null;
      }
      if (res.status === 429 || res.status >= 500) {
        if (attempt === MAX_RETRIES) return null;
        await sleep(BACKOFF_MS * (attempt + 1));
        continue;
      }
      if (!res.ok) return null;
      return await res.json() as T;
    } catch (err) {
      if ((err as Error).message === "QUOTA_EXCEEDED") throw err;
      if (attempt === MAX_RETRIES) return null;
      await sleep(BACKOFF_MS * (attempt + 1));
    }
  }
  return null;
}

async function lookupByHandle(handle: string): Promise<ApiChannel | null> {
  const h = handle.startsWith("@") ? handle : `@${handle}`;
  const res = await ytFetch<ApiResponse>("channels", {
    part: "id,snippet,brandingSettings",
    forHandle: h,
    maxResults: "1",
  });
  quotaUsed += 1;
  return res?.items?.[0] ?? null;
}

async function searchChannel(query: string): Promise<ApiChannel | null> {
  if (searchCallsUsed >= MAX_SEARCH_CALLS) return null;
  const searchRes = await ytFetch<SearchResponse>("search", {
    part: "snippet",
    q: query,
    type: "channel",
    maxResults: "1",
  });
  quotaUsed += 100;
  searchCallsUsed++;

  const channelId = searchRes?.items?.[0]?.id?.channelId;
  if (!channelId) return null;

  // Fetch full channel data
  const channelRes = await ytFetch<ApiResponse>("channels", {
    part: "id,snippet,brandingSettings",
    id: channelId,
    maxResults: "1",
  });
  quotaUsed += 1;
  return channelRes?.items?.[0] ?? null;
}


// ─── Scoring ────────────────────────────────────────────────────────

function scoreMatch(creator: DatasetCreator, channel: ApiChannel): { confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Handle match (weight: 0.40)
  const storedHandle = creator.handle.replace(/^@/, "").toLowerCase();
  const apiHandle = (channel.snippet.customUrl ?? "").replace(/^@/, "").toLowerCase();
  if (apiHandle && storedHandle === apiHandle) {
    score += 0.40;
    reasons.push("handle exact match");
  } else if (apiHandle && similarity(storedHandle, apiHandle) > 0.85) {
    score += 0.25;
    reasons.push("handle similar");
  }

  // Title match (weight: 0.30)
  const titleSim = similarity(creator.name, channel.snippet.title);
  if (titleSim >= 0.95) {
    score += 0.30;
    reasons.push("title exact match");
  } else if (titleSim >= 0.7) {
    score += titleSim * 0.30;
    reasons.push(`title similar (${(titleSim * 100).toFixed(0)}%)`);
  }

  // Description contains creator name (weight: 0.10)
  const descLower = (channel.snippet.description ?? "").toLowerCase();
  if (descLower.includes(creator.name.toLowerCase())) {
    score += 0.10;
    reasons.push("description mentions name");
  }

  // Country match (weight: 0.10)
  if (channel.snippet.country) {
    const apiCountry = channel.snippet.country.toUpperCase();
    if (apiCountry === creator.countryCode) {
      score += 0.10;
      reasons.push("country matches");
    }
  }

  // Niche/category signal in description (weight: 0.10)
  if (descLower.includes(creator.niche) || descLower.includes(creator.category.toLowerCase())) {
    score += 0.10;
    reasons.push("niche/category in description");
  }

  return { confidence: Math.min(score, 1.0), reasons };
}

// ─── Dataset I/O ────────────────────────────────────────────────────

function readDataset(): DatasetCreator[] {
  const content = fs.readFileSync(DATASET_PATH, "utf-8");
  const entries: DatasetCreator[] = [];
  const regex = /\{\s*id:\s*"([^"]+)"[^}]*\}/gs;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const entry = match[0];
    const get = (key: string): string | null => {
      const m = entry.match(new RegExp(`${key}:\\s*(?:"([^"]*)"|(null))`));
      if (!m) return null;
      return m[2] === "null" ? null : (m[1] ?? null);
    };
    const getBool = (key: string): boolean => {
      const m = entry.match(new RegExp(`${key}:\\s*(true|false)`));
      return m?.[1] === "true";
    };
    const id = get("id");
    if (!id) continue;
    entries.push({
      id,
      slug: get("slug") ?? id,
      name: get("name") ?? "",
      handle: get("handle") ?? "",
      youtubeChannelId: get("youtubeChannelId"),
      country: get("country") ?? "",
      countryCode: get("countryCode") ?? "OTHER",
      category: get("category") ?? "",
      niche: get("niche") ?? "other",
      verified: getBool("verified"),
    });
  }
  return entries;
}


function applyResults(results: EnrichmentResult[]): number {
  let content = fs.readFileSync(DATASET_PATH, "utf-8");
  let changes = 0;

  for (const r of results) {
    if (r.status === "trusted") continue;

    if (r.status === "confirmed" || r.status === "newly-verified") {
      // Set channelId and verified=true
      if (!r.apiChannelId) continue;
      const idPat = new RegExp(`(id: "${r.slug}"[^}]*youtubeChannelId: )(?:"[^"]*"|null)`);
      if (idPat.test(content)) {
        content = content.replace(idPat, `$1"${r.apiChannelId}"`);
        const vPat = new RegExp(`(id: "${r.slug}"[^}]*verified: )(?:true|false)`);
        content = content.replace(vPat, "$1true");
        changes++;
      }
    } else if (r.status === "corrected") {
      // Replace with correct ID
      if (!r.apiChannelId) continue;
      const idPat = new RegExp(`(id: "${r.slug}"[^}]*youtubeChannelId: )(?:"[^"]*"|null)`);
      if (idPat.test(content)) {
        content = content.replace(idPat, `$1"${r.apiChannelId}"`);
        const vPat = new RegExp(`(id: "${r.slug}"[^}]*verified: )(?:true|false)`);
        content = content.replace(vPat, "$1true");
        changes++;
      }
    } else if (r.status === "revoked") {
      // Set back to null + verified=false
      const idPat = new RegExp(`(id: "${r.slug}"[^}]*youtubeChannelId: )"[^"]*"`);
      if (idPat.test(content)) {
        content = content.replace(idPat, "$1null");
        const vPat = new RegExp(`(id: "${r.slug}"[^}]*verified: )true`);
        content = content.replace(vPat, "$1false");
        changes++;
      }
    }
  }

  if (changes > 0) {
    fs.writeFileSync(DATASET_PATH, content, "utf-8");
  }
  return changes;
}

// ─── Report Generation ──────────────────────────────────────────────

function writeReports(results: EnrichmentResult[]) {
  fs.mkdirSync(path.dirname(REPORT_MD_PATH), { recursive: true });

  const trusted = results.filter(r => r.status === "trusted");
  const confirmed = results.filter(r => r.status === "confirmed");
  const corrected = results.filter(r => r.status === "corrected");
  const revoked = results.filter(r => r.status === "revoked");
  const newlyVerified = results.filter(r => r.status === "newly-verified");
  const manualReview = results.filter(r => r.status === "manual-review");
  const notFound = results.filter(r => r.status === "not-found");
  const apiErrors = results.filter(r => r.status === "api-error");

  // Manual review JSON
  fs.writeFileSync(MANUAL_REVIEW_PATH, JSON.stringify(manualReview, null, 2));

  // Markdown report
  let md = `# Enrichment Report\n\nGenerated: ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n| Category | Count |\n|----------|-------|\n`;
  md += `| Trusted (original 23) | ${trusted.length} |\n`;
  md += `| Confirmed (API matches stored ID) | ${confirmed.length} |\n`;
  md += `| Corrected (API returned different ID) | ${corrected.length} |\n`;
  md += `| Revoked (set back to null) | ${revoked.length} |\n`;
  md += `| Newly verified | ${newlyVerified.length} |\n`;
  md += `| Manual review required | ${manualReview.length} |\n`;
  md += `| Not found | ${notFound.length} |\n`;
  md += `| API errors | ${apiErrors.length} |\n`;
  md += `| **Total verified after run** | **${trusted.length + confirmed.length + corrected.length + newlyVerified.length}** |\n`;
  md += `| Quota used | ~${quotaUsed} units |\n\n`;


  if (corrected.length > 0) {
    md += `## Corrected IDs\n\n| Slug | Previous ID | Correct ID | API Title |\n|------|-------------|------------|----------|\n`;
    for (const r of corrected) md += `| ${r.slug} | \`${r.previousChannelId}\` | \`${r.apiChannelId}\` | ${r.apiTitle} |\n`;
    md += `\n`;
  }

  if (revoked.length > 0) {
    md += `## Revoked (set back to null)\n\n| Slug | Previous ID | Reason |\n|------|-------------|--------|\n`;
    for (const r of revoked) md += `| ${r.slug} | \`${r.previousChannelId}\` | ${r.reason} |\n`;
    md += `\n`;
  }

  if (newlyVerified.length > 0) {
    md += `## Newly Verified\n\n| Slug | Channel ID | Title | Confidence |\n|------|-----------|-------|------------|\n`;
    for (const r of newlyVerified) md += `| ${r.slug} | \`${r.apiChannelId}\` | ${r.apiTitle} | ${((r.confidence ?? 0) * 100).toFixed(0)}% |\n`;
    md += `\n`;
  }

  if (manualReview.length > 0) {
    md += `## Manual Review Required\n\n| Slug | Handle | API Title | API ID | Confidence | Reason |\n|------|--------|-----------|--------|------------|--------|\n`;
    for (const r of manualReview) md += `| ${r.slug} | ${r.handle} | ${r.apiTitle ?? "—"} | \`${r.apiChannelId ?? "—"}\` | ${((r.confidence ?? 0) * 100).toFixed(0)}% | ${r.reason} |\n`;
    md += `\n`;
  }

  if (notFound.length > 0) {
    md += `## Not Found\n\n`;
    for (const r of notFound) md += `- ${r.slug} (${r.handle})\n`;
    md += `\n`;
  }

  if (confirmed.length > 0) {
    md += `## Confirmed Existing IDs\n\n| Slug | Channel ID | API Title |\n|------|-----------|----------|\n`;
    for (const r of confirmed) md += `| ${r.slug} | \`${r.apiChannelId}\` | ${r.apiTitle} |\n`;
    md += `\n`;
  }

  fs.writeFileSync(REPORT_MD_PATH, md);
  console.log(`\n📄 Reports:`);
  console.log(`   ${REPORT_MD_PATH}`);
  console.log(`   ${MANUAL_REVIEW_PATH}`);
}


// ─── Main Processing ────────────────────────────────────────────────

async function processCreator(creator: DatasetCreator, seenIds: Set<string>): Promise<EnrichmentResult> {
  const base = {
    slug: creator.slug,
    name: creator.name,
    handle: creator.handle,
    previousChannelId: creator.youtubeChannelId,
  };

  // Validate handle format
  const h = creator.handle.trim();
  if (!h || !/^@[A-Za-z0-9_.-]{1,60}$/.test(h.startsWith("@") ? h : `@${h}`)) {
    return { ...base, status: "not-found", reason: "invalid handle format" };
  }

  // Strategy 1: channels.list(forHandle)
  let channel: ApiChannel | null = null;
  try {
    channel = await lookupByHandle(creator.handle);
  } catch (err) {
    if ((err as Error).message === "QUOTA_EXCEEDED") throw err;
    return { ...base, status: "api-error", reason: (err as Error).message };
  }

  // Strategy 2: search.list fallback (if handle lookup returned nothing)
  if (!channel) {
    await sleep(DELAY_MS);
    try {
      channel = await searchChannel(creator.name);
    } catch (err) {
      if ((err as Error).message === "QUOTA_EXCEEDED") throw err;
    }
  }

  if (!channel && searchCallsUsed < MAX_SEARCH_CALLS) {
    await sleep(DELAY_MS);
    try {
      channel = await searchChannel(`${creator.name} official`);
    } catch (err) {
      if ((err as Error).message === "QUOTA_EXCEEDED") throw err;
    }
  }

  // No result at all
  if (!channel) {
    if (creator.youtubeChannelId) {
      // Was marked verified but can't confirm — revoke
      return { ...base, status: "revoked", reason: "no channel found via handle or search" };
    }
    return { ...base, status: "not-found", reason: "no channel found" };
  }

  // Duplicate check
  if (seenIds.has(channel.id)) {
    if (creator.youtubeChannelId === channel.id) {
      return { ...base, status: "revoked", reason: `channel ${channel.id} already claimed by another creator` };
    }
    return { ...base, status: "not-found", reason: `resolved to ${channel.id} but it's a duplicate` };
  }

  // Score the match
  const { confidence, reasons } = scoreMatch(creator, channel);
  const channelData = {
    apiChannelId: channel.id,
    apiTitle: channel.snippet.title,
    apiHandle: channel.snippet.customUrl ?? undefined,
    apiAvatar: channel.snippet.thumbnails?.high?.url ?? channel.snippet.thumbnails?.default?.url ?? undefined,
    apiBanner: channel.brandingSettings?.image?.bannerExternalUrl ?? undefined,
    apiCountry: channel.snippet.country ?? undefined,
    confidence,
    reason: reasons.join("; "),
  };

  // Decision
  if (confidence >= CONFIDENCE_THRESHOLD) {
    seenIds.add(channel.id);
    if (creator.youtubeChannelId === channel.id) {
      return { ...base, ...channelData, status: "confirmed" };
    } else if (creator.youtubeChannelId && creator.youtubeChannelId !== channel.id) {
      return { ...base, ...channelData, status: "corrected" };
    } else {
      return { ...base, ...channelData, status: "newly-verified" };
    }
  } else {
    // Below threshold
    if (creator.youtubeChannelId) {
      return { ...base, ...channelData, status: "revoked", reason: `confidence ${(confidence * 100).toFixed(0)}% < 95% — cannot confirm stored ID` };
    }
    return { ...base, ...channelData, status: "manual-review" };
  }
}


// ─── Entry Point ────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const writeMode = args.includes("--write");

  console.log("═══════════════════════════════════════════");
  console.log("  Creator Enrichment — Live API Verification");
  console.log("═══════════════════════════════════════════");
  console.log(`  Mode: ${writeMode ? "WRITE (will modify dataset)" : "DRY-RUN (report only)"}`);
  console.log("");

  API_KEY = process.env.YOUTUBE_API_KEY ?? "";
  if (!API_KEY || API_KEY.length < 10) {
    console.error("❌ YOUTUBE_API_KEY not set.");
    console.error("   export YOUTUBE_API_KEY=AIza...");
    process.exit(1);
  }
  console.log("  API key: present ✓\n");

  const creators = readDataset();
  console.log(`  Dataset: ${creators.length} creators\n`);

  const results: EnrichmentResult[] = [];
  const seenIds = new Set<string>();

  // Phase 1: Trusted creators (original 23)
  const trusted = creators.filter(c => ORIGINAL_TRUSTED.has(c.slug));
  for (const c of trusted) {
    if (c.youtubeChannelId) seenIds.add(c.youtubeChannelId);
    results.push({
      slug: c.slug,
      name: c.name,
      handle: c.handle,
      previousChannelId: c.youtubeChannelId,
      status: "trusted",
      apiChannelId: c.youtubeChannelId ?? undefined,
    });
  }
  console.log(`  Phase 1: ${trusted.length} trusted (original 23)\n`);

  // Phase 2+3: All other creators (revalidate + enrich)
  const toProcess = creators.filter(c => !ORIGINAL_TRUSTED.has(c.slug));
  console.log(`  Phase 2+3: Processing ${toProcess.length} creators...\n`);

  for (let i = 0; i < toProcess.length; i++) {
    const c = toProcess[i];
    const prefix = `  [${i+1}/${toProcess.length}]`;
    process.stdout.write(`${prefix} ${c.slug} (${c.handle})... `);

    try {
      const result = await processCreator(c, seenIds);
      results.push(result);

      const iconMap: Record<ResultStatus, string> = {
        "trusted": "🔒 trusted",
        "confirmed": "✅ confirmed",
        "corrected": "🔄 corrected",
        "revoked": "⛔ revoked",
        "newly-verified": "🆕 verified",
        "manual-review": "🟡 review",
        "not-found": "⚪ not found",
        "api-error": "❌ error",
      } satisfies Record<ResultStatus, string>;
      const icon = iconMap[result.status];

      console.log(`${icon}${result.apiChannelId ? ` → ${result.apiChannelId}` : ""}`);
    } catch (err) {
      if ((err as Error).message === "QUOTA_EXCEEDED") {
        console.log("🛑 QUOTA EXCEEDED — stopping");
        results.push({
          slug: c.slug, name: c.name, handle: c.handle,
          previousChannelId: c.youtubeChannelId,
          status: "api-error", reason: "QUOTA_EXCEEDED",
        });
        break;
      }
      console.log(`❌ ${(err as Error).message}`);
      results.push({
        slug: c.slug, name: c.name, handle: c.handle,
        previousChannelId: c.youtubeChannelId,
        status: "api-error", reason: (err as Error).message,
      });
    }

    await sleep(DELAY_MS);
  }

  // Write reports
  writeReports(results);

  // Summary
  const summary = {
    trusted: results.filter(r => r.status === "trusted").length,
    confirmed: results.filter(r => r.status === "confirmed").length,
    corrected: results.filter(r => r.status === "corrected").length,
    revoked: results.filter(r => r.status === "revoked").length,
    newlyVerified: results.filter(r => r.status === "newly-verified").length,
    manualReview: results.filter(r => r.status === "manual-review").length,
    notFound: results.filter(r => r.status === "not-found").length,
    apiError: results.filter(r => r.status === "api-error").length,
  };

  console.log("\n═══════════════════════════════════════════");
  console.log("  RESULTS");
  console.log("═══════════════════════════════════════════");
  console.log(`  Trusted (original 23):    ${summary.trusted}`);
  console.log(`  Confirmed existing IDs:   ${summary.confirmed}`);
  console.log(`  Corrected IDs:            ${summary.corrected}`);
  console.log(`  Revoked (set to null):    ${summary.revoked}`);
  console.log(`  Newly verified:           ${summary.newlyVerified}`);
  console.log(`  Manual review:            ${summary.manualReview}`);
  console.log(`  Not found:                ${summary.notFound}`);
  console.log(`  API errors:               ${summary.apiError}`);
  console.log(`  Quota used:               ~${quotaUsed} units`);
  console.log(`  Search calls:             ${searchCallsUsed}/${MAX_SEARCH_CALLS}`);
  const totalVerified = summary.trusted + summary.confirmed + summary.corrected + summary.newlyVerified;
  console.log(`\n  TOTAL VERIFIED: ${totalVerified} / ${creators.length}`);
  console.log("═══════════════════════════════════════════\n");

  // Apply writes if requested
  if (writeMode) {
    const changes = applyResults(results);
    console.log(`  ✏️  Applied ${changes} changes to dataset.ts`);
  } else {
    const wouldChange = results.filter(r =>
      ["corrected", "revoked", "newly-verified"].includes(r.status)
    ).length;
    if (wouldChange > 0) {
      console.log(`  ℹ️  ${wouldChange} changes ready. Run with --write to apply.`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
