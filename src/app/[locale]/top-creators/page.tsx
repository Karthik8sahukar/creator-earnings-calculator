import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CreatorAvatar } from "@/components/creator/CreatorAvatar";
import { Money } from "@/components/currency";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { publicConfig } from "@/lib/config";
import { getCreatorAvatars } from "@/lib/creatorAvatars";
import { listCreators } from "@/lib/creators";
import { buildRankings } from "@/lib/rankings";
import { getAllCountrySlugs } from "@/lib/countryData";
import { getAllCategorySlugs, CATEGORY_SLUGS } from "@/lib/categoryData";
import { buildAlternates } from "@/lib/i18nMetadata";
import {
  buildBreadcrumbListLd,
  buildItemListLd,
  serializeJsonLd,
} from "@/lib/jsonLd";

/**
 * `/[locale]/top-creators` — Global ranking page
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const title = "Top YouTube Creators 2026 — Ranked by Subscribers & Earnings";
  const description = "The definitive ranking of YouTube's top creators by estimated subscribers, earnings potential, and influence. Browse the top 50 creators worldwide.";

  return {
    title,
    description,
    alternates: buildAlternates({ locale, pathSuffix: "/top-creators" }),
    openGraph: { title, description, url: `${publicConfig.siteUrl}/${locale}/top-creators`, siteName: publicConfig.siteName, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TopCreatorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const ranked = buildRankings({ criteria: "subscribers", limit: 50 });
  const allCreators = listCreators();
  const t = await getTranslations({ locale, namespace: "common.breadcrumbs" });

  // Get Creator interface records for avatars
  const creatorRecords = ranked
    .map((r) => allCreators.find((c) => c.slug === r.creator.slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const avatars = await getCreatorAvatars(creatorRecords);

  // Country & category filter links
  const countrySlugs = getAllCountrySlugs().slice(0, 8);
  const categorySlugs = getAllCategorySlugs().slice(0, 8);

  // JSON-LD
  const breadcrumbLd = buildBreadcrumbListLd([
    { name: t("home"), url: `${publicConfig.siteUrl}/${locale}` },
    { name: "Top Creators", url: `${publicConfig.siteUrl}/${locale}/top-creators` },
  ]);
  const itemListLd = buildItemListLd(
    ranked.slice(0, 20).map((r) => ({
      name: r.creator.name,
      url: `${publicConfig.siteUrl}/${locale}/creator/${r.creator.slug}`,
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
            <span className="text-slate-700 dark:text-slate-300">Top Creators</span>
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="space-y-4">
        <p className="label">Rankings</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Top YouTube Creators 2026
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
          The top-ranked YouTube creators by estimated subscriber count and earnings potential.
          Rankings are derived from our creator database and public statistics.
        </p>
      </header>

      {/* Filter links */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filter by Country</h2>
        <div className="flex flex-wrap gap-2">
          {countrySlugs.map((s) => (
            <Link
              key={s}
              href={`/top-creators/${s}` as `/top-creators/${string}`}
              className="chip hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs"
            >
              {s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </Link>
          ))}
        </div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-4">Filter by Category</h2>
        <div className="flex flex-wrap gap-2">
          {categorySlugs.map((s) => (
            <Link
              key={s}
              href={`/top-creators/${s}` as `/top-creators/${string}`}
              className="chip hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs"
            >
              {CATEGORY_SLUGS[s]?.displayName ?? s}
            </Link>
          ))}
        </div>
      </section>

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
              {ranked.map((item) => (
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
    </div>
  );
}
