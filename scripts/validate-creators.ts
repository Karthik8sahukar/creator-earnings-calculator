#!/usr/bin/env npx tsx
/**
 * Creator Dataset Validation Script
 *
 * Performs comprehensive validation of the entire creator dataset:
 *
 *   1. Schema validation (required fields, format checks)
 *   2. Duplicate detection (slug, channelId, handle, normalized name)
 *   3. Referential integrity (countryCode in COUNTRIES, niche in NICHES)
 *   4. Consistency checks (verified ↔ channelId correlation)
 *   5. Data quality (description length, keyword count, handle format)
 *
 * Output:
 *   - reports/validation-report.md
 *   - reports/duplicates.json
 *   - reports/missing-channel-ids.json
 *   - Exit code 0 = clean, 1 = errors found
 *
 * Usage:
 *   npx tsx scripts/validate-creators.ts
 *   npx tsx scripts/validate-creators.ts --strict   # treat warnings as errors
 */

import {
  PATHS,
  normalizeName,
  normalizeHandle,
  readDatasetEntries,
  readJson,
  writeJson,
  writeText,
  ensureDir,
  log,
  logSuccess,

  logError,
  logSection,
} from "./pipeline/utils.js";
import type { PipelineCreator, DuplicateMatch, ValidationIssue } from "./pipeline/types.js";

// ─── Valid values (from schema and rpmData) ─────────────────────────

const VALID_COUNTRY_CODES = new Set([
  "US", "GB", "CA", "AU", "DE", "FR", "NL", "SE",
  "JP", "KR", "IN", "BR", "MX", "ES", "IT", "ID",
  "PH", "ZA", "AE", "OTHER",
]);

const VALID_NICHES = new Set([
  "finance", "business", "marketing", "tech", "education",
  "health", "auto", "science", "beauty", "lifestyle",
  "food", "travel", "news", "diy", "sports",
  "entertainment", "gaming", "music", "kids", "other",
]);

const VALID_CONTENT_TYPES = new Set(["long", "shorts", "mixed"]);
const VALID_TIERS = new Set(["mega", "large", "mid", "emerging"]);
const HANDLE_RE = /^@[A-Za-z0-9_.-]{1,60}$/;
const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;

// ─── Validation logic ───────────────────────────────────────────────

