#!/usr/bin/env npx tsx
/**
 * Developer-only batch creator verification script.
 *
 * Resolves unverified YouTube handles via channels.list(forHandle=@handle)
 * and produces a reviewable report without modifying the dataset by default.
 *
 * Usage:
 *   npm run creators:verify              # dry-run (default)
 *   npm run creators:verify -- --write   # apply high-confidence updates
 *
 * Requirements:
 *   - YOUTUBE_API_KEY environment variable must be set
 *   - Never runs during builds or production requests
 *   - Never uses search.list
 *
 * Quota: ~1 unit per unverified handle (channels.list cost = 1 unit)
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ─── Types ──────────────────────────────────────────────────────────

interface DatasetCreator {
  id: string;
  slug: string;
  name: string;
  handle: string;
  youtubeChannelId: string | null;
  country: string;
  countryCode: string;
  verified: boolean;
  [key: string]: unknown;
}

interface ApiChannel {
  id: string;
  snippet: {
    title: string;
    customUrl?: string;
    country?: string;
    thumbnails?: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
}

interface ApiResponse {
  items?: ApiChannel[];
  error?: { errors?: Array<{ reason?: string }> };
}

type VerificationStatus =
  | "verified"
  | "probable_match"
  | "mismatch"
  | "not_found"
  | "invalid_handle"
  | "duplicate_channel_id"
  | "api_error";

interface VerificationResult {
  slug: string;
  storedName: string;
  storedHandle: string;
  status: VerificationStatus;
  returnedChannelId?: string;
  returnedTitle?: string;
  returnedCustomUrl?: string;
  returnedThumbnail?: string;
  returnedCountry?: string;
  reason?: string;
}

// ─── Configuration ──────────────────────────────────────────────────

const DELAY_MS = 200;
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

const DATASET_PATH = path.resolve(
  __dirname,
  "../src/data/creators/dataset.ts",
);
const REPORT_JSON_PATH = path.resolve(__dirname, "../reports/creator-verification.json");
const REPORT_MD_PATH = path.resolve(__dirname, "../reports/creator-verification.md");

// ─── Handle Normalization ───────────────────────────────────────────

const VALID_HANDLE_RE = /^@[A-Za-z0-9_.-]{1,60}$/;

const SUSPICIOUS_HANDLES = new Set([
  "@souaborjoshivlogs",
  "@waborcessonnunes",
  "@alaborozoka",
  "@Gaaborles",
]);

interface NormalizeResult {
  valid: boolean;
  handle: string;
  suspicious: boolean;
  reason?: string;
}

function normalizeHandle(raw: string): NormalizeResult {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, handle: "", suspicious: false, reason: "empty" };

  const handle = trimmed.startsWith("@") ? trimmed : `@${trimmed}`;

  if (!VALID_HANDLE_RE.test(handle)) {
    return { valid: false, handle, suspicious: false, reason: "malformed" };
  }

  const suspicious = SUSPICIOUS_HANDLES.has(handle.toLowerCase()) ||
    /abor|abol/i.test(handle);

  return { valid: true, handle, suspicious };
}

// ─── API Client ─────────────────────────────────────────────────────

async function fetchChannel(
  handle: string,
  apiKey: string,
): Promise<{ data: ApiResponse | null; error?: string }> {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "id,snippet");
  url.searchParams.set("forHandle", handle);
  url.searchParams.set("key", apiKey);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url.toString());

      if (res.status === 429 || res.status >= 500) {
        if (attempt === MAX_RETRIES) {
          return { data: null, error: `HTTP ${res.status} after ${MAX_RETRIES} retries` };
        }
        const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
        console.log(`  ⏳ Retrying in ${delay}ms (HTTP ${res.status})...`);
        await sleep(delay);
        continue;
      }

      if (res.status === 403) {
        const body = await res.json() as ApiResponse;
        const reason = body.error?.errors?.[0]?.reason;
        if (reason === "quotaExceeded") {
          return { data: null, error: "QUOTA_EXCEEDED" };
        }
        return { data: null, error: `HTTP 403: ${reason ?? "forbidden"}` };
      }

      if (!res.ok) {
        return { data: null, error: `HTTP ${res.status}` };
      }

      const data = await res.json() as ApiResponse;
      return { data };
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        return { data: null, error: `Network error: ${(err as Error).message}` };
      }
      await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt));
    }
  }
  return { data: null, error: "unreachable" };
}

// ─── Match Validation ───────────────────────────────────────────────

function classifyMatch(
  creator: DatasetCreator,
  channel: ApiChannel,
  seenChannelIds: Set<string>,
): VerificationResult {
  const base: VerificationResult = {
    slug: creator.slug,
    storedName: creator.name,
    storedHandle: creator.handle,
    returnedChannelId: channel.id,
    returnedTitle: channel.snippet.title,
    returnedCustomUrl: channel.snippet.customUrl ?? undefined,
    returnedThumbnail: channel.snippet.thumbnails?.high?.url ?? undefined,
    returnedCountry: channel.snippet.country ?? undefined,
    status: "verified",
  };

  // Duplicate check
  if (seenChannelIds.has(channel.id)) {
    return { ...base, status: "duplicate_channel_id", reason: `Channel ID ${channel.id} already assigned to another creator` };
  }

  // Handle match check
  const storedLower = creator.handle.toLowerCase().replace(/^@/, "");
  const returnedLower = (channel.snippet.customUrl ?? "").toLowerCase().replace(/^@/, "");

  const handleMatches = returnedLower && storedLower === returnedLower;

  // Title similarity check
  const titleLower = channel.snippet.title.toLowerCase();
  const nameLower = creator.name.toLowerCase();
  const titleSimilar = titleLower.includes(nameLower) ||
    nameLower.includes(titleLower) ||
    levenshteinSimilarity(titleLower, nameLower) > 0.6;

  if (handleMatches && titleSimilar) {
    return { ...base, status: "verified" };
  }

  if (handleMatches) {
    return { ...base, status: "probable_match", reason: `Handle matches but title "${channel.snippet.title}" differs from stored "${creator.name}"` };
  }

  if (titleSimilar) {
    return { ...base, status: "probable_match", reason: `Title similar but handle "${channel.snippet.customUrl}" differs from stored "${creator.handle}"` };
  }

  return { ...base, status: "mismatch", reason: `Neither handle nor title match (API: "${channel.snippet.title}" / "${channel.snippet.customUrl}")` };
}

function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const matrix: number[][] = [];
  for (let i = 0; i <= shorter.length; i++) matrix[i] = [i];
  for (let j = 0; j <= longer.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= shorter.length; i++) {
    for (let j = 1; j <= longer.length; j++) {
      const cost = shorter[i - 1] === longer[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return 1 - matrix[shorter.length][longer.length] / longer.length;
}

// ─── Dataset I/O ────────────────────────────────────────────────────

function readDatasetCreators(): DatasetCreator[] {
  const content = fs.readFileSync(DATASET_PATH, "utf-8");
  const entries: DatasetCreator[] = [];
  const regex = /\{\s*id:\s*"([^"]+)".*?\}/gs;
  let match;
  while ((match = regex.exec(content)) !== null) {
    try {
      // Parse individual fields from the matched entry
      const entry = match[0];
      const get = (key: string) => {
        const m = entry.match(new RegExp(`${key}:\\s*(?:"([^"]*)"|(null|true|false))`));
        if (!m) return undefined;
        return m[1] ?? (m[2] === "null" ? null : m[2] === "true" ? true : m[2] === "false" ? false : m[2]);
      };
      entries.push({
        id: get("id") as string,
        slug: get("slug") as string,
        name: get("name") as string,
        handle: get("handle") as string,
        youtubeChannelId: get("youtubeChannelId") as string | null,
        country: get("country") as string,
        countryCode: get("countryCode") as string,
        verified: get("verified") === true || get("verified") === "true",
      });
    } catch {
      // Skip malformed entries
    }
  }
  return entries;
}

function applyUpdates(results: VerificationResult[]): number {
  let content = fs.readFileSync(DATASET_PATH, "utf-8");
  let updated = 0;

  for (const r of results) {
    if (r.status !== "verified" || !r.returnedChannelId) continue;

    // Replace youtubeChannelId: null → "UCXXX..."
    const pattern = new RegExp(
      `(\\{[^}]*slug: "${r.slug}"[^}]*youtubeChannelId: )null`,
    );
    if (pattern.test(content)) {
      content = content.replace(pattern, `$1"${r.returnedChannelId}"`);
      // Also set verified: true
      const verifiedPattern = new RegExp(
        `(\\{[^}]*slug: "${r.slug}"[^}]*verified: )false`,
      );
      content = content.replace(verifiedPattern, "$1true");
      updated++;
    }
  }

  if (updated > 0) {
    fs.writeFileSync(DATASET_PATH, content, "utf-8");
  }
  return updated;
}

// ─── Report Generation ──────────────────────────────────────────────

function generateReport(
  results: VerificationResult[],
  stats: {
    total: number;
    alreadyVerified: number;
    attempted: number;
    malformedHandles: string[];
    suspiciousHandles: string[];
    quotaUsed: number;
  },
) {
  const verified = results.filter((r) => r.status === "verified");
  const probable = results.filter((r) => r.status === "probable_match");
  const mismatches = results.filter((r) => r.status === "mismatch");
  const notFound = results.filter((r) => r.status === "not_found");
  const duplicates = results.filter((r) => r.status === "duplicate_channel_id");
  const apiErrors = results.filter((r) => r.status === "api_error");

  const report = {
    generatedAt: new Date().toISOString(),
    stats: {
      totalDataset: stats.total,
      alreadyVerified: stats.alreadyVerified,
      attempted: stats.attempted,
      newlyVerified: verified.length,
      probableMatches: probable.length,
      mismatches: mismatches.length,
      notFound: notFound.length,
      malformedHandles: stats.malformedHandles.length,
      suspiciousHandles: stats.suspiciousHandles.length,
      duplicateChannelIds: duplicates.length,
      apiErrors: apiErrors.length,
      quotaUsed: stats.quotaUsed,
    },
    malformedHandles: stats.malformedHandles,
    suspiciousHandles: stats.suspiciousHandles,
    results,
  };

  fs.mkdirSync(path.dirname(REPORT_JSON_PATH), { recursive: true });
  fs.writeFileSync(REPORT_JSON_PATH, JSON.stringify(report, null, 2));

  // Markdown report
  let md = `# Creator Verification Report\n\n`;
  md += `Generated: ${report.generatedAt}\n\n`;
  md += `## Summary\n\n`;
  md += `| Metric | Count |\n|--------|-------|\n`;
  md += `| Total dataset | ${stats.total} |\n`;
  md += `| Already verified | ${stats.alreadyVerified} |\n`;
  md += `| Attempted this run | ${stats.attempted} |\n`;
  md += `| Newly verified (high confidence) | ${verified.length} |\n`;
  md += `| Probable matches (needs review) | ${probable.length} |\n`;
  md += `| Mismatches | ${mismatches.length} |\n`;
  md += `| Not found | ${notFound.length} |\n`;
  md += `| Malformed handles | ${stats.malformedHandles.length} |\n`;
  md += `| Suspicious handles | ${stats.suspiciousHandles.length} |\n`;
  md += `| Duplicate channel IDs | ${duplicates.length} |\n`;
  md += `| API errors | ${apiErrors.length} |\n`;
  md += `| Estimated quota used | ${stats.quotaUsed} units |\n\n`;

  if (stats.malformedHandles.length > 0) {
    md += `## Malformed Handles (need manual correction)\n\n`;
    for (const h of stats.malformedHandles) md += `- \`${h}\`\n`;
    md += `\n`;
  }

  if (stats.suspiciousHandles.length > 0) {
    md += `## Suspicious Handles (possible typos)\n\n`;
    for (const h of stats.suspiciousHandles) md += `- \`${h}\`\n`;
    md += `\n`;
  }

  if (probable.length > 0) {
    md += `## Probable Matches (manual review required)\n\n`;
    md += `| Slug | Stored Name | Handle | API Title | Channel ID | Reason |\n`;
    md += `|------|-------------|--------|-----------|------------|--------|\n`;
    for (const r of probable) {
      md += `| ${r.slug} | ${r.storedName} | ${r.storedHandle} | ${r.returnedTitle} | ${r.returnedChannelId} | ${r.reason} |\n`;
    }
    md += `\n`;
  }

  if (mismatches.length > 0) {
    md += `## Mismatches\n\n`;
    md += `| Slug | Stored Name | Handle | API Title | Reason |\n`;
    md += `|------|-------------|--------|-----------|--------|\n`;
    for (const r of mismatches) {
      md += `| ${r.slug} | ${r.storedName} | ${r.storedHandle} | ${r.returnedTitle ?? "—"} | ${r.reason} |\n`;
    }
    md += `\n`;
  }

  if (notFound.length > 0) {
    md += `## Not Found\n\n`;
    for (const r of notFound) md += `- ${r.slug} (${r.storedHandle})\n`;
    md += `\n`;
  }

  fs.writeFileSync(REPORT_MD_PATH, md);
  console.log(`\n📄 Reports written to:`);
  console.log(`   ${REPORT_JSON_PATH}`);
  console.log(`   ${REPORT_MD_PATH}`);
}

// ─── Utilities ──────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const writeMode = args.includes("--write");
  const yesFlag = args.includes("--yes");

  console.log("🔍 Creator Verification Script");
  console.log(`   Mode: ${writeMode ? "WRITE" : "DRY-RUN"}\n`);

  // Require API key
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    console.error("❌ YOUTUBE_API_KEY environment variable is required.");
    console.error("   Set it in your shell: export YOUTUBE_API_KEY=AIza...");
    process.exit(1);
  }
  // Never log the key
  console.log("   API key: present (not shown)\n");

  // Read dataset
  const creators = readDatasetCreators();
  const alreadyVerified = creators.filter((c) => c.verified && c.youtubeChannelId);
  const unverified = creators.filter((c) => !c.verified || !c.youtubeChannelId);

  console.log(`📊 Dataset: ${creators.length} total, ${alreadyVerified.length} verified, ${unverified.length} unverified\n`);

  // Collect existing channel IDs for duplicate detection
  const seenChannelIds = new Set(
    alreadyVerified.map((c) => c.youtubeChannelId!).filter(Boolean),
  );

  const results: VerificationResult[] = [];
  const malformedHandles: string[] = [];
  const suspiciousHandles: string[] = [];
  let quotaUsed = 0;
  let quotaExceeded = false;

  for (let i = 0; i < unverified.length; i++) {
    const creator = unverified[i];

    // Normalize handle
    const normalized = normalizeHandle(creator.handle);
    if (!normalized.valid) {
      malformedHandles.push(`${creator.slug}: ${creator.handle} (${normalized.reason})`);
      results.push({
        slug: creator.slug,
        storedName: creator.name,
        storedHandle: creator.handle,
        status: "invalid_handle",
        reason: normalized.reason,
      });
      continue;
    }

    if (normalized.suspicious) {
      suspiciousHandles.push(`${creator.slug}: ${normalized.handle}`);
    }

    // Fetch from API
    process.stdout.write(`  [${i + 1}/${unverified.length}] ${creator.slug} (${normalized.handle})... `);

    const { data, error } = await fetchChannel(normalized.handle, apiKey);
    quotaUsed++;

    if (error === "QUOTA_EXCEEDED") {
      console.log("🛑 QUOTA EXCEEDED — stopping");
      results.push({
        slug: creator.slug,
        storedName: creator.name,
        storedHandle: creator.handle,
        status: "api_error",
        reason: "QUOTA_EXCEEDED",
      });
      quotaExceeded = true;
      break;
    }

    if (error || !data) {
      console.log(`❌ ${error}`);
      results.push({
        slug: creator.slug,
        storedName: creator.name,
        storedHandle: creator.handle,
        status: "api_error",
        reason: error ?? "unknown",
      });
      await sleep(DELAY_MS);
      continue;
    }

    if (!data.items || data.items.length === 0) {
      console.log("⚪ not found");
      results.push({
        slug: creator.slug,
        storedName: creator.name,
        storedHandle: creator.handle,
        status: "not_found",
      });
      await sleep(DELAY_MS);
      continue;
    }

    const channel = data.items[0];
    const result = classifyMatch(creator, channel, seenChannelIds);
    results.push(result);

    if (result.status === "verified") {
      seenChannelIds.add(channel.id);
      console.log(`✅ ${channel.id}`);
    } else if (result.status === "probable_match") {
      console.log(`🟡 probable (${result.reason})`);
    } else if (result.status === "duplicate_channel_id") {
      console.log(`🔴 duplicate ID`);
    } else {
      console.log(`🔴 mismatch`);
    }

    await sleep(DELAY_MS);
  }

  // Generate report
  generateReport(results, {
    total: creators.length,
    alreadyVerified: alreadyVerified.length,
    attempted: quotaUsed,
    malformedHandles,
    suspiciousHandles,
    quotaUsed,
  });

  // Summary
  const verified = results.filter((r) => r.status === "verified");
  console.log(`\n═══ Summary ═══`);
  console.log(`  Newly verified: ${verified.length}`);
  console.log(`  Probable matches: ${results.filter((r) => r.status === "probable_match").length}`);
  console.log(`  Mismatches: ${results.filter((r) => r.status === "mismatch").length}`);
  console.log(`  Not found: ${results.filter((r) => r.status === "not_found").length}`);
  console.log(`  Malformed: ${malformedHandles.length}`);
  console.log(`  Suspicious: ${suspiciousHandles.length}`);
  console.log(`  API errors: ${results.filter((r) => r.status === "api_error").length}`);
  console.log(`  Quota used: ~${quotaUsed} units`);
  if (quotaExceeded) console.log(`  ⚠️  Run terminated early due to quota exhaustion`);

  // Write mode
  if (writeMode && verified.length > 0) {
    if (!yesFlag) {
      console.log(`\n⚠️  Write mode: ${verified.length} updates ready.`);
      console.log(`   Re-run with --yes to confirm: npm run creators:verify -- --write --yes`);
      process.exit(0);
    }

    console.log(`\n✏️  Applying ${verified.length} updates to dataset...`);
    const applied = applyUpdates(results);
    console.log(`   ✅ ${applied} records updated in dataset.ts`);
  } else if (writeMode && verified.length === 0) {
    console.log("\n   No high-confidence matches to write.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
