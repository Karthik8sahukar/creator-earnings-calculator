#!/usr/bin/env npx tsx
/**
 * Creator Verification Script (v2 — Pipeline-aware)
 *
 * Verifies creator YouTube channel IDs using channels.list(forHandle).
 * Works with both the canonical dataset.ts AND the pipeline creators.json.
 *
 * Strategy:
 *   1. channels.list(forHandle=@handle) — 1 quota unit per creator
 *   2. Validate returned channel against stored data (handle + title match)
 *   3. Classify: verified | probable | mismatch | not_found | error
 *
 * Does NOT use search.list (expensive). For search-based resolution,
 * use enrich-creators-v2.ts instead.
 *
 * Output:
 *   - reports/verification-report.md
 *   - reports/missing-channel-ids.json
 *   - (with --write) updates dataset.ts and/or pipeline creators.json
 *
 * Usage:
 *   npx tsx scripts/verify-creators-v2.ts              # dry-run
 *   npx tsx scripts/verify-creators-v2.ts --write      # apply updates
 *   npx tsx scripts/verify-creators-v2.ts --only-new   # only pipeline creators
 *
 * Requires: YOUTUBE_API_KEY environment variable
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  PATHS,
  normalizeHandle,
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
const DELAY_MS = 220; // Stay under 5 QPS
const MAX_RETRIES = 2;
const BACKOFF_MS = 2000;

// ─── Types ──────────────────────────────────────────────────────────

interface ApiChannel {
  id: string;
  snippet: {
    title: string;
    customUrl?: string;
    country?: string;
    thumbnails?: {
      default?: { url: string };
      high?: { url: string };
    };
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
  };
  brandingSettings?: {
    image?: { bannerExternalUrl?: string };
  };
}

interface ApiResponse {
  items?: ApiChannel[];
}

type VerifyStatus =
  | "already-verified"
  | "verified"
  | "probable"
  | "mismatch"
  | "not-found"
  | "invalid-handle"
  | "api-error"
  | "quota-exceeded";

interface VerifyResult {
  slug: string;
  name: string;
  handle: string;
  status: VerifyStatus;
  previousChannelId: string | null;
  resolvedChannelId?: string;
  resolvedTitle?: string;
  resolvedHandle?: string;
  resolvedAvatar?: string;
  resolvedBanner?: string;
  resolvedCountry?: string;
  subscriberCount?: number;
  viewCount?: number;
  videoCount?: number;
  confidence?: number;
  reason?: string;
}

// ─── API Client ─────────────────────────────────────────────────────

let API_KEY = "";
let quotaUsed = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function lookupChannel(handle: string): Promise<ApiChannel | null> {
  const h = handle.startsWith("@") ? handle : `@${handle}`;
  const url = new URL(`${API_BASE}/channels`);
  url.searchParams.set("part", "id,snippet,statistics,brandingSettings");
  url.searchParams.set("forHandle", h);
  url.searchParams.set("maxResults", "1");
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
        return null;
      }

      if (res.status === 429 || res.status >= 500) {
        if (attempt === MAX_RETRIES) return null;
        await sleep(BACKOFF_MS * (attempt + 1));
        continue;
      }

      if (!res.ok) return null;

      const data = await res.json() as ApiResponse;
      return data.items?.[0] ?? null;
    } catch (err) {
      if ((err as Error).message === "QUOTA_EXCEEDED") throw err;
      if (attempt === MAX_RETRIES) return null;
      await sleep(BACKOFF_MS * (attempt + 1));
    }
  }
  return null;
}

// ─── Match scoring ──────────────────────────────────────────────────

function scoreMatch(
  storedName: string,
  storedHandle: string,
  channel: ApiChannel,
): { confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Handle match (weight: 0.50)
  const sHandle = normalizeHandle(storedHandle);
  const aHandle = normalizeHandle(channel.snippet.customUrl ?? "");
  if (aHandle && sHandle === aHandle) {
    score += 0.50;
    reasons.push("handle exact");
  } else if (aHandle && sHandle.includes(aHandle) || aHandle.includes(sHandle)) {
    score += 0.30;
    reasons.push("handle partial");
  }

  // Title match (weight: 0.35)
  const sName = storedName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const aTitle = channel.snippet.title.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (sName === aTitle) {
    score += 0.35;
    reasons.push("title exact");
  } else if (sName.includes(aTitle) || aTitle.includes(sName)) {
    score += 0.25;
    reasons.push("title contains");
  }

  // Channel ID format check (weight: 0.15) — valid UC prefix
  if (channel.id.startsWith("UC") && channel.id.length === 24) {
    score += 0.15;
    reasons.push("valid channel ID format");
  }

  return { confidence: Math.min(score, 1.0), reasons };
}

// ─── Process a single creator ───────────────────────────────────────

async function verifyCreator(
  slug: string,
  name: string,
  handle: string,
  existingChannelId: string | null,
  seenIds: Set<string>,
): Promise<VerifyResult> {
  const base = { slug, name, handle, previousChannelId: existingChannelId };

  // Validate handle format
  const h = handle.startsWith("@") ? handle : `@${handle}`;
  if (!/^@[A-Za-z0-9_.-]{1,60}$/.test(h)) {
    return { ...base, status: "invalid-handle", reason: `invalid handle: ${handle}` };
  }

  // API lookup
  let channel: ApiChannel | null;
  try {
    channel = await lookupChannel(handle);
  } catch (err) {
    if ((err as Error).message === "QUOTA_EXCEEDED") {
      return { ...base, status: "quota-exceeded", reason: "quota exhausted" };
    }
    return { ...base, status: "api-error", reason: (err as Error).message };
  }

  if (!channel) {
    return { ...base, status: "not-found", reason: "no channel returned for handle" };
  }

  // Duplicate channel ID check
  if (seenIds.has(channel.id)) {
    return { ...base, status: "mismatch", reason: `channel ${channel.id} already claimed by another creator`, resolvedChannelId: channel.id };
  }

  // Score the match
  const { confidence, reasons } = scoreMatch(name, handle, channel);

  const stats = channel.statistics;
  const resolvedData = {
    resolvedChannelId: channel.id,
    resolvedTitle: channel.snippet.title,
    resolvedHandle: channel.snippet.customUrl ?? undefined,
    resolvedAvatar: channel.snippet.thumbnails?.high?.url ?? undefined,
    resolvedBanner: channel.brandingSettings?.image?.bannerExternalUrl ?? undefined,
    resolvedCountry: channel.snippet.country ?? undefined,
    subscriberCount: stats?.subscriberCount ? parseInt(stats.subscriberCount, 10) : undefined,
    viewCount: stats?.viewCount ? parseInt(stats.viewCount, 10) : undefined,
    videoCount: stats?.videoCount ? parseInt(stats.videoCount, 10) : undefined,
    confidence,
    reason: reasons.join("; "),
  };

  // Classify
  if (confidence >= 0.80) {
    seenIds.add(channel.id);
    return { ...base, ...resolvedData, status: "verified" };
  } else if (confidence >= 0.50) {
    return { ...base, ...resolvedData, status: "probable" };
  } else {
    return { ...base, ...resolvedData, status: "mismatch" };
  }
}

// ─── Report generation ──────────────────────────────────────────────

function generateReport(results: VerifyResult[], totalProcessed: number): string {
  const verified = results.filter(r => r.status === "verified");
  const alreadyVerified = results.filter(r => r.status === "already-verified");
  const probable = results.filter(r => r.status === "probable");
  const mismatches = results.filter(r => r.status === "mismatch");
  const notFound = results.filter(r => r.status === "not-found");
  const invalidHandles = results.filter(r => r.status === "invalid-handle");
  const errors = results.filter(r => r.status === "api-error" || r.status === "quota-exceeded");

  let md = `# Verification Report\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `| Metric | Count |\n|--------|-------|\n`;
  md += `| Total processed | ${totalProcessed} |\n`;
  md += `| Already verified (skipped) | ${alreadyVerified.length} |\n`;
  md += `| Newly verified (≥80% confidence) | ${verified.length} |\n`;
  md += `| Probable match (50–79%) | ${probable.length} |\n`;
  md += `| Mismatch (<50%) | ${mismatches.length} |\n`;
  md += `| Not found | ${notFound.length} |\n`;
  md += `| Invalid handle | ${invalidHandles.length} |\n`;
  md += `| API errors | ${errors.length} |\n`;
  md += `| Quota used | ~${quotaUsed} units |\n\n`;

  if (verified.length > 0) {
    md += `## Newly Verified\n\n`;
    md += `| Slug | Name | Channel ID | API Title | Confidence |\n`;
    md += `|------|------|-----------|-----------|------------|\n`;
    for (const r of verified) {
      md += `| ${r.slug} | ${r.name} | \`${r.resolvedChannelId}\` | ${r.resolvedTitle} | ${((r.confidence ?? 0) * 100).toFixed(0)}% |\n`;
    }
    md += `\n`;
  }

  if (probable.length > 0) {
    md += `## Probable Matches (manual review needed)\n\n`;
    md += `| Slug | Name | Handle | API Title | API Handle | Confidence | Reason |\n`;
    md += `|------|------|--------|-----------|------------|------------|--------|\n`;
    for (const r of probable) {
      md += `| ${r.slug} | ${r.name} | ${r.handle} | ${r.resolvedTitle ?? "—"} | ${r.resolvedHandle ?? "—"} | ${((r.confidence ?? 0) * 100).toFixed(0)}% | ${r.reason ?? ""} |\n`;
    }
    md += `\n`;
  }

  if (notFound.length > 0) {
    md += `## Not Found\n\n`;
    for (const r of notFound) md += `- \`${r.slug}\` — ${r.name} (${r.handle})\n`;
    md += `\n`;
  }

  if (invalidHandles.length > 0) {
    md += `## Invalid Handles\n\n`;
    for (const r of invalidHandles) md += `- \`${r.slug}\` — handle: \`${r.handle}\` — ${r.reason}\n`;
    md += `\n`;
  }

  if (mismatches.length > 0) {
    md += `## Mismatches\n\n`;
    md += `| Slug | Name | Reason |\n|------|------|--------|\n`;
    for (const r of mismatches) md += `| ${r.slug} | ${r.name} | ${r.reason} |\n`;
    md += `\n`;
  }

  return md;
}

// ─── Dataset update ─────────────────────────────────────────────────

function applyToDataset(results: VerifyResult[]): number {
  let content = fs.readFileSync(PATHS.dataset, "utf-8");
  let changes = 0;

  for (const r of results) {
    if (r.status !== "verified" || !r.resolvedChannelId) continue;
    if (r.previousChannelId === r.resolvedChannelId) continue; // Already set

    // Replace youtubeChannelId
    const idPat = new RegExp(
      `(\\{[^}]*slug: "${r.slug}"[^}]*youtubeChannelId: )(?:"[^"]*"|null)`,
    );
    if (idPat.test(content)) {
      content = content.replace(idPat, `$1"${r.resolvedChannelId}"`);
      // Set verified: true
      const vPat = new RegExp(`(\\{[^}]*slug: "${r.slug}"[^}]*verified: )false`);
      content = content.replace(vPat, "$1true");
      changes++;
    }
  }

  if (changes > 0) {
    fs.writeFileSync(PATHS.dataset, content, "utf-8");
  }
  return changes;
}

function applyToPipeline(results: VerifyResult[]): number {
  const pipeline = readJson<PipelineCreator[]>(PATHS.creatorsJson);
  if (!pipeline || pipeline.length === 0) return 0;

  let changes = 0;
  const now = new Date().toISOString();

  for (const r of results) {
    if (r.status !== "verified" || !r.resolvedChannelId) continue;

    const entry = pipeline.find(c => c.slug === r.slug);
    if (!entry) continue;
    if (entry.youtubeChannelId === r.resolvedChannelId) continue;

    entry.youtubeChannelId = r.resolvedChannelId;
    entry.verified = true;
    entry.metadata.verifiedAt = now;
    entry.metadata.verificationConfidence = r.confidence;
    if (r.resolvedAvatar) entry.avatar = r.resolvedAvatar;
    if (r.resolvedBanner) entry.banner = r.resolvedBanner;
    if (r.subscriberCount) entry.metadata.subscriberCount = r.subscriberCount;
    if (r.viewCount) entry.metadata.viewCount = r.viewCount;
    if (r.videoCount) entry.metadata.videoCount = r.videoCount;
    changes++;
  }

  if (changes > 0) {
    writeJson(PATHS.creatorsJson, pipeline);
  }
  return changes;
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const writeMode = args.includes("--write");
  const onlyNew = args.includes("--only-new");

  logSection("Creator Verification Pipeline (v2)");
  log(`  Mode: ${writeMode ? "WRITE" : "DRY-RUN"}`);
  if (onlyNew) log("  Scope: pipeline creators only (--only-new)");

  API_KEY = process.env.YOUTUBE_API_KEY ?? "";
  if (!API_KEY || API_KEY.length < 10) {
    logError("YOUTUBE_API_KEY not set. Export it and re-run.");
    process.exit(1);
  }
  log("  API key: present ✓\n");

  // ── Gather creators to verify ─────────────────────────────────
  const datasetEntries = onlyNew ? [] : readDatasetEntries();
  const pipelineEntries = readJson<PipelineCreator[]>(PATHS.creatorsJson) ?? [];

  interface ToVerify {
    slug: string;
    name: string;
    handle: string;
    channelId: string | null;
    verified: boolean;
    source: "dataset" | "pipeline";
  }

  const toVerify: ToVerify[] = [];

  for (const e of datasetEntries) {
    toVerify.push({
      slug: e.slug,
      name: e.name,
      handle: e.handle,
      channelId: e.youtubeChannelId,
      verified: e.verified,
      source: "dataset",
    });
  }

  for (const e of pipelineEntries) {
    // Avoid duplicates with dataset
    if (toVerify.some(t => t.slug === e.slug)) continue;
    toVerify.push({
      slug: e.slug,
      name: e.name,
      handle: e.handle,
      channelId: e.youtubeChannelId,
      verified: e.verified,
      source: "pipeline",
    });
  }

  log(`  Total creators: ${toVerify.length}`);
  const alreadyVerified = toVerify.filter(c => c.verified && c.channelId);
  const needsVerification = toVerify.filter(c => !c.verified || !c.channelId);
  log(`  Already verified: ${alreadyVerified.length}`);
  log(`  Needs verification: ${needsVerification.length}\n`);

  // ── Collect existing channel IDs for duplicate detection ───────
  const seenIds = new Set(
    alreadyVerified.map(c => c.channelId!).filter(Boolean),
  );

  // ── Process ────────────────────────────────────────────────────
  const results: VerifyResult[] = [];

  // Mark already-verified
  for (const c of alreadyVerified) {
    results.push({
      slug: c.slug,
      name: c.name,
      handle: c.handle,
      previousChannelId: c.channelId,
      status: "already-verified",
    });
  }

  // Verify the rest
  let stopped = false;
  for (let i = 0; i < needsVerification.length; i++) {
    const c = needsVerification[i];
    process.stdout.write(`  [${i + 1}/${needsVerification.length}] ${c.slug} (${c.handle})... `);

    const result = await verifyCreator(c.slug, c.name, c.handle, c.channelId, seenIds);
    results.push(result);

    const icons: Record<VerifyStatus, string> = {
      "already-verified": "🔒",
      "verified": "✅",
      "probable": "🟡",
      "mismatch": "🔴",
      "not-found": "⚪",
      "invalid-handle": "⛔",
      "api-error": "❌",
      "quota-exceeded": "🛑",
    };
    console.log(`${icons[result.status]} ${result.resolvedChannelId ?? result.reason ?? ""}`);

    if (result.status === "quota-exceeded") {
      stopped = true;
      break;
    }

    await sleep(DELAY_MS);
  }

  // ── Generate reports ───────────────────────────────────────────
  const reportMd = generateReport(results, toVerify.length);
  ensureDir(PATHS.reports);
  writeText(PATHS.verificationReport, reportMd);
  logSuccess(`Report: ${PATHS.verificationReport}`);

  // Missing channel IDs report
  const missing = results
    .filter(r => !r.resolvedChannelId && r.status !== "already-verified")
    .map(r => ({ slug: r.slug, name: r.name, handle: r.handle, reason: r.reason ?? r.status }));
  writeJson(PATHS.missingChannelIds, missing);
  logSuccess(`Missing IDs: ${PATHS.missingChannelIds}`);

  // ── Summary ────────────────────────────────────────────────────
  const verified = results.filter(r => r.status === "verified");
  logSection("Verification Summary");
  log(`  Newly verified:    ${verified.length}`);
  log(`  Probable matches:  ${results.filter(r => r.status === "probable").length}`);
  log(`  Not found:         ${results.filter(r => r.status === "not-found").length}`);
  log(`  Invalid handles:   ${results.filter(r => r.status === "invalid-handle").length}`);
  log(`  Mismatches:        ${results.filter(r => r.status === "mismatch").length}`);
  log(`  API errors:        ${results.filter(r => r.status === "api-error").length}`);
  log(`  Quota used:        ~${quotaUsed} units`);
  if (stopped) log("  ⚠ Run stopped early (quota exceeded)");

  // ── Apply writes ───────────────────────────────────────────────
  if (writeMode && verified.length > 0) {
    const dsChanges = applyToDataset(verified.map(r => ({ ...r, status: "verified" as const })));
    const plChanges = applyToPipeline(results);
    log(`\n  ✏️  Dataset updates: ${dsChanges}`);
    log(`  ✏️  Pipeline updates: ${plChanges}`);
  } else if (verified.length > 0) {
    log(`\n  ℹ️  ${verified.length} creators ready to verify. Run with --write to apply.`);
  }
}

main().catch((err) => {
  logError(`Fatal: ${(err as Error).message}`);
  process.exit(1);
});
