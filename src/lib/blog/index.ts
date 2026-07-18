/**
 * Public entry point for the blog domain.
 *
 * App code (pages, components, tests) should import from
 * `@/lib/blog` — never reach into individual files. This barrel
 * gives us a single place to hide implementation details (like
 * the filesystem loader being server-only) and rename modules
 * without touching a hundred imports.
 */

export {
  BLOG_CATEGORIES,
  findCategory,
  isCategoryId,
} from "./categories";
export {
  __resetPostsCacheForTests,
  getAdjacentPosts,
  loadPostBySlug,
  loadPosts,
} from "./posts";
export { findRelatedPosts } from "./related";
export { computeReadingTime } from "./readingTime";
export { buildSearchIndex, searchIndex } from "./search";
export type {
  BlogAuthor,
  BlogCategory,
  BlogCategoryId,
  BlogPost,
  BlogSearchDoc,
  BlogTocEntry,
} from "./types";
