import { describe, expect, it } from "vitest";

import { buildSearchIndex, searchIndex } from "../search";
import type { BlogPost } from "../types";

function makePost(overrides: Partial<BlogPost>): BlogPost {
  return {
    slug: overrides.slug ?? "post",
    title: overrides.title ?? "A Post",
    description: overrides.description ?? "A short description.",
    author: overrides.author ?? { name: "BeHumler Editorial" },
    publishedDate: overrides.publishedDate ?? "2026-01-01",
    updatedDate: overrides.updatedDate,
    categoryId: overrides.categoryId ?? "monetization",
    tags: overrides.tags ?? ["rpm"],
    featuredImage: overrides.featuredImage ?? "/blog/hero.svg",
    featuredImageAlt: overrides.featuredImageAlt ?? "alt",
    readingTimeMinutes: overrides.readingTimeMinutes ?? 5,
    wordCount: overrides.wordCount ?? 1000,
    draft: overrides.draft,
    toc: overrides.toc ?? [],
    content: overrides.content ?? "",
  };
}

/**
 * The search index and `searchIndex()` are what power the blog's
 * client-side search box. Every content field we search over needs
 * a regression test — otherwise a refactor that drops a field
 * silently kills discoverability.
 */
describe("blog search", () => {
  const posts: BlogPost[] = [
    makePost({
      slug: "rpm-guide",
      title: "How to Increase RPM",
      description: "Practical levers for lifting revenue per mille.",
      categoryId: "monetization",
      tags: ["rpm", "optimization"],
    }),
    makePost({
      slug: "shorts-guide",
      title: "YouTube Shorts Monetization Guide",
      description: "How the Creator Pool actually works.",
      categoryId: "shorts",
      tags: ["shorts", "creator pool"],
    }),
    makePost({
      slug: "cpm-vs-rpm",
      title: "CPM vs. RPM Explained",
      description: "What each metric measures and when to look at which.",
      categoryId: "analytics",
      tags: ["cpm", "rpm"],
    }),
  ];

  it("returns the full index when the query is empty", () => {
    const index = buildSearchIndex(posts);
    expect(searchIndex(index, "")).toHaveLength(3);
    expect(searchIndex(index, "   ")).toHaveLength(3);
  });

  it("matches on title", () => {
    const index = buildSearchIndex(posts);
    const results = searchIndex(index, "shorts");
    expect(results.map((r) => r.slug)).toEqual(["shorts-guide"]);
  });

  it("matches on description", () => {
    const index = buildSearchIndex(posts);
    const results = searchIndex(index, "creator pool");
    expect(results.map((r) => r.slug)).toEqual(["shorts-guide"]);
  });

  it("matches on tag content", () => {
    const index = buildSearchIndex(posts);
    const results = searchIndex(index, "optimization");
    expect(results.map((r) => r.slug)).toEqual(["rpm-guide"]);
  });

  it("matches on category id", () => {
    const index = buildSearchIndex(posts);
    const results = searchIndex(index, "analytics");
    expect(results.map((r) => r.slug)).toEqual(["cpm-vs-rpm"]);
  });

  it("requires all whitespace-separated tokens to match (AND semantics)", () => {
    const index = buildSearchIndex(posts);
    // "rpm" alone matches two posts.
    expect(searchIndex(index, "rpm").length).toBeGreaterThanOrEqual(2);
    // "rpm cpm" together matches only cpm-vs-rpm.
    expect(searchIndex(index, "rpm cpm").map((r) => r.slug)).toEqual([
      "cpm-vs-rpm",
    ]);
  });

  it("is case-insensitive", () => {
    const index = buildSearchIndex(posts);
    const lower = searchIndex(index, "shorts");
    const upper = searchIndex(index, "SHORTS");
    expect(upper.map((r) => r.slug)).toEqual(lower.map((r) => r.slug));
  });

  it("returns an empty array when no post matches", () => {
    const index = buildSearchIndex(posts);
    expect(searchIndex(index, "xyzzy-no-match")).toEqual([]);
  });

  it("does NOT include the raw MDX body in the index", () => {
    const p = makePost({
      content: "Sensitive draft content that should never ship in JSON",
    });
    const index = buildSearchIndex([p]);
    const serialized = JSON.stringify(index);
    expect(serialized).not.toContain("Sensitive draft content");
  });
});
