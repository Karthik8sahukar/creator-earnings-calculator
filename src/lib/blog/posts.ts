import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { z } from "zod";

import { isCategoryId } from "./categories";
import { computeReadingTime } from "./readingTime";
import type { BlogPost, BlogTocEntry } from "./types";

/**
 * Blog content directory. Resolved relative to the repository root at
 * process CWD — Next.js runs from the repo root in both dev and build,
 * so this is stable across environments.
 */
const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

/**
 * Zod schema for the frontmatter block at the top of every article.
 * Strict — unknown keys throw at build time so typos never silently
 * become part of the page.
 */
const frontmatterSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    author: z
      .object({
        name: z.string().min(1),
        avatar: z.string().optional(),
        bio: z.string().optional(),
      })
      .default({ name: "BeHumler Editorial" }),
    publishedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    updatedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    category: z.string().refine(isCategoryId, {
      message: "Unknown category — see src/lib/blog/categories.ts",
    }),
    tags: z.array(z.string().min(1)).min(1),
    featuredImage: z.string().min(1),
    featuredImageAlt: z.string().min(1),
    draft: z.boolean().optional(),
  })
  .strict();

type Frontmatter = z.infer<typeof frontmatterSchema>;

/**
 * Extract h2/h3 headings from raw markdown source so the article page
 * can render a table of contents WITHOUT compiling the MDX first.
 *
 * We only match ATX-style headings (`##`, `###`) at the start of a
 * line — h1 is intentionally excluded (that's the article title,
 * rendered separately) and h4+ don't appear in our TOC by design.
 *
 * Slugs match what `rehype-slug` produces: lowercased, alphanumerics
 * + hyphens, collapsed whitespace. We do NOT try to reproduce every
 * edge case rehype-slug covers (unicode normalization, etc.) — for
 * our controlled content set, the simple slugger is sufficient.
 */
function extractToc(source: string): BlogTocEntry[] {
  const entries: BlogTocEntry[] = [];
  const lines = source.split("\n");
  let inCodeBlock = false;
  for (const raw of lines) {
    const line = raw.trimStart();
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/[`*_~]/g, "").trim();
    const id = slugify(text);
    if (!id) continue;
    entries.push({ text, id, level });
  }
  return entries;
}

/**
 * Convert a heading label to a URL-safe id. Deliberately simple —
 * matches the common subset of `rehype-slug` behaviour for our
 * English content.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['\u2018\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function readPostFile(filename: string): Promise<BlogPost> {
  const filepath = path.join(CONTENT_DIR, filename);
  const raw = await fs.readFile(filepath, "utf8");
  const parsed = matter(raw);

  let fm: Frontmatter;
  try {
    fm = frontmatterSchema.parse(parsed.data);
  } catch (err) {
    throw new Error(
      `Invalid frontmatter in ${filename}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const slug = filename.replace(/\.mdx?$/, "");
  const { minutes, words } = computeReadingTime(parsed.content);
  const toc = extractToc(parsed.content);

  return {
    slug,
    title: fm.title,
    description: fm.description,
    author: fm.author,
    publishedDate: fm.publishedDate,
    updatedDate: fm.updatedDate,
    categoryId: fm.category as BlogPost["categoryId"],
    tags: fm.tags,
    featuredImage: fm.featuredImage,
    featuredImageAlt: fm.featuredImageAlt,
    readingTimeMinutes: minutes,
    wordCount: words,
    draft: fm.draft,
    toc,
    content: parsed.content,
  };
}

/**
 * Module-level cache. `loadPosts()` may be called dozens of times per
 * request (metadata + page body + sitemap all touch the same posts),
 * so caching after the first read is meaningfully faster and gives
 * us stable, deterministic ordering across the request.
 */
let cachedPosts: BlogPost[] | null = null;

/**
 * Read every post from the filesystem, validate frontmatter, and
 * return them sorted newest-first.
 *
 * Draft posts are filtered out unless `includeDrafts` is set (used
 * only by unit tests). Sorting is done by publishedDate descending;
 * ties are broken by slug alphabetical for stability.
 */
export async function loadPosts(options?: {
  includeDrafts?: boolean;
}): Promise<BlogPost[]> {
  if (cachedPosts) {
    return options?.includeDrafts
      ? cachedPosts
      : cachedPosts.filter((p) => !p.draft);
  }

  let filenames: string[];
  try {
    filenames = await fs.readdir(CONTENT_DIR);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      cachedPosts = [];
      return [];
    }
    throw err;
  }

  const mdxFiles = filenames.filter((name) => /\.mdx?$/.test(name));
  const posts = await Promise.all(mdxFiles.map(readPostFile));

  posts.sort((a, b) => {
    if (a.publishedDate === b.publishedDate) {
      return a.slug.localeCompare(b.slug);
    }
    return a.publishedDate < b.publishedDate ? 1 : -1;
  });

  cachedPosts = posts;
  return options?.includeDrafts ? posts : posts.filter((p) => !p.draft);
}

/**
 * Read a single post by slug. Returns undefined instead of throwing
 * so route handlers can render a proper 404.
 */
export async function loadPostBySlug(
  slug: string,
): Promise<BlogPost | undefined> {
  const posts = await loadPosts();
  return posts.find((p) => p.slug === slug);
}

/**
 * Adjacent article helper: given a slug, return the immediately
 * previous (older) and next (newer) posts in the published-date
 * ordering. Used for the "Previous / Next" navigation at the bottom
 * of every article.
 *
 * Naming reflects the READER's expectation: `prev` means "the article
 * BEFORE this one in publication order (older)", which is what
 * appears on the LEFT in the UI.
 */
export async function getAdjacentPosts(slug: string): Promise<{
  prev?: BlogPost;
  next?: BlogPost;
}> {
  const posts = await loadPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx === -1) return {};
  return {
    // Posts are newest-first, so `next` is the article ABOVE this
    // one in the array (published more recently), and `prev` is the
    // one BELOW (published earlier).
    next: idx > 0 ? posts[idx - 1] : undefined,
    prev: idx < posts.length - 1 ? posts[idx + 1] : undefined,
  };
}

/**
 * Reset the in-memory cache. ONLY used by tests to force a re-read
 * of the content directory after mutating fixture files. Not exposed
 * from `index.ts` to app code.
 */
export function __resetPostsCacheForTests(): void {
  cachedPosts = null;
}
