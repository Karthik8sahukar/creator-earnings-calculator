import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ArticleCard } from "@/components/blog/ArticleCard";
import { BlogHero } from "@/components/blog/BlogHero";
import { BlogSearch } from "@/components/blog/BlogSearch";
import { CategoryFilters } from "@/components/blog/CategoryFilters";
import { NewsletterCta } from "@/components/blog/NewsletterCta";
import { buildSearchIndex, loadPosts } from "@/lib/blog";
import { buildAlternates } from "@/lib/i18nMetadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates({ locale, pathSuffix: "/blog" }),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
    twitter: {
      title: t("title"),
      description: t("description"),
      card: "summary_large_image",
    },
  };
}

/**
 * Blog landing page.
 *
 * Layout:
 *   1. Hero  ->  "Creator Economy & YouTube Growth"
 *   2. Search box (client-side, over an in-page JSON index)
 *   3. Category filters
 *   4. Featured article (newest published)
 *   5. Latest articles grid
 *   6. Popular articles strip
 *   7. Newsletter CTA
 *
 * The blog is available in every locale — the LISTING UI is
 * translated for all seven — but article bodies exist only in English
 * today, so non-EN readers who click through will see the
 * `<TranslationPending />` notice at the article level.
 */
export default async function BlogHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = await loadPosts();
  const searchIndex = buildSearchIndex(posts);
  const t = await getTranslations({ locale, namespace: "blog" });

  // Editorial ordering: newest first (loadPosts default). We keep two
  // views over the same array:
  //   - `featured` : the single newest post, rendered large.
  //   - `latest`   : the next 9 posts (grid).
  //   - `popular`  : we do not have engagement telemetry yet, so
  //                  "popular" is a hand-picked subset by tag —
  //                  articles tagged "cornerstone" surface here.
  const featured = posts[0];
  const latest = posts.slice(1, 10);
  const popular = posts.filter((p) => p.tags.some((t) => t.toLowerCase() === "cornerstone")).slice(0, 3);

  return (
    <div className="space-y-16 sm:space-y-20">
      <BlogHero>
        <BlogSearch index={searchIndex} />
      </BlogHero>

      <section aria-label={t("categories.navLabel")}>
        <CategoryFilters />
      </section>

      {featured && (
        <section aria-labelledby="featured-title" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="label">{t("sections.featuredEyebrow")}</p>
              <h2
                id="featured-title"
                className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
              >
                {t("sections.featured")}
              </h2>
            </div>
          </div>
          <ArticleCard post={featured} featured />
        </section>
      )}

      {latest.length > 0 && (
        <section aria-labelledby="latest-title" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="label">{t("sections.latestEyebrow")}</p>
              <h2
                id="latest-title"
                className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
              >
                {t("sections.latest")}
              </h2>
            </div>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
            {latest.map((p) => (
              <li key={p.slug}>
                <ArticleCard post={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {popular.length > 0 && (
        <section aria-labelledby="popular-title" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="label">{t("sections.popularEyebrow")}</p>
              <h2
                id="popular-title"
                className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
              >
                {t("sections.popular")}
              </h2>
            </div>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
            {popular.map((p) => (
              <li key={p.slug}>
                <ArticleCard post={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <NewsletterCta />
    </div>
  );
}