function validateEntry(entry: ReturnType<typeof readDatasetEntries>[0]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const slug = entry.slug;

  // Required fields
  if (!entry.id) issues.push({ slug, field: "id", severity: "error", message: "Missing id" });
  if (!entry.slug) issues.push({ slug, field: "slug", severity: "error", message: "Missing slug" });
  if (!entry.name || entry.name.trim().length === 0) issues.push({ slug, field: "name", severity: "error", message: "Missing or empty name" });
  if (!entry.handle) issues.push({ slug, field: "handle", severity: "error", message: "Missing handle" });

  // Slug format
  if (entry.slug && !/^[a-z0-9-]+$/.test(entry.slug)) {
    issues.push({ slug, field: "slug", severity: "error", message: `Slug "${entry.slug}" contains invalid characters (must be lowercase alphanumeric + hyphens)` });
  }

  // ID === slug
  if (entry.id !== entry.slug) {
    issues.push({ slug, field: "id", severity: "warning", message: `id "${entry.id}" differs from slug "${entry.slug}" (should be identical)` });
  }

  // Handle format
  if (entry.handle) {
    const h = entry.handle.startsWith("@") ? entry.handle : `@${entry.handle}`;
    if (!HANDLE_RE.test(h)) {
      issues.push({ slug, field: "handle", severity: "error", message: `Handle "${entry.handle}" has invalid format` });
    }
  }

  // Channel ID format (when present)
  if (entry.youtubeChannelId !== null && !CHANNEL_ID_RE.test(entry.youtubeChannelId)) {
    issues.push({ slug, field: "youtubeChannelId", severity: "error", message: `Channel ID "${entry.youtubeChannelId}" has invalid format (expected UC + 22 chars)` });
  }

  // Country code
  if (!VALID_COUNTRY_CODES.has(entry.countryCode)) {
    issues.push({ slug, field: "countryCode", severity: "error", message: `Unknown countryCode "${entry.countryCode}"` });
  }

  // Niche
  if (!VALID_NICHES.has(entry.niche)) {
    issues.push({ slug, field: "niche", severity: "error", message: `Unknown niche "${entry.niche}"` });
  }

  // Content type
  if (!VALID_CONTENT_TYPES.has(entry.contentType)) {
    issues.push({ slug, field: "contentType", severity: "error", message: `Unknown contentType "${entry.contentType}"` });
  }

  // Subscriber tier
  if (!VALID_TIERS.has(entry.subscriberTier)) {
    issues.push({ slug, field: "subscriberTier", severity: "error", message: `Unknown subscriberTier "${entry.subscriberTier}"` });
  }

  // Verified ↔ channelId consistency
  if (entry.verified && !entry.youtubeChannelId) {
    issues.push({ slug, field: "verified", severity: "error", message: "Creator is verified but has no youtubeChannelId" });
  }
  if (!entry.verified && entry.youtubeChannelId) {
    issues.push({ slug, field: "verified", severity: "warning", message: "Creator has channelId but is not marked verified" });
  }

  // Description quality
  if (!entry.description || entry.description.length < 10) {
    issues.push({ slug, field: "description", severity: "warning", message: "Description is missing or too short (<10 chars)" });
  }

  // Keywords
  if (!entry.keywords || entry.keywords.length === 0) {
    issues.push({ slug, field: "keywords", severity: "warning", message: "No keywords defined" });
  }

  // Country name present
  if (!entry.country || entry.country.trim().length === 0) {
    issues.push({ slug, field: "country", severity: "warning", message: "Country display name is empty" });
  }

  // Language
  if (!entry.language || entry.language.trim().length === 0) {
    issues.push({ slug, field: "language", severity: "warning", message: "Language is empty" });
  }

  return issues;
}

// ─── Duplicate detection ────────────────────────────────────────────

function detectDuplicates(entries: ReturnType<typeof readDatasetEntries>): DuplicateMatch[] {
  const duplicates: DuplicateMatch[] = [];

  const slugMap = new Map<string, typeof entries[0]>();
  const channelIdMap = new Map<string, typeof entries[0]>();
  const handleMap = new Map<string, typeof entries[0]>();
  const nameMap = new Map<string, typeof entries[0]>();

  for (const entry of entries) {
    const matchedOn: DuplicateMatch["matchedOn"] = [];
    let existingEntry: typeof entries[0] | undefined;

    // Slug duplicate
    if (slugMap.has(entry.slug)) {
      matchedOn.push("slug");
      existingEntry = slugMap.get(entry.slug)!;
    }

    // Channel ID duplicate
    if (entry.youtubeChannelId && channelIdMap.has(entry.youtubeChannelId)) {
      matchedOn.push("channelId");
      existingEntry = existingEntry ?? channelIdMap.get(entry.youtubeChannelId)!;
    }

    // Handle duplicate
    const normHandle = normalizeHandle(entry.handle);
    if (handleMap.has(normHandle)) {
      matchedOn.push("handle");
      existingEntry = existingEntry ?? handleMap.get(normHandle)!;
    }

    // Normalized name duplicate
    const normName = normalizeName(entry.name);
    if (nameMap.has(normName)) {
      matchedOn.push("normalizedName");
      existingEntry = existingEntry ?? nameMap.get(normName)!;
    }

    if (matchedOn.length > 0 && existingEntry) {
      duplicates.push({
        incoming: { slug: entry.slug, name: entry.name, handle: entry.handle },
        existing: {
          slug: existingEntry.slug,
          name: existingEntry.name,
          handle: existingEntry.handle,
          channelId: existingEntry.youtubeChannelId,
        },
        matchedOn,
        confidence: matchedOn.includes("channelId") || matchedOn.includes("slug") ? "exact" : matchedOn.includes("handle") ? "high" : "medium",
      });
    }

    // Register this entry
    slugMap.set(entry.slug, entry);
    if (entry.youtubeChannelId) channelIdMap.set(entry.youtubeChannelId, entry);
    handleMap.set(normHandle, entry);
    nameMap.set(normName, entry);
  }

  return duplicates;
}

