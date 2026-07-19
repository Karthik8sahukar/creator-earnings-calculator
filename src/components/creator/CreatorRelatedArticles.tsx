import "server-only";

import { RelatedArticles } from "@/components/blog/RelatedArticles";
import { loadPosts } from "@/lib/blog";

/**
 * Tags we consider "creator-relevant" for the on-profile Related
 * Articles strip. Any blog post whose `tags` frontmatter contains at
 * least one of these values is eligible. Kept lowercase — we match
 * case-insensitively.
 *
 * If none of the eligible posts overlap for a given locale we simply
 * render nothing (the underlying `<RelatedArticles/>` returns `null`
 * on an empty list).
 */
const CREATOR_TAGS: readonly string[] = [
  "youtube",
  "creator",
  "creators",
  "earnings",
  "monetization",
];

/**
 * Server component wrapper. Reuses `<RelatedArticles/>` from the
 * blog domain instead of building a second identical card grid.
 * Limits the strip to three posts to keep the section short.
 */
export async function CreatorRelatedArticles({
  limit = 3,
}: {
  limit?: number;
} = {}) {
  let posts;
  try {
    posts = await loadPosts();
  } catch {
    return null;
  }

  const set = new Set(CREATOR_TAGS.map((t) => t.toLowerCase()));
  const matched = posts.filter((p) =>
    p.tags.some((t) => set.has(t.toLowerCase())),
  );

  // Sort newest-first — `loadPosts()` already does this, but we keep
  // the guarantee local so a future refactor of the loader doesn't
  // silently reorder the creator strip.
  matched.sort((a, b) => (a.publishedDate < b.publishedDate ? 1 : -1));

  return <RelatedArticles posts={matched.slice(0, limit)} />;
}
