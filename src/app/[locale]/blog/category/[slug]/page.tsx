import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/blog/ArticleCard";
import { BlogBreadcrumbs } from "@/components/blog/BlogBreadcrumbs";
import { CategoryFilters } from "@/components/blog/CategoryFilters";
import { BLOG_CATEGORIES, findCategory, loadPosts } from "@/lib/blog";
import { routing } from "@/i18n/routing";
import { buildAlternates } from "@/lib/i18nMetadata";

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const c of BLOG_CATEGORIES) {
      params.push({ locale, slug: c.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = findCategory(slug);
  if (!category) return { title: "Not found", robots: { index: false } };

  const global = await getTranslations({ locale });
  const label = global(category.labelKey);
  const description = global(category.descriptionKey);

  return {
    title: label,
    description,
    alternates: buildAlternates({
      locale,
      pathSuffix: `/blog/category/${category.slug}`,
    }),
    openGraph: {
      title: label,
      description,
      type: "website",
    },
  };
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const category = findCategory(slug);
  if (!category) notFound();

  const posts = (await loadPosts()).filter(
    (p) => p.categoryId === category.id,
  );
  const t = await getTranslations({ locale });

  return (
    <div className="space-y-10">
      <BlogBreadcrumbs
        crumbs={[
          { labelKey: "nav.home", href: "/" },
          { labelKey: "blog.meta.breadcrumbBlog", href: "/blog" },
          { labelKey: category.labelKey },
        ]}
      />

      <header className="space-y-3">
        <p className="label">{t("blog.categories.eyebrow")}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {t(category.labelKey)}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl">
          {t(category.descriptionKey)}
        </p>
      </header>

      <CategoryFilters activeSlug={category.slug} />

      {posts.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("blog.categories.empty")}
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
          {posts.map((p) => (
            <li key={p.slug}>
              <ArticleCard post={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
