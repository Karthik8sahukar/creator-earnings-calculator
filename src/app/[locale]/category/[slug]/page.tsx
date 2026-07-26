import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CreatorCard } from "@/components/creator/CreatorCard";
import { Money } from "@/components/currency";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getCategoryBySlug as getCuratedCategory } from "@/data/creators";
import { publicConfig } from "@/lib/config";
import { getCreatorAvatars } from "@/lib/creatorAvatars";
import { listCreators } from "@/lib/creators";
import {
  getAllCategorySlugs,
  getCategoryPageData,
  buildCategoryFaq,
} from "@/lib/categoryData";
import { COUNTRY_CODE_TO_SLUG } from "@/lib/countryData";
import { buildAlternates } from "@/lib/i18nMetadata";
import {
  buildBreadcrumbListLd,
  buildFaqPageLd,
  serializeJsonLd,
} from "@/lib/jsonLd";
import { findCountry } from "@/lib/rpmData";

/**
 * Category page: `/[locale]/category/[slug]`
 *
 * Displays:
 *   - Category overview with RPM/CPM data
 *   - Top creators in that category
 *   - Country breakdown
 *   - FAQ with structured data
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  locale: string;
  slug: string;
}

export function generateStaticParams() {
  const slugs = getAllCategorySlugs();
  const params: RouteParams[] = [];
  for (const locale of routing.locales) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = getCategoryPageData(slug);
  if (!data) return {};

  const title = `Top ${data.displayName} YouTube Creators — Earnings, RPM & Stats (2026)`;
  const description = `Discover the top ${data.displayName} YouTube creators. Average RPM: $${data.averageRpm.toFixed(2)}/1,000 views. RPM multiplier: ${data.rpmMultiplier}×. Browse ${data.totalCreators} creators with earnings estimates.`;

  return {
    title,
    description,
    alternates: (() => {
      // If a curated /creators/[category] page exists for the same slug,
      // point canonical there to avoid duplicate indexing.
      const curatedCat = getCuratedCategory(slug);
      if (curatedCat) {
        return buildAlternates({ locale, pathSuffix: `/creators/${curatedCat.slug}` });
      }
      return buildAlternates({ locale, pathSuffix: `/category/${slug}` });
    })(),
    openGraph: {
      title,
      description,
      url: `${publicConfig.siteUrl}/${locale}/category/${slug}`,
      siteName: publicConfig.siteName,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    keywords: [
      `${data.displayName} YouTube`,
      `${data.displayName} YouTubers`,
      `YouTube RPM ${data.displayName}`,
      `${data.displayName} creators earnings`,
      "YouTube revenue",
      "creator earnings",
    ],
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const data = getCategoryPageData(slug);
  if (!data) notFound();

  const faqEntries = buildCategoryFaq(data);
  const allCreators = listCreators();

  const topCreatorRecords = data.topCreators
    .map((entry) => allCreators.find((c) => c.slug === entry.slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const avatars = await getCreatorAvatars(topCreatorRecords);

  const t = await getTranslations({ locale, namespace: "common.breadcrumbs" });

  // JSON-LD
  const canonicalUrl = `${publicConfig.siteUrl}/${locale}/category/${slug}`;
  const breadcrumbLd = buildBreadcrumbListLd([
    { name: t("home"), url: `${publicConfig.siteUrl}/${locale}` },
    { name: "Categories", url: `${publicConfig.siteUrl}/${locale}/creators` },
    { name: data.displayName, url: canonicalUrl },
  ]);
  const faqLd = faqEntries.length > 0 ? buildFaqPageLd(faqEntries) : null;
  const jsonLdPayloads = [breadcrumbLd, ...(faqLd ? [faqLd] : [])];

  return (
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdPayloads) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden>›</span>
            <Link href="/creators" className="hover:text-slate-900 dark:hover:text-slate-100">
              Creators
            </Link>
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden>›</span>
            <span className="text-slate-700 dark:text-slate-300">{data.displayName}</span>
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="space-y-4">
        <p className="label">Category</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Top {data.displayName} YouTube Creators
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Explore the top {data.displayName} creators on YouTube. This niche has an RPM multiplier
          of {data.rpmMultiplier}× — meaning {data.displayName} content earns{" "}
          {data.rpmMultiplier > 1 ? "above" : data.rpmMultiplier < 1 ? "below" : "at"} the
          platform average per view.
        </p>
      </header>

      {/* Stats grid */}
      <section aria-labelledby="category-stats-title" className="card p-6 sm:p-8">
        <h2 id="category-stats-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
          {data.displayName} YouTube Statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="RPM Multiplier" value={`${data.rpmMultiplier}×`} subtitle="vs. platform average" />
          <StatCard label="Average RPM" value={<Money amount={data.averageRpm} />} subtitle="per 1,000 views (global)" />
          <StatCard label="Estimated CPM" value={<Money amount={data.estimatedCpm} />} subtitle="advertiser cost" />
          <StatCard label="Creators" value={data.totalCreators.toString()} subtitle="in our database" />
        </div>
      </section>

      {/* Top Countries */}
      <section aria-labelledby="category-countries-title">
        <h2 id="category-countries-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {data.displayName} Creators by Country
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.topCountries.slice(0, 8).map((countryItem) => {
            const countrySlug = COUNTRY_CODE_TO_SLUG[countryItem.countryCode];
            return (
              <Link
                key={countryItem.countryCode}
                href={`/country/${countrySlug}` as `/country/${string}`}
                className="card p-4 hover:-translate-y-0.5 transition hover:shadow-pop"
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100">{countryItem.country}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {countryItem.count} creator{countryItem.count !== 1 ? "s" : ""}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Top Creators */}
      <section aria-labelledby="category-creators-title">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <h2 id="category-creators-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Top {data.displayName} Creators
          </h2>
          <Link
            href={`/creators?category=${data.displayName}` as `/creators?category=${string}`}
            className="btn-secondary text-sm"
          >
            View all
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topCreatorRecords.slice(0, 12).map((c) => (
            <li key={c.slug}>
              <CreatorCard creator={c} avatarUrl={avatars[c.slug] ?? null} />
            </li>
          ))}
        </ul>
      </section>

      {/* RPM Comparison */}
      <section aria-labelledby="category-rpm-title" className="card p-6 sm:p-8">
        <h2 id="category-rpm-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {data.displayName} RPM by Country
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          How much {data.displayName} creators earn per 1,000 views in different countries.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 text-left font-medium text-slate-600 dark:text-slate-400">Country</th>
                <th className="py-2 text-right font-medium text-slate-600 dark:text-slate-400">Long-form RPM</th>
                <th className="py-2 text-right font-medium text-slate-600 dark:text-slate-400">Shorts RPM</th>
              </tr>
            </thead>
            <tbody>
              {data.topCountries.map((countryItem) => {
                const countryTier = findCountry(countryItem.countryCode);
                const rpm = countryTier.baseRpm * data.rpmMultiplier;
                const shortsRpm = countryTier.shortsRpm * data.shortsRpmMultiplier;
                return (
                  <tr key={countryItem.countryCode} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 text-slate-900 dark:text-slate-100">{countryItem.country}</td>
                    <td className="py-2 text-right font-medium text-emerald-700 dark:text-emerald-400">
                      ${rpm.toFixed(2)}
                    </td>
                    <td className="py-2 text-right text-slate-600 dark:text-slate-400">
                      ${shortsRpm.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      {faqEntries.length > 0 && (
        <section aria-labelledby="category-faq-title">
          <h2 id="category-faq-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="card divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
            {faqEntries.map((entry, i) => (
              <details key={i} className="group">
                <summary className="cursor-pointer flex items-start gap-3 px-5 py-4 text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100">
                  <span className="flex-1">{entry.question}</span>
                  <span className="text-slate-400 transition group-open:rotate-180">▾</span>
                </summary>
                <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {entry.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Related Categories */}
      <section aria-labelledby="related-categories-title">
        <h2 id="related-categories-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Explore Other Categories
        </h2>
        <div className="flex flex-wrap gap-2">
          {getAllCategorySlugs()
            .filter((s) => s !== slug)
            .slice(0, 10)
            .map((s) => {
              const otherData = getCategoryPageData(s);
              if (!otherData) return null;
              return (
                <Link
                  key={s}
                  href={`/category/${s}` as `/category/${string}`}
                  className="chip hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  {otherData.displayName}
                </Link>
              );
            })}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: React.ReactNode; subtitle: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}
