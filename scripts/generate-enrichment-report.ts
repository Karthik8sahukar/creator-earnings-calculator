#!/usr/bin/env npx tsx
/**
 * Generate reports/enrichment-report.md
 *
 * Analyzes the creator dataset and produces a comprehensive status
 * report covering verified creators, matched creators, missing data,
 * duplicate channels, and remaining work.
 *
 * Run: npx tsx scripts/generate-enrichment-report.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "..");

async function main() {
  // Import the dataset
  const { CREATORS_DATASET } = await import(
    path.resolve(ROOT, "src/data/creators/dataset.ts")
  );

  const creators = CREATORS_DATASET as Array<{
    id: string;
    slug: string;
    name: string;
    handle: string;
    youtubeChannelId: string | null;
    country: string;
    category: string;
    niche: string;
    verified: boolean;
    subscriberTier: string;
    avatar: string | null;
    banner: string | null;
    biography?: string;
    description: string;
    socialLinks: Record<string, string | undefined>;
    estimatedSubscribers?: number;
    estimatedMonthlyViews?: number;
    featuredVideos?: Array<{ videoId: string; title: string }>;
    achievements?: Array<{ year: number; label: string }>;
    tags?: string[];
    yearStarted?: number;
  }>;

  // Load auto-matched results if available
  const autoMatchedPath = path.resolve(ROOT, "src/data/creators/auto-matched.json");
  let autoMatched: Record<string, string> = {};
  try {
    autoMatched = JSON.parse(fs.readFileSync(autoMatchedPath, "utf-8"));
  } catch {
    // No auto-matched file yet
  }

  // ─── Analysis ───────────────────────────────────────────────────

  const verified = creators.filter((c) => c.verified && c.youtubeChannelId);
  const unverified = creators.filter((c) => !c.youtubeChannelId);
  const autoMatchedCreators = unverified.filter((c) => autoMatched[c.id]);
  const stillUnresolved = unverified.filter((c) => !autoMatched[c.id]);

  const missingAvatar = creators.filter((c) => !c.avatar);
  const missingBio = creators.filter((c) => !c.biography);
  const missingSocial = creators.filter(
    (c) => Object.keys(c.socialLinks).filter((k) => c.socialLinks[k]).length === 0,
  );
  const missingEstimates = creators.filter(
    (c) => !c.estimatedSubscribers && !c.youtubeChannelId,
  );

  // Duplicate channel IDs
  const channelIds = creators
    .filter((c) => c.youtubeChannelId)
    .map((c) => ({ id: c.id, channelId: c.youtubeChannelId! }));
  const seen = new Map<string, string[]>();
  for (const { id, channelId } of channelIds) {
    const list = seen.get(channelId) ?? [];
    list.push(id);
    seen.set(channelId, list);
  }
  const duplicates = [...seen.entries()].filter(([, ids]) => ids.length > 1);

  // ─── Generate Report ────────────────────────────────────────────

  const lines: string[] = [];
  const add = (s: string) => lines.push(s);

  add("# Creator Enrichment Report");
  add("");
  add(`Generated: ${new Date().toISOString()}`);
  add("");
  add("## Summary");
  add("");
  add(`| Metric | Count |`);
  add(`|--------|-------|`);
  add(`| Total creators | ${creators.length} |`);
  add(`| Verified (with channelId) | ${verified.length} |`);
  add(`| Automatically matched | ${autoMatchedCreators.length} |`);
  add(`| Still unresolved | ${stillUnresolved.length} |`);
  add(`| Missing avatar | ${missingAvatar.length} |`);
  add(`| Missing biography | ${missingBio.length} |`);
  add(`| Missing social links | ${missingSocial.length} |`);
  add(`| Missing subscriber estimates | ${missingEstimates.length} |`);
  add(`| Duplicate channel IDs | ${duplicates.length} |`);
  add("");

  // Verified creators
  add("## Verified Creators");
  add("");
  add("| # | Name | Channel ID | Country | Category |");
  add("|---|------|-----------|---------|----------|");
  verified.forEach((c, i) => {
    add(`| ${i + 1} | ${c.name} | \`${c.youtubeChannelId}\` | ${c.country} | ${c.category} |`);
  });
  add("");

  // Auto-matched
  if (autoMatchedCreators.length > 0) {
    add("## Automatically Matched");
    add("");
    add("| # | Name | Matched Channel ID | Handle |");
    add("|---|------|-------------------|--------|");
    autoMatchedCreators.forEach((c, i) => {
      add(`| ${i + 1} | ${c.name} | \`${autoMatched[c.id]}\` | ${c.handle} |`);
    });
    add("");
  }

  // Still unresolved
  add("## Creators Still Unresolved");
  add("");
  add("| # | Name | Handle | Country | Category | Tier |");
  add("|---|------|--------|---------|----------|------|");
  stillUnresolved.forEach((c, i) => {
    add(`| ${i + 1} | ${c.name} | ${c.handle} | ${c.country} | ${c.category} | ${c.subscriberTier} |`);
  });
  add("");

  // Duplicate channels
  if (duplicates.length > 0) {
    add("## Duplicate Channel IDs");
    add("");
    duplicates.forEach(([channelId, ids]) => {
      add(`- \`${channelId}\` used by: ${ids.join(", ")}`);
    });
    add("");
  }

  // Missing data
  add("## Data Completeness");
  add("");
  add("### Missing Avatars");
  add("");
  if (missingAvatar.length > 0) {
    missingAvatar.slice(0, 20).forEach((c) => {
      add(`- ${c.name} (${c.slug})`);
    });
    if (missingAvatar.length > 20) add(`- ... and ${missingAvatar.length - 20} more`);
  } else {
    add("All creators have avatars.");
  }
  add("");

  add("### Missing Biographies");
  add("");
  if (missingBio.length > 0) {
    missingBio.slice(0, 20).forEach((c) => {
      add(`- ${c.name} (${c.slug})`);
    });
    if (missingBio.length > 20) add(`- ... and ${missingBio.length - 20} more`);
  } else {
    add("All creators have biographies.");
  }
  add("");

  add("### Missing Social Links");
  add("");
  if (missingSocial.length > 0) {
    missingSocial.slice(0, 20).forEach((c) => {
      add(`- ${c.name} (${c.slug})`);
    });
    if (missingSocial.length > 20) add(`- ... and ${missingSocial.length - 20} more`);
  } else {
    add("All creators have at least one social link.");
  }
  add("");

  // ─── Write Report ───────────────────────────────────────────────

  const reportsDir = path.resolve(ROOT, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.resolve(reportsDir, "enrichment-report.md");
  fs.writeFileSync(reportPath, lines.join("\n"));

  console.log(`Report generated: ${reportPath}`);
  console.log(`  ${verified.length} verified, ${autoMatchedCreators.length} auto-matched, ${stillUnresolved.length} unresolved`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