// ─── Report generation ──────────────────────────────────────────────

function generateValidationReport(
  entries: ReturnType<typeof readDatasetEntries>,
  issues: ValidationIssue[],
  duplicates: DuplicateMatch[],
): string {
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const creatorsWithErrors = new Set(errors.map(i => i.slug));
  const creatorsWithWarnings = new Set(warnings.map(i => i.slug));

  let md = `# Validation Report\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `| Metric | Count |\n|--------|-------|\n`;
  md += `| Total creators | ${entries.length} |\n`;
  md += `| Verified | ${entries.filter(e => e.verified).length} |\n`;
  md += `| Unverified | ${entries.filter(e => !e.verified).length} |\n`;
  md += `| Errors | ${errors.length} |\n`;
  md += `| Warnings | ${warnings.length} |\n`;
  md += `| Creators with errors | ${creatorsWithErrors.size} |\n`;
  md += `| Creators with warnings | ${creatorsWithWarnings.size} |\n`;
  md += `| Duplicates detected | ${duplicates.length} |\n`;
  md += `| Unique countries | ${new Set(entries.map(e => e.countryCode)).size} |\n`;
  md += `| Unique categories | ${new Set(entries.map(e => e.category)).size} |\n`;
  md += `| Missing channel IDs | ${entries.filter(e => !e.youtubeChannelId).length} |\n\n`;

  // Health score
  const healthScore = Math.max(0, 100 - (errors.length * 5) - (warnings.length * 1) - (duplicates.length * 10));
  md += `**Dataset Health Score: ${healthScore}/100**\n\n`;

  if (duplicates.length > 0) {
    md += `## Duplicates\n\n`;
    md += `| Incoming | Existing | Matched On | Confidence |\n`;
    md += `|----------|----------|-----------|------------|\n`;
    for (const d of duplicates) {
      md += `| ${d.incoming.slug} (${d.incoming.name}) | ${d.existing.slug} (${d.existing.name}) | ${d.matchedOn.join(", ")} | ${d.confidence} |\n`;
    }
    md += `\n`;
  }

  if (errors.length > 0) {
    md += `## Errors\n\n`;
    md += `| Slug | Field | Message |\n|------|-------|---------|\n`;
    for (const issue of errors) {
      md += `| ${issue.slug} | ${issue.field} | ${issue.message} |\n`;
    }
    md += `\n`;
  }

  if (warnings.length > 0) {
    md += `## Warnings\n\n`;
    md += `| Slug | Field | Message |\n|------|-------|---------|\n`;
    for (const issue of warnings.slice(0, 50)) {
      md += `| ${issue.slug} | ${issue.field} | ${issue.message} |\n`;
    }
    if (warnings.length > 50) {
      md += `| ... | | ${warnings.length - 50} more warnings |\n`;
    }
    md += `\n`;
  }

  // Coverage stats
  md += `## Coverage\n\n`;
  md += `| Country | Creators | Verified |\n|---------|----------|----------|\n`;
  const byCountry = new Map<string, { total: number; verified: number }>();
  for (const e of entries) {
    const existing = byCountry.get(e.country) ?? { total: 0, verified: 0 };
    existing.total++;
    if (e.verified) existing.verified++;
    byCountry.set(e.country, existing);
  }
  for (const [country, stats] of Array.from(byCountry.entries()).sort((a, b) => b[1].total - a[1].total)) {
    md += `| ${country} | ${stats.total} | ${stats.verified} |\n`;
  }
  md += `\n`;

  md += `| Category | Creators |\n|----------|----------|\n`;
  const byCategory = new Map<string, number>();
  for (const e of entries) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + 1);
  }
  for (const [cat, count] of Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])) {
    md += `| ${cat} | ${count} |\n`;
  }

  return md;
}

