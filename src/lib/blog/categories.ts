import type { BlogCategory, BlogCategoryId } from "./types";

/**
 * Canonical list of blog categories.
 *
 * IDs are stable — they appear in URLs (`/blog/category/monetization`)
 * and in the frontmatter of every MDX file. Renaming an id is a
 * breaking change; renaming a label (via the message file) is not.
 *
 * The order here is the order the categories appear in the filter
 * chips on the blog homepage. Keep the highest-traffic categories
 * (Monetization, Growth) first.
 */
export const BLOG_CATEGORIES: readonly BlogCategory[] = [
  {
    id: "monetization",
    slug: "monetization",
    labelKey: "blog.categories.monetization.label",
    descriptionKey: "blog.categories.monetization.description",
  },
  {
    id: "growth",
    slug: "growth",
    labelKey: "blog.categories.growth.label",
    descriptionKey: "blog.categories.growth.description",
  },
  {
    id: "creator-economy",
    slug: "creator-economy",
    labelKey: "blog.categories.creator-economy.label",
    descriptionKey: "blog.categories.creator-economy.description",
  },
  {
    id: "analytics",
    slug: "analytics",
    labelKey: "blog.categories.analytics.label",
    descriptionKey: "blog.categories.analytics.description",
  },
  {
    id: "seo",
    slug: "seo",
    labelKey: "blog.categories.seo.label",
    descriptionKey: "blog.categories.seo.description",
  },
  {
    id: "sponsorships",
    slug: "sponsorships",
    labelKey: "blog.categories.sponsorships.label",
    descriptionKey: "blog.categories.sponsorships.description",
  },
  {
    id: "shorts",
    slug: "shorts",
    labelKey: "blog.categories.shorts.label",
    descriptionKey: "blog.categories.shorts.description",
  },
  {
    id: "guides",
    slug: "guides",
    labelKey: "blog.categories.guides.label",
    descriptionKey: "blog.categories.guides.description",
  },
] as const;

const CATEGORY_BY_ID = new Map<BlogCategoryId, BlogCategory>(
  BLOG_CATEGORIES.map((c) => [c.id, c]),
);
const CATEGORY_BY_SLUG = new Map<string, BlogCategory>(
  BLOG_CATEGORIES.map((c) => [c.slug, c]),
);

export function findCategory(idOrSlug: string): BlogCategory | undefined {
  return (
    CATEGORY_BY_ID.get(idOrSlug as BlogCategoryId) ??
    CATEGORY_BY_SLUG.get(idOrSlug)
  );
}

export function isCategoryId(value: string): value is BlogCategoryId {
  return CATEGORY_BY_ID.has(value as BlogCategoryId);
}
