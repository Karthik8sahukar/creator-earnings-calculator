/**
 * Phase 3: Automatic related creators computation.
 *
 * Ranks creators by similarity based on:
 *   - Same country (+3 points)
 *   - Same category (+4 points)
 *   - Same language (+2 points)
 *   - Same niche (+3 points)
 *   - Same subscriber tier (+1 point)
 *
 * Never returns the creator themselves.
 * Results are deterministic and cacheable.
 */

import type { CreatorEntry } from "./schema";
import { CREATORS_DATASET } from "./dataset";

function computeSimilarity(a: CreatorEntry, b: CreatorEntry): number {
  if (a.id === b.id) return -1;
  let score = 0;
  if (a.countryCode === b.countryCode) score += 3;
  if (a.category.toLowerCase() === b.category.toLowerCase()) score += 4;
  if (a.language === b.language) score += 2;
  if (a.niche === b.niche) score += 3;
  if (a.subscriberTier === b.subscriberTier) score += 1;
  return score;
}

/**
 * Get related creators for a given creator, ranked by similarity.
 * Returns up to `limit` creators (default 6).
 */
export function getRelatedCreators(
  creator: CreatorEntry,
  limit = 6,
): CreatorEntry[] {
  const scored = CREATORS_DATASET
    .map((c) => ({ creator: c, score: computeSimilarity(creator, c) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.creator);
}

/**
 * Get related creators by slug.
 */
export function getRelatedCreatorsBySlug(
  slug: string,
  limit = 6,
): CreatorEntry[] {
  const creator = CREATORS_DATASET.find((c) => c.slug === slug);
  if (!creator) return [];
  return getRelatedCreators(creator, limit);
}
