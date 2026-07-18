import type { BlogPost, BlogSearchDoc } from "./types";

/**
 * Build a compact, JSON-serializable search index from a set of posts.
 *
 * Only the fields that appear in the search UX (title, description,
 * category, tags) travel to the client — the raw MDX body never does.
 * The index for our ~10 articles is well under 5 KB gzipped.
 */
export function buildSearchIndex(posts: BlogPost[]): BlogSearchDoc[] {
  return posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    categoryId: p.categoryId,
    tags: p.tags,
  }));
}

/**
 * Case-insensitive substring search over the index.
 *
 * Matching rules (any of these makes the doc a match):
 *   1. Every query token appears somewhere in title + description
 *      + tags (space-joined, lowercased).
 *   2. Any query token exactly equals the category id.
 *
 * We deliberately do NOT do fuzzy matching — for a curated set of
 * ~10 authoritative articles, exact substring matches are more
 * predictable and produce more relevant results than Levenshtein
 * would for typos. If the article count grows past ~50 we should
 * revisit and reach for `fuse.js` (or similar).
 */
export function searchIndex(
  index: BlogSearchDoc[],
  query: string,
): BlogSearchDoc[] {
  const q = query.trim().toLowerCase();
  if (!q) return index;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return index;

  return index.filter((doc) => {
    const haystack = [
      doc.title,
      doc.description,
      doc.categoryId,
      doc.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return tokens.every((tok) => haystack.includes(tok));
  });
}
