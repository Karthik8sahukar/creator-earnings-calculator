/**
 * Shared type definitions for the BeHumler blog.
 *
 * The frontmatter shape is validated by Zod (see `posts.ts`) — the
 * types here are the *parsed* shape that the app code consumes.
 * Never construct these types by hand from unvalidated data; always
 * go through `loadPosts()` so parsing errors surface at build time
 * instead of at request time.
 */

export type BlogCategoryId =
  | "monetization"
  | "growth"
  | "creator-economy"
  | "analytics"
  | "seo"
  | "sponsorships"
  | "shorts"
  | "guides";

export interface BlogCategory {
  id: BlogCategoryId;
  labelKey: string;
  descriptionKey: string;
  /** slug used in URL, e.g. `/blog/category/monetization` */
  slug: string;
}

/**
 * Author metadata. Kept minimal — we do not run per-author pages
 * because the entire blog is written under a single editorial voice
 * ("BeHumler Editorial") for now.
 */
export interface BlogAuthor {
  name: string;
  avatar?: string;
  bio?: string;
}

export interface BlogTocEntry {
  /** Rendered heading text (plain string). */
  text: string;
  /** ID slug on the heading element (rehype-slug). */
  id: string;
  /** Heading level: 2 = h2, 3 = h3. h1 is the article title and not indexed. */
  level: 2 | 3;
}

/**
 * A parsed blog post — the shape every UI component consumes.
 * `content` holds raw MDX source; the reader page compiles it via
 * `next-mdx-remote` at request time (or at build time when the page
 * is statically pre-rendered).
 */
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  author: BlogAuthor;
  publishedDate: string; // ISO 8601 date
  updatedDate?: string;
  categoryId: BlogCategoryId;
  tags: string[];
  /** Featured image URL — either a /public path or a full URL. */
  featuredImage: string;
  featuredImageAlt: string;
  /** Whole-minute reading time computed from word count. */
  readingTimeMinutes: number;
  /** Article word count — informational, useful for tests. */
  wordCount: number;
  /** Draft posts are excluded from lists and the sitemap. */
  draft?: boolean;
  /** Ordered list of h2/h3 headings extracted from the MDX source. */
  toc: BlogTocEntry[];
  /** Raw MDX source. Serialized by `next-mdx-remote` on the page. */
  content: string;
}

/**
 * Compact form used by the search index. Never contains the raw MDX
 * body — search matches title/description/category/tags only, so the
 * client bundle stays small.
 */
export interface BlogSearchDoc {
  slug: string;
  title: string;
  description: string;
  categoryId: BlogCategoryId;
  tags: string[];
}
