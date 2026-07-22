import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CREATORS_DATASET } from "@/data/creators";
import {
  getLeaderboardBySlug,
  listLeaderboardSlugs,
} from "@/data/creators/leaderboards";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
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
  const slugs = listLeaderboardSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const board = getLeaderboardBySlug(slug);
  if (!board) return {};
  const year = new Date().getFullYear();
  const title = board.title.replace("{year}", String(year));
  return {
    title,
    description: board.description,
    alternates: buildAlternates({ locale, pathSuffix: `/leaderboard/${slug}` }),
    openGraph: {
      title,
      description: board.description,
      url: `${publicConfig.siteUrl}/${locale}/leaderboard/${slug}`,
      siteName: publicConfig.siteName,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description: board.description },
    keywords: ["YouTube", "leaderboard", "earnings", String(year)],
  };
}

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const board = getLeaderboardBySlug(slug);
  if (!board) notFound();

  const creators = CREATORS_DATASET.filter(board.filter).slice(0, board.limit);
  const year = new Date().getFullYear();
  const title = board.title.replace("{year}", String(year));
  const base = publicConfig.siteUrl;

  const breadcrumbLd = buildBreadcrumbListLd([
    { name: "Home", url: `${base}/${locale}` },
    { name: "Leaderboard", url: `${base}/${locale}/leaderboard/${slug}` },
  ]);
  const itemListLd = buildItemListLd(
    creators.map((c) => ({
      name: c.name,
      url: `${base}/${locale}/creator/${c.slug}`,
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
        <Link href="/">Home</Link> &gt; <span>Leaderboard</span>
      </nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl">{board.intro}</p>
      </header>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map((c, i) => (
          <li key={c.slug} className="rounded-lg border p-4 hover:shadow-md transition-shadow">
            <Link href={`/creator/${c.slug}`} className="block space-y-1">
              <p className="text-xs text-slate-400">#{i + 1}</p>
              <p className="font-semibold text-slate-900 dark:text-slate-50">{c.name}</p>
              <p className="text-sm text-slate-500">{c.handle}</p>
              <p className="text-xs text-slate-400">{c.country} &middot; {c.category}</p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
