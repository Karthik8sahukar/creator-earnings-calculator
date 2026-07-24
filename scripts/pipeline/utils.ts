/**
 * Shared pipeline utilities.
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ─── Paths ──────────────────────────────────────────────────────────

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "../..");

export const PATHS = {
  root: ROOT,
  dataset: path.join(ROOT, "src/data/creators/dataset.ts"),
  pipelineData: path.join(ROOT, "data/pipeline"),
  creatorsJson: path.join(ROOT, "data/pipeline/creators.json"),
  searchIndex: path.join(ROOT, "data/pipeline/search-index.json"),
  reports: path.join(ROOT, "reports"),
  duplicatesJson: path.join(ROOT, "reports/duplicates.json"),
  missingChannelIds: path.join(ROOT, "reports/missing-channel-ids.json"),
  verificationReport: path.join(ROOT, "reports/verification-report.md"),
  validationReport: path.join(ROOT, "reports/validation-report.md"),
} as const;

// ─── Slug generation ────────────────────────────────────────────────

/**
 * Generate a URL-safe slug from a name.
 * Handles unicode, special characters, and common patterns.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[']/g, "")           // Remove apostrophes
    .replace(/[&]/g, "and")        // & → and
    .replace(/[^a-z0-9\s-]/g, "")  // Remove non-alphanumeric
    .replace(/\s+/g, "-")          // Spaces → hyphens
    .replace(/-+/g, "-")           // Collapse multiple hyphens
    .replace(/^-|-$/g, "");        // Trim leading/trailing hyphens
}

// ─── Name normalization ─────────────────────────────────────────────

/**
 * Normalize a name for duplicate detection.
 * Strips all non-alphanumeric characters and lowercases.
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Normalize a YouTube handle for comparison.
 */
export function normalizeHandle(handle: string): string {
  return handle.toLowerCase().replace(/^@/, "").trim();
}

// ─── File I/O ───────────────────────────────────────────────────────

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Read a JSON file, returning null if it doesn't exist.
 */
export function readJson<T>(filePath: string): T | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Write a JSON file with pretty formatting.
 */
export function writeJson(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

/**
 * Write a text file.
 */
export function writeText(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf-8");
}

// ─── Dataset reading ────────────────────────────────────────────────

/**
 * Parse the TypeScript dataset file into a structured array.
 * This is a regex-based parser that works with the flat single-line
 * entry format used in dataset.ts.
 */
export function readDatasetEntries(): Array<{
  id: string;
  slug: string;
  name: string;
  handle: string;
  youtubeChannelId: string | null;
  country: string;
  countryCode: string;
  language: string;
  category: string;
  niche: string;
  contentType: string;
  description: string;
  keywords: string[];
  verified: boolean;
  subscriberTier: string;
  aliases: string[];
}> {
  const content = fs.readFileSync(PATHS.dataset, "utf-8");
  const entries: ReturnType<typeof readDatasetEntries> = [];

  // Each creator is on a single line starting with `{ id:`
  const lines = content.split("\n");
  for (const line of lines) {
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
    const getArray = (key: string): string[] => {
      const m = trimmed.match(new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`));
      if (!m) return [];
      return m[1].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
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
      language: get("language") ?? "English",
      category: get("category") ?? "",
      niche: get("niche") ?? "other",
      contentType: get("contentType") ?? "long",
      description: get("description") ?? "",
      keywords: getArray("keywords"),
      verified: getBool("verified"),
      subscriberTier: get("subscriberTier") ?? "mid",
      aliases: getArray("aliases"),
    });
  }

  return entries;
}

// ─── Logging ────────────────────────────────────────────────────────

export function log(msg: string): void {
  console.log(msg);
}

export function logSuccess(msg: string): void {
  console.log(`  ✓ ${msg}`);
}

export function logWarn(msg: string): void {
  console.log(`  ⚠ ${msg}`);
}

export function logError(msg: string): void {
  console.error(`  ✗ ${msg}`);
}

export function logSection(title: string): void {
  console.log(`\n═══ ${title} ═══\n`);
}
