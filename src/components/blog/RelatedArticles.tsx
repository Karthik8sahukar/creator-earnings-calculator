import { useTranslations } from "next-intl";

import { ArticleCard } from "./ArticleCard";
import type { BlogPost } from "@/lib/blog";

/**
 * "Related articles" section — a compact list of adjacent posts by
 * category / tag / title-word overlap. Selection logic lives in
 * `src/lib/blog/related.ts` and is unit-tested there.
 */
export function RelatedArticles({ posts }: { posts: BlogPost[] }) {
  const t = useTranslations("blog.article");
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="related-title" className="space-y-4">
      <h2
        id="related-title"
        className="text-xl font-semibold text-slate-900 dark:text-slate-50"
      >
        {t("relatedTitle")}
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
        {posts.map((p) => (
          <li key={p.slug}>
            <ArticleCard post={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
