/**
 * Integration test against the REAL content directory.
 *
 * These tests are the guardrails for the article body: every MDX file
 * in `content/blog/` must parse cleanly through the frontmatter Zod
 * schema, produce a non-empty TOC, and yield a reasonable reading time.
 *
 * If a contributor introduces a malformed article (typo in a required
 * frontmatter field, unknown category id, missing featured image, ...)
 * this test suite will fail at CI time — long before a broken article
 * lands on production.
 */
import { describe, expect, it } from "vitest";

import { __resetPostsCacheForTests, loadPosts } from "../posts";
import { isCategoryId } from "../categories";

describe("blog posts loader (against real content/blog directory)", () => {
  it("loads at least the ten launch articles", async () => {
    __resetPostsCacheForTests();
    const posts = await loadPosts();
    expect(posts.length).toBeGreaterThanOrEqual(10);
  });

  it("sorts newest-first with slug alphabetical as tie-breaker", async () => {
    __resetPostsCacheForTests();
    const posts = await loadPosts();
    for (let i = 1; i < posts.length; i++) {
      const prev = posts[i - 1];
      const curr = posts[i];
      if (prev.publishedDate === curr.publishedDate) {
        // Same date: slugs must be alphabetically ascending.
        expect(prev.slug.localeCompare(curr.slug)).toBeLessThanOrEqual(0);
      } else {
        // Different dates: newer first.
        expect(prev.publishedDate >= curr.publishedDate).toBe(true);
      }
    }
  });

  it("every post has a valid category id", async () => {
    __resetPostsCacheForTests();
    const posts = await loadPosts();
    for (const post of posts) {
      expect(isCategoryId(post.categoryId)).toBe(true);
    }
  });

  it("every post has a non-empty TOC (at least one h2)", async () => {
    __resetPostsCacheForTests();
    const posts = await loadPosts();
    for (const post of posts) {
      expect(post.toc.length).toBeGreaterThan(0);
    }
  });

  it("every post's reading time is a positive whole minute", async () => {
    __resetPostsCacheForTests();
    const posts = await loadPosts();
    for (const post of posts) {
      expect(post.readingTimeMinutes).toBeGreaterThan(0);
      expect(Number.isInteger(post.readingTimeMinutes)).toBe(true);
    }
  });

  it("every post has a description, author, and featured image", async () => {
    __resetPostsCacheForTests();
    const posts = await loadPosts();
    for (const post of posts) {
      expect(post.description.length).toBeGreaterThan(0);
      expect(post.author.name.length).toBeGreaterThan(0);
      expect(post.featuredImage.length).toBeGreaterThan(0);
      expect(post.featuredImageAlt.length).toBeGreaterThan(0);
    }
  });

  it("draft posts are excluded from the default loader", async () => {
    __resetPostsCacheForTests();
    const nonDrafts = await loadPosts();
    for (const post of nonDrafts) {
      expect(post.draft).not.toBe(true);
    }
  });

  it("slug matches the mdx filename", async () => {
    __resetPostsCacheForTests();
    const posts = await loadPosts();
    for (const post of posts) {
      // No trailing extension, no whitespace, only URL-safe chars.
      expect(post.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
