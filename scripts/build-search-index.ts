#!/usr/bin/env npx tsx
/**
 * Search Index Builder
 *
 * Builds a pre-computed search index from the creator dataset +
 * pipeline data. The index supports fast client-side matching on:
 *
 *   - Creator names
 *   - Aliases (alternative names, former names)
 *   - YouTube handles
 *   - Countries
 *   - Categories / niches
 *   - Keywords
 *
 * Output:
 *   - data/pipeline/search-index.json
 *   - src/data/creators/search-index.ts (importable at runtime)
 *
 * The index is a flat array of SearchIndexEntry objects. Each entry
 * has a pre-computed `tokens` array of normalized lowercase strings
 * that the frontend search can match against with simple .includes().
 *
 * Usage:
 *   npx tsx scripts/build-search-index.ts
 */

import * as path from "node:path";
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
  logSection,
} from "./pipeline/utils.js";
import type { PipelineCreator, SearchIndexEntry } from "./pipeline/types.js";

// ─── Token generation ───────────────────────────────────────────────

/**
 * Generate searchable tokens for a creator.
 * Tokens are normalized, deduplicated lowercase strings.
 */
function generateTokens(entry: {
  name: string;
  handle: string;
  aliases: string[];
  country: string;
  countryCode: string;
  category: string;
  niche: string;
  keywords: string[];
}): string[] {
  const tokens = new Set<string>();

  // Name — full and individual words
  const nameLower = entry.name.toLowerCase().trim();
  tokens.add(nameLower);
  for (const word of nameLower.split(/\s+/)) {
    if (word.length >= 2) tokens.add(word);
  }

  // Normalized name (no spaces/special chars)
  tokens.add(normalizeName(entry.name));

  // Handle (without @)
  const handle = normalizeHandle(entry.handle);
  if (handle.length >= 2) tokens.add(handle);

  // Aliases
  for (const alias of entry.aliases) {
    const aliasLower = alias.toLowerCase().trim();
    tokens.add(aliasLower);
    tokens.add(normalizeName(alias));
    for (const word of aliasLower.split(/\s+/)) {
      if (word.length >= 2) tokens.add(word);
    }
  }

  // Country
  tokens.add(entry.country.toLowerCase());
  tokens.add(entry.countryCode.toLowerCase());

  // Category and niche
  tokens.add(entry.category.toLowerCase());
  tokens.add(entry.niche.toLowerCase());

  // Keywords
  for (const kw of entry.keywords) {
    const kwLower = kw.toLowerCase().trim();
    tokens.add(kwLower);
    for (const word of kwLower.split(/\s+/)) {
      if (word.length >= 2) tokens.add(word);
    }
  }

  // Remove empty tokens
  tokens.delete("");

  return Array.from(tokens);
}

// ─── Main ───────────────────────────────────────────────────────────

function main() {
  logSection("Search Index Builder");

  // ── Gather all creators ────────────────────────────────────────
  const datasetEntries = readDatasetEntries();
  const pipelineEntries = readJson<PipelineCreator[]>(PATHS.creatorsJson) ?? [];

  // Merge: dataset takes priority, pipeline fills gaps
  const seen = new Set<string>();
  const allCreators: Array<{
    slug: string;
    name: string;
    handle: string;
    aliases: string[];
    country: string;
    countryCode: string;
    category: string;
    niche: string;
    keywords: string[];
  }> = [];

  for (const e of datasetEntries) {
    seen.add(e.slug);
    allCreators.push({
      slug: e.slug,
      name: e.name,
      handle: e.handle,
      aliases: e.aliases ?? [],
      country: e.country,
      countryCode: e.countryCode,
      category: e.category,
      niche: e.niche,
      keywords: e.keywords,
    });
  }

  for (const e of pipelineEntries) {
    if (seen.has(e.slug)) continue;
    seen.add(e.slug);
    allCreators.push({
      slug: e.slug,
      name: e.name,
      handle: e.handle,
      aliases: e.aliases ?? [],
      country: e.country,
      countryCode: e.countryCode,
      category: e.category,
      niche: e.niche,
      keywords: e.keywords,
    });
  }

  log(`  Creators indexed: ${allCreators.length}`);

  // ── Build index ────────────────────────────────────────────────
  const index: SearchIndexEntry[] = allCreators.map((creator) => ({
    slug: creator.slug,
    name: creator.name,
    handle: creator.handle,
    aliases: creator.aliases,
    country: creator.country,
    countryCode: creator.countryCode,
    category: creator.category,
    niche: creator.niche,
    tokens: generateTokens(creator),
  }));

  // ── Stats ──────────────────────────────────────────────────────
  const totalTokens = index.reduce((sum, e) => sum + e.tokens.length, 0);
  const avgTokens = Math.round(totalTokens / index.length);
  log(`  Total tokens: ${totalTokens}`);
  log(`  Avg tokens/creator: ${avgTokens}`);

  // ── Write JSON index ───────────────────────────────────────────
  ensureDir(PATHS.pipelineData);
  writeJson(PATHS.searchIndex, index);
  logSuccess(`JSON index: ${PATHS.searchIndex}`);

  // ── Write TypeScript module for runtime import ─────────────────
  const tsPath = path.join(PATHS.root, "src/data/creators/search-index.ts");
  const tsContent = `/**
 * Pre-computed search index for the creator directory.
 *
 * AUTO-GENERATED by scripts/build-search-index.ts
 * Do not edit manually.
 *
 * Last built: ${new Date().toISOString()}
 * Creators indexed: ${index.length}
 * Total tokens: ${totalTokens}
 */

import type { SearchIndexEntry } from "@/scripts/pipeline/types";

export const SEARCH_INDEX: readonly SearchIndexEntry[] = ${JSON.stringify(index, null, 0)};

/**
 * Search the creator index. Returns matching entries ranked by
 * relevance (exact name match > handle match > token match).
 */
export function searchCreators(query: string, limit = 20): SearchIndexEntry[] {
  if (!query || query.trim().length === 0) return [];

  const q = query.toLowerCase().trim();
  const qNorm = q.replace(/[^a-z0-9]/g, "");

  const scored: Array<{ entry: SearchIndexEntry; score: number }> = [];

  for (const entry of SEARCH_INDEX) {
    let score = 0;

    // Exact name match (highest priority)
    if (entry.name.toLowerCase() === q) {
      score += 100;
    }
    // Name starts with query
    else if (entry.name.toLowerCase().startsWith(q)) {
      score += 80;
    }
    // Handle match
    else if (entry.handle.toLowerCase().replace("@", "") === q.replace("@", "")) {
      score += 90;
    }
    // Alias exact match
    else if (entry.aliases.some(a => a.toLowerCase() === q)) {
      score += 85;
    }
    // Token match
    else {
      for (const token of entry.tokens) {
        if (token === q || token === qNorm) {
          score += 50;
          break;
        }
        if (token.startsWith(q) || token.startsWith(qNorm)) {
          score += 30;
          break;
        }
        if (token.includes(q) || token.includes(qNorm)) {
          score += 10;
          break;
        }
      }
    }

    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.entry);
}
`;

  writeText(tsPath, tsContent);
  logSuccess(`TS module: ${tsPath}`);

  logSection("Done");
  log(`  Index size: ${(JSON.stringify(index).length / 1024).toFixed(1)} KB`);
}

main();
