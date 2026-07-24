#!/usr/bin/env npx tsx
/**
 * Creator Import Script
 *
 * Imports new creators into the pipeline's intermediate JSON format
 * from various sources (CSV, JSON, or inline). Performs:
 *
 *   1. Input validation (required fields, format checks)
 *   2. Slug generation (if not provided)
 *   3. Duplicate detection against existing dataset
 *   4. Merge into the pipeline creators.json
 *
 * Does NOT modify dataset.ts directly — use build-dataset.ts for that.
 *
 * Usage:
 *   npx tsx scripts/import-creators.ts --file creators-to-add.json
 *   npx tsx scripts/import-creators.ts --file creators.csv
 *   npx tsx scripts/import-creators.ts --inline '{"name":"...", "handle":"..."}'
 *
 * Input JSON format (array of ImportCreatorInput):
 *   [{ "name": "MrBeast", "handle": "@MrBeast", "country": "United States", ... }]
 *
 * Input CSV format:
 *   name,handle,country,countryCode,category,niche,language,description
 *   MrBeast,@MrBeast,United States,US,Entertainment,entertainment,English,"..."
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  PATHS,
  slugify,
  normalizeName,
  normalizeHandle,
  readDatasetEntries,
  readJson,
  writeJson,
  ensureDir,
  log,
  logSuccess,
  logWarn,
  logError,
  logSection,
} from "./pipeline/utils.js";
import type { ImportCreatorInput, PipelineCreator, DuplicateMatch } from "./pipeline/types.js";

// ─── Defaults ───────────────────────────────────────────────────────

const DEFAULTS: Partial<PipelineCreator> = {
  country: "Unknown",
  countryCode: "OTHER",
  language: "English",
  category: "Entertainment",
  niche: "other",
  contentType: "long",
  description: "",
  keywords: [],
  avatar: null,
  banner: null,
  socialLinks: {},
  subscriberTier: "mid",
  verified: false,
  youtubeChannelId: null,
  aliases: [],
};

// ─── Duplicate detection ────────────────────────────────────────────

interface ExistingIndex {
  slugs: Set<string>;
  channelIds: Set<string>;
  handles: Set<string>;
  normalizedNames: Map<string, string>; // normalized → slug
}

function buildExistingIndex(): ExistingIndex {
  const entries = readDatasetEntries();
  const existing = readJson<PipelineCreator[]>(PATHS.creatorsJson) ?? [];

  const allCreators = [
    ...entries.map(e => ({
      slug: e.slug,
      channelId: e.youtubeChannelId,
      handle: e.handle,
      name: e.name,
    })),
    ...existing.map(e => ({
      slug: e.slug,
      channelId: e.youtubeChannelId,
      handle: e.handle,
      name: e.name,
    })),
  ];

  const slugs = new Set(allCreators.map(c => c.slug));
  const channelIds = new Set(
    allCreators.filter(c => c.channelId).map(c => c.channelId!)
  );
  const handles = new Set(
    allCreators.map(c => normalizeHandle(c.handle))
  );
  const normalizedNames = new Map(
    allCreators.map(c => [normalizeName(c.name), c.slug])
  );

  return { slugs, channelIds, handles, normalizedNames };
}

function detectDuplicate(
  input: ImportCreatorInput,
  slug: string,
  index: ExistingIndex,
): DuplicateMatch | null {
  const matchedOn: DuplicateMatch["matchedOn"] = [];

  // Check slug
  if (index.slugs.has(slug)) {
    matchedOn.push("slug");
  }

  // Check channel ID
  if (input.youtubeChannelId && index.channelIds.has(input.youtubeChannelId)) {
    matchedOn.push("channelId");
  }

  // Check handle
  const normalizedH = normalizeHandle(input.handle);
  if (index.handles.has(normalizedH)) {
    matchedOn.push("handle");
  }

  // Check normalized name
  const normalizedN = normalizeName(input.name);
  if (index.normalizedNames.has(normalizedN)) {
    matchedOn.push("normalizedName");
  }

  if (matchedOn.length === 0) return null;

  // Find the conflicting existing entry
  const existingSlug = index.normalizedNames.get(normalizedN) ?? slug;
  const entries = readDatasetEntries();
  const existing = entries.find(e => e.slug === existingSlug) ?? entries.find(e => normalizeHandle(e.handle) === normalizedH);

  return {
    incoming: { slug, name: input.name, handle: input.handle },
    existing: {
      slug: existing?.slug ?? existingSlug,
      name: existing?.name ?? "unknown",
      handle: existing?.handle ?? "unknown",
      channelId: existing?.youtubeChannelId ?? null,
    },
    matchedOn,
    confidence: matchedOn.includes("channelId") || matchedOn.includes("slug") ? "exact" : matchedOn.includes("handle") ? "high" : "medium",
  };
}

// ─── Input parsing ──────────────────────────────────────────────────

function parseJsonInput(filePath: string): ImportCreatorInput[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(content);
  if (Array.isArray(parsed)) return parsed;
  return [parsed]; // Single object
}

function parseCsvInput(filePath: string): ImportCreatorInput[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const results: ImportCreatorInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const entry: Record<string, string> = {};
    for (let j = 0; j < headers.length && j < values.length; j++) {
      entry[headers[j]] = values[j];
    }

    if (!entry.name || !entry.handle) continue;

    results.push({
      name: entry.name,
      handle: entry.handle.startsWith("@") ? entry.handle : `@${entry.handle}`,
      slug: entry.slug || undefined,
      country: entry.country || undefined,
      countryCode: entry.countrycode || entry.country_code || undefined,
      language: entry.language || undefined,
      category: entry.category || undefined,
      niche: entry.niche || undefined,
      contentType: (entry.contenttype || entry.content_type) as ImportCreatorInput["contentType"] || undefined,
      description: entry.description || undefined,
      subscriberTier: (entry.subscribertier || entry.tier) as ImportCreatorInput["subscriberTier"] || undefined,
      source: entry.source || "csv-import",
    });
  }

  return results;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

// ─── Validation ─────────────────────────────────────────────────────

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateInput(input: ImportCreatorInput): ValidationResult {
  const errors: string[] = [];

  if (!input.name || input.name.trim().length === 0) {
    errors.push("name is required");
  }

  if (!input.handle || input.handle.trim().length === 0) {
    errors.push("handle is required");
  } else {
    const h = input.handle.startsWith("@") ? input.handle : `@${input.handle}`;
    if (!/^@[A-Za-z0-9_.-]{1,60}$/.test(h)) {
      errors.push(`handle "${input.handle}" has invalid format`);
    }
  }

  if (input.countryCode && !/^[A-Z]{2}$/.test(input.countryCode) && input.countryCode !== "OTHER") {
    errors.push(`countryCode "${input.countryCode}" is not a valid ISO-3166 alpha-2 code`);
  }

  if (input.youtubeChannelId && !/^UC[A-Za-z0-9_-]{22}$/.test(input.youtubeChannelId)) {
    errors.push(`youtubeChannelId "${input.youtubeChannelId}" has invalid format (expected UC + 22 chars)`);
  }

  return { valid: errors.length === 0, errors };
}

// ─── Transform ──────────────────────────────────────────────────────

function inputToPipelineCreator(input: ImportCreatorInput, slug: string): PipelineCreator {
  const handle = input.handle.startsWith("@") ? input.handle : `@${input.handle}`;

  return {
    id: slug,
    slug,
    name: input.name.trim(),
    handle,
    aliases: input.aliases ?? [],
    youtubeChannelId: input.youtubeChannelId ?? null,
    verified: !!input.youtubeChannelId,
    country: input.country ?? DEFAULTS.country!,
    countryCode: input.countryCode ?? DEFAULTS.countryCode!,
    language: input.language ?? DEFAULTS.language!,
    category: input.category ?? DEFAULTS.category!,
    niche: input.niche ?? DEFAULTS.niche!,
    contentType: input.contentType ?? "long",
    subscriberTier: input.subscriberTier ?? "mid",
    description: input.description ?? "",
    keywords: input.keywords ?? [input.name],
    avatar: null,
    banner: null,
    socialLinks: {},
    metadata: {
      importedAt: new Date().toISOString(),
      source: input.source ?? "manual",
    },
  };
}

// ─── Main ───────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find((_, i) => args[i - 1] === "--file");
  const inlineArg = args.find((_, i) => args[i - 1] === "--inline");
  const dryRun = args.includes("--dry-run");

  logSection("Creator Import Pipeline");
  log(`  Mode: ${dryRun ? "DRY-RUN" : "WRITE"}`);

  // ── Parse input ─────────────────────────────────────────────────
  let inputs: ImportCreatorInput[] = [];

  if (fileArg) {
    const filePath = path.resolve(fileArg);
    if (!fs.existsSync(filePath)) {
      logError(`File not found: ${filePath}`);
      process.exit(1);
    }
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".json") {
      inputs = parseJsonInput(filePath);
    } else if (ext === ".csv") {
      inputs = parseCsvInput(filePath);
    } else {
      logError(`Unsupported file format: ${ext} (use .json or .csv)`);
      process.exit(1);
    }
    log(`  Source: ${filePath}`);
  } else if (inlineArg) {
    try {
      const parsed = JSON.parse(inlineArg);
      inputs = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      logError("Invalid --inline JSON");
      process.exit(1);
    }
    log("  Source: inline");
  } else {
    log("  No input provided. Usage:");
    log("    npx tsx scripts/import-creators.ts --file creators.json");
    log("    npx tsx scripts/import-creators.ts --file creators.csv");
    log('    npx tsx scripts/import-creators.ts --inline \'{"name":"...","handle":"@..."}\'');
    process.exit(0);
  }

  log(`  Input records: ${inputs.length}\n`);

  // ── Build existing index for duplicate detection ────────────────
  const index = buildExistingIndex();
  log(`  Existing creators: ${index.slugs.size} (dataset + pipeline)`);

  // ── Process each input ─────────────────────────────────────────
  const imported: PipelineCreator[] = [];
  const duplicates: DuplicateMatch[] = [];
  const invalid: Array<{ input: ImportCreatorInput; errors: string[] }> = [];

  for (const input of inputs) {
    // Validate
    const validation = validateInput(input);
    if (!validation.valid) {
      invalid.push({ input, errors: validation.errors });
      continue;
    }

    // Generate slug
    const slug = input.slug ?? slugify(input.name);

    // Duplicate check
    const dup = detectDuplicate(input, slug, index);
    if (dup) {
      duplicates.push(dup);
      logWarn(`Duplicate: "${input.name}" matches existing "${dup.existing.name}" on [${dup.matchedOn.join(", ")}]`);
      continue;
    }

    // Transform
    const creator = inputToPipelineCreator(input, slug);
    imported.push(creator);

    // Update index for subsequent duplicate checks within this batch
    index.slugs.add(slug);
    index.handles.add(normalizeHandle(input.handle));
    index.normalizedNames.set(normalizeName(input.name), slug);
    if (input.youtubeChannelId) index.channelIds.add(input.youtubeChannelId);

    logSuccess(`Imported: ${input.name} → ${slug}`);
  }

  // ── Summary ────────────────────────────────────────────────────
  logSection("Import Summary");
  log(`  Total input:     ${inputs.length}`);
  log(`  Imported:        ${imported.length}`);
  log(`  Duplicates:      ${duplicates.length}`);
  log(`  Invalid:         ${invalid.length}`);

  if (invalid.length > 0) {
    log("\n  Invalid entries:");
    for (const { input, errors } of invalid) {
      logError(`  ${input.name ?? "(no name)"}: ${errors.join(", ")}`);
    }
  }

  // ── Write outputs ──────────────────────────────────────────────
  if (!dryRun && imported.length > 0) {
    ensureDir(PATHS.pipelineData);

    // Merge with existing pipeline data
    const existing = readJson<PipelineCreator[]>(PATHS.creatorsJson) ?? [];
    const merged = [...existing, ...imported];
    writeJson(PATHS.creatorsJson, merged);
    logSuccess(`Written ${merged.length} creators to ${PATHS.creatorsJson}`);
  }

  // Always write duplicates report if any found
  if (duplicates.length > 0) {
    writeJson(PATHS.duplicatesJson, duplicates);
    logSuccess(`Duplicates report: ${PATHS.duplicatesJson}`);
  }

  if (dryRun) {
    log("\n  (Dry-run mode — no files written)");
  }
}

main();
