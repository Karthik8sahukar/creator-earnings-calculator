import type { BlogPost } from "./types";

/**
 * Score how related two posts are.
 *
 * Rules (higher = more related):
 *   - Same category:                  +3
 *   - Shared tag (each):              +2
 *   - Similar title words (rough):    +1 (up to 2 shared meaningful words)
 *
 * We keep the algorithm intentionally simple. A more sophisticated
 * approach (TF-IDF, embeddings) is not justified for ~10 articles —
 * the signal from category + tags is already strong.
 */
function relatednessScore(base: BlogPost, candidate: BlogPost): number {
  if (base.slug === candidate.slug) return -Infinity;
  let score = 0;

  if (base.categoryId === candidate.categoryId) score += 3;

  const baseTags = new Set(base.tags.map((t) => t.toLowerCase()));
  for (const tag of candidate.tags) {
    if (baseTags.has(tag.toLowerCase())) score += 2;
  }

  const baseWords = new Set(
    base.title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );
  let sharedTitleWords = 0;
  for (const w of candidate.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3)) {
    if (baseWords.has(w)) sharedTitleWords += 1;
  }
  score += Math.min(sharedTitleWords, 2);

  return score;
}

/**
 * Return the `limit` most related posts to `base`, ordered by score
 * descending, ties broken by newer-first.
 *
 * If fewer than `limit` posts have any signal at all (score > 0), we
 * still fill the list by falling back to the most recent posts. This
 * matches the reader's expectation that the "Related" section
 * always shows the requested number of cards.
 */
export function findRelatedPosts(
  base: BlogPost,
  allPosts: BlogPost[],
  limit = 3,
): BlogPost[] {
  const scored = allPosts
    .filter((p) => p.slug !== base.slug)
    .map((post) => ({ post, score: relatednessScore(base, post) }))
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      // Newer first — posts are already newest-first in `allPosts`,
      // but we can't rely on that after filter/map, so compare dates.
      if (a.post.publishedDate !== b.post.publishedDate) {
        return a.post.publishedDate < b.post.publishedDate ? 1 : -1;
      }
      return a.post.slug.localeCompare(b.post.slug);
    });

  return scored.slice(0, limit).map(({ post }) => post);
}
