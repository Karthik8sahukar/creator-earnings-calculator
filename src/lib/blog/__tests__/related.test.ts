import { describe, expect, it } from "vitest";

import { findRelatedPosts } from "../related";
import type { BlogPost } from "../types";

function makePost(overrides: Partial<BlogPost>): BlogPost {
  return {
    slug: overrides.slug ?? "post",
    title: overrides.title ?? "A Post",
    description: overrides.description ?? "desc",
    author: { name: "BeHumler Editorial" },
    publishedDate: overrides.publishedDate ?? "2026-01-01",
    categoryId: overrides.categoryId ?? "monetization",
    tags: overrides.tags ?? [],
    featuredImage: "/blog/hero.svg",
    featuredImageAlt: "alt",
    readingTimeMinutes: 5,
    wordCount: 1000,
    toc: [],
    content: "",
  };
}

describe("findRelatedPosts", () => {
  it("never returns the base post itself", () => {
    const base = makePost({ slug: "self", categoryId: "monetization" });
    const posts: BlogPost[] = [
      base,
      makePost({ slug: "a", categoryId: "monetization" }),
      makePost({ slug: "b", categoryId: "growth" }),
    ];
    const related = findRelatedPosts(base, posts, 5);
    expect(related.find((p) => p.slug === "self")).toBeUndefined();
  });

  it("prefers same-category posts", () => {
    const base = makePost({ slug: "base", categoryId: "monetization" });
    const posts: BlogPost[] = [
      base,
      makePost({ slug: "same-cat", categoryId: "monetization" }),
      makePost({ slug: "other-cat", categoryId: "growth" }),
    ];
    const related = findRelatedPosts(base, posts, 1);
    expect(related[0].slug).toBe("same-cat");
  });

  it("boosts posts sharing tags", () => {
    const base = makePost({
      slug: "base",
      categoryId: "monetization",
      tags: ["rpm", "shorts"],
    });
    const posts: BlogPost[] = [
      base,
      makePost({
        slug: "same-cat-no-tags",
        categoryId: "monetization",
        tags: ["memberships"],
      }),
      makePost({
        slug: "other-cat-shared-tag",
        categoryId: "growth",
        tags: ["rpm"],
      }),
    ];
    // Same-cat = 3. Other-cat + 1 shared tag = 2. Same-cat wins.
    const related = findRelatedPosts(base, posts, 2);
    expect(related.map((p) => p.slug)).toEqual([
      "same-cat-no-tags",
      "other-cat-shared-tag",
    ]);
  });

  it("still returns `limit` posts even when nothing is related", () => {
    const base = makePost({
      slug: "base",
      categoryId: "monetization",
      tags: ["rpm"],
    });
    const posts: BlogPost[] = [
      base,
      makePost({
        slug: "unrelated-a",
        categoryId: "seo",
        tags: ["seo"],
        publishedDate: "2026-05-01",
      }),
      makePost({
        slug: "unrelated-b",
        categoryId: "seo",
        tags: ["seo"],
        publishedDate: "2026-03-01",
      }),
    ];
    // Both candidates are equally unrelated (score 0). Newer should win.
    const related = findRelatedPosts(base, posts, 2);
    expect(related.map((p) => p.slug)).toEqual([
      "unrelated-a",
      "unrelated-b",
    ]);
  });

  it("respects the limit argument", () => {
    const base = makePost({ slug: "base", categoryId: "monetization" });
    const posts: BlogPost[] = [
      base,
      makePost({ slug: "a", categoryId: "monetization" }),
      makePost({ slug: "b", categoryId: "monetization" }),
      makePost({ slug: "c", categoryId: "monetization" }),
    ];
    expect(findRelatedPosts(base, posts, 2)).toHaveLength(2);
    expect(findRelatedPosts(base, posts, 3)).toHaveLength(3);
  });
});
