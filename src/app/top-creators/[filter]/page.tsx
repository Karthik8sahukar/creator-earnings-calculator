import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CreatorAvatar } from "@/components/creator/CreatorAvatar";
import { Money } from "@/components/currency";
import Link from "next/link";
import { publicConfig } from "@/lib/config";
import { getCreatorAvatars } from "@/lib/creatorAvatars";
import { listCreators } from "@/lib/creators";
import { getRankingsPageData, getAllRankingFilterSlugs } from "@/lib/rankings";
import { buildAlternates } from "@/lib/i18nMetadata";
import {
  buildBreadcrumbListLd,
  buildItemListLd,
  serializeJsonLd,
} from "@/lib/jsonLd";

/**
 * `/[locale]/top-creators/[filter]` — Filtered ranking page
 * Supports country slugs (e.g., /top-creators/india)
 * and category slugs (e.g., /top-creators/gaming)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  filter: string;
}

export function generateStaticParams() {
  return getAllRankingFilterSlugs().map((filter) => ({ filter }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { filter } = await params;
  const data = getRankingsPageData(filter);
  if (!data) return {};

  return {
    title: data.title,
    description: data.description,
    alternates: buildAlternates({ pathSuffix: `/top-creators/${filter}` }),
    openGraph: {
      title: data.title,
      description: data.description,
      url: `${publicConfig.siteUrl}/top-creators/${filter}`,
      siteName: publicConfig.siteName,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: data.title, description: data.description },
  };
}

export default async function FilteredRankingsPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { filter } = await params;

  const data = getRankingsPageData(filter);
  if (!data) notFound();

  const allCreators = listCreators();
  const creatorRecords = data.creators
    .map((r) => allCreators.find((c) => c.slug === r.creator.slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const avatars = await getCreatorAvatars(creatorRecords);

  // JSON-LD
  const breadcrumbLd = buildBreadcrumbListLd([
    { name: "Home", url: `${publicConfig.siteUrl}` },
    { name: "Top Creators", url: `${publicConfig.siteUrl}/top-creators` },
    { name: data.title, url: `${publicConfig.siteUrl}/top-creators/${filter}` },
  ]);
  const itemListLd = buildItemListLd(
    data.creators.slice(0, 20).map((r) => ({
      name: r.creator.name,
      url: `${publicConfig.siteUrl}/creator/${r.creator.slug}`,
      description: r.creator.description,
    })),
  );

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd([breadcrumbLd, itemListLd]) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">Home</Link>
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden>›</span>
            <Link href="/top-creators" className="hover:text-slate-900 dark:hover:text-slate-100">Top Creators</Link>
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden>›</span>
            <span className="text-slate-700 dark:text-slate-300">
              {filter.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="space-y-4">
        <p className="label">Rankings</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {data.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
          {data.description}
        </p>
        <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
          {data.total} creators ranked
        </p>
      </header>

      {/* Rankings table */}
      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <th className="py-3 px-4 text-left font-medium text-slate-600 dark:text-slate-400 w-12">#</th>
                <th className="py-3 px-4 text-left font-medium text-slate-600 dark:text-slate-400">Creator</th>
                <th className="py-3 px-4 text-left font-medium text-slate-600 dark:text-slate-400 hidden sm:table-cell">Category</th>
                <th className="py-3 px-4 text-left font-medium text-slate-600 dark:text-slate-400 hidden md:table-cell">Country</th>
                <th className="py-3 px-4 text-right font-medium text-slate-600 dark:text-slate-400">Est. RPM</th>
                <th className="py-3 px-4 text-right font-medium text-slate-600 dark:text-slate-400 hidden lg:table-cell">Est. Monthly</th>
              </tr>
            </thead>
            <tbody>
              {data.creators.map((item) => (
                <tr key={item.creator.slug} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 font-bold text-slate-400 dark:text-slate-500">
                    {item.rank}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/creator/${item.creator.slug}` as `/creator/${string}`}
                      className="flex items-center gap-3 hover:text-brand-700 dark:hover:text-brand-300"
                    >
                      <CreatorAvatar
                        src={avatars[item.creator.slug] ?? null}
                        alt={item.creator.name}
                        initial={item.creator.name.charAt(0)}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.creator.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {item.creator.handle}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className="chip-brand text-[10px]">{item.creator.category}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 hidden md:table-cell">
                    {item.creator.country}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-emerald-700 dark:text-emerald-400">
                    <Money amount={item.estimatedRpm} />
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                    ~<Money amount={item.estimatedMonthlyEarnings} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Back link */}
      <Link href="/top-creators" className="btn-secondary inline-flex">
        ← View all rankings
      </Link>
    </div>
  );
}
