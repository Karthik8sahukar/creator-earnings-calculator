import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/blog/ArticleCard";
import { BlogBreadcrumbs } from "@/components/blog/BlogBreadcrumbs";
import { loadPosts } from "@/lib/blog";
import { routing } from "@/i18n/routing";
import { buildAlternates } from "@/lib/i18nMetadata";

/** Convert a URL slug back to the tag string used in frontmatter. */
function slugToTag(slug: string, allTags: string[]): string | undefined {
  const target = slug.toLowerCase().replace(/-/g, " ");
  return allTags.find((t) => t.toLowerCase() === target);
}

function tagToSlug(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, "-");
}

export async function generateStaticParams() {
  const posts = await loadPosts();
  const tags = new Set<string>();
  for (const p of posts) for (const t of p.tags) tags.add(tagToSlug(t));
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of tags) params.push({ locale, slug });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const posts = await loadPosts();
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));
  const tag = slugToTag(slug, allTags);
  if (!tag) return { title: "Not found", robots: { index: false } };

  const t = await getTranslations({ locale, namespace: "blog.tags" });
  return {
    title: t("pageTitle", { tag }),
    description: t("pageDescription", { tag }),
    alternates: buildAlternates({
      locale,
      pathSuffix: `/blog/tag/${slug}`,
    }),
    openGraph: {
      title: t("pageTitle", { tag }),
      description: t("pageDescription", { tag }),
      type: "website",
    },
  };
}

export default async function BlogTagPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const posts = await loadPosts();
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));
  const tag = slugToTag(slug, allTags);
  if (!tag) notFound();

  const filtered = posts.filter((p) =>
    p.tags.some((t) => t.toLowerCase() === tag.toLowerCase()),
  );
  const t = await getTranslations({ locale, namespace: "blog.tags" });

  return (
    <div className="space-y-10">
      <BlogBreadcrumbs
        crumbs={[
          { labelKey: "nav.home", href: "/" },
          { labelKey: "blog.meta.breadcrumbBlog", href: "/blog" },
          { label: `#${tag}` },
        ]}
      />

      <header className="space-y-3">
        <p className="label">{t("eyebrow")}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          #{tag}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl">
          {t("pageDescription", { tag })}
        </p>
      </header>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
        {filtered.map((p) => (
          <li key={p.slug}>
            <ArticleCard post={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
