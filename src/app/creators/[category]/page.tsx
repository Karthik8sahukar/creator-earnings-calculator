import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getCategoryBySlug,
  listCategorySlugs,
  listCreatorsByCategory,
} from "@/data/creators";
import Link from "next/link";
import { publicConfig } from "@/lib/config";
import { buildAlternates } from "@/lib/i18nMetadata";
import {
  buildBreadcrumbListLd,
  buildItemListLd,
  serializeJsonLd,
} from "@/lib/jsonLd";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return listCategorySlugs().map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) return {};
  const year = new Date().getFullYear();
  const title = cat.title.replace("{year}", String(year));
  return {
    title,
    description: cat.description,
    alternates: buildAlternates({ pathSuffix: `/creators/${category}` }),
    openGraph: {
      title,
      description: cat.description,
      url: `${publicConfig.siteUrl}/creators/${category}`,
      siteName: publicConfig.siteName,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description: cat.description },
    keywords: [cat.label, "YouTube", "earnings", "analytics", String(year)],
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  const cat = getCategoryBySlug(category);
  if (!cat) notFound();

  const creators = listCreatorsByCategory(cat.label);
  const year = new Date().getFullYear();
  const title = cat.title.replace("{year}", String(year));
  const base = publicConfig.siteUrl;

  const breadcrumbLd = buildBreadcrumbListLd([
    { name: "Home", url: `${base}` },
    { name: "Creators", url: `${base}/creators` },
    { name: cat.label, url: `${base}/creators/${category}` },
  ]);
  const itemListLd = buildItemListLd(
    creators.map((c) => ({
      name: c.name,
      url: `${base}/creator/${c.slug}`,
      description: c.description,
    })),
  );

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd([breadcrumbLd, itemListLd]) }}
      />
      <nav className="text-sm text-slate-500 dark:text-slate-400">
        <Link href="/">Home</Link> &gt; <Link href="/creators">Creators</Link> &gt;{" "}
        <span>{cat.label}</span>
      </nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl">{cat.intro}</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map((c) => (
          <li key={c.slug} className="rounded-lg border p-4 hover:shadow-md transition-shadow">
            <Link href={`/creator/${c.slug}`} className="block space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-50">{c.name}</p>
              <p className="text-sm text-slate-500">{c.handle}</p>
              <p className="text-xs text-slate-400">{c.country}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