// ─── Main ───────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");

  logSection("Creator Dataset Validation");
  log(`  Mode: ${strict ? "STRICT (warnings = errors)" : "NORMAL"}`);

  // ── Read all creators ──────────────────────────────────────────
  const datasetEntries = readDatasetEntries();
  const pipelineEntries = readJson<PipelineCreator[]>(PATHS.creatorsJson) ?? [];

  // Combine for validation (dataset is authoritative)
  const allEntries = [...datasetEntries];
  for (const p of pipelineEntries) {
    if (allEntries.some(e => e.slug === p.slug)) continue;
    allEntries.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      handle: p.handle,
      youtubeChannelId: p.youtubeChannelId,
      country: p.country,
      countryCode: p.countryCode,
      language: p.language,
      category: p.category,
      niche: p.niche,
      contentType: p.contentType,
      description: p.description,
      keywords: p.keywords,
      verified: p.verified,
      subscriberTier: p.subscriberTier,
      aliases: p.aliases,
    });
  }

  log(`  Dataset entries: ${datasetEntries.length}`);
  log(`  Pipeline entries: ${pipelineEntries.length}`);
  log(`  Total validated: ${allEntries.length}\n`);

  // ── Validate each entry ────────────────────────────────────────
  const allIssues: ValidationIssue[] = [];
  for (const entry of allEntries) {
    const issues = validateEntry(entry);
    allIssues.push(...issues);
  }

  // ── Detect duplicates ──────────────────────────────────────────
  const duplicates = detectDuplicates(allEntries);

  // ── Collect missing channel IDs ────────────────────────────────
  const missingIds = allEntries
    .filter(e => !e.youtubeChannelId)
    .map(e => ({ slug: e.slug, name: e.name, handle: e.handle, country: e.country, category: e.category }));

  // ── Write reports ──────────────────────────────────────────────
  ensureDir(PATHS.reports);

  const reportMd = generateValidationReport(allEntries, allIssues, duplicates);
  writeText(PATHS.validationReport, reportMd);
  logSuccess(`Validation report: ${PATHS.validationReport}`);

  writeJson(PATHS.duplicatesJson, duplicates);
  logSuccess(`Duplicates: ${PATHS.duplicatesJson} (${duplicates.length} found)`);

  writeJson(PATHS.missingChannelIds, missingIds);
  logSuccess(`Missing channel IDs: ${PATHS.missingChannelIds} (${missingIds.length} entries)`);

  // ── Summary ────────────────────────────────────────────────────
  const errors = allIssues.filter(i => i.severity === "error");
  const warnings = allIssues.filter(i => i.severity === "warning");

  logSection("Validation Summary");
  log(`  Total creators: ${allEntries.length}`);
  log(`  Errors:         ${errors.length}`);
  log(`  Warnings:       ${warnings.length}`);
  log(`  Duplicates:     ${duplicates.length}`);
  log(`  Missing IDs:    ${missingIds.length}`);

  const healthScore = Math.max(0, 100 - (errors.length * 5) - (warnings.length * 1) - (duplicates.length * 10));
  log(`\n  Health Score:   ${healthScore}/100`);

  if (errors.length > 0) {
    log("\n  Top errors:");
    for (const e of errors.slice(0, 5)) {
      logError(`${e.slug}.${e.field}: ${e.message}`);
    }
    if (errors.length > 5) log(`  ... and ${errors.length - 5} more`);
  }

  // ── Exit code ──────────────────────────────────────────────────
  const hasErrors = errors.length > 0 || duplicates.length > 0;
  const hasWarningsAsErrors = strict && warnings.length > 0;

  if (hasErrors || hasWarningsAsErrors) {
    logError(`\nValidation FAILED (${errors.length} errors, ${duplicates.length} duplicates)`);
    process.exit(1);
  } else {
    logSuccess(`\nValidation PASSED ✓`);
    process.exit(0);
  }
}

main();
