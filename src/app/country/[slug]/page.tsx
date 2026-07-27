import { getT } from "@/lib/t";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CreatorCard } from "@/components/creator/CreatorCard";
import { Money } from "@/components/currency";
import Link from "next/link";
import { COUNTRY_PAGES } from "@/data/creators";
import { publicConfig } from "@/lib/config";
import { getCreatorAvatars } from "@/lib/creatorAvatars";
import { listCreators } from "@/lib/creators";
import {
  getAllCountrySlugs,
  getCountryPageData,
  buildCountryFaq,
} from "@/lib/countryData";
import { buildAlternates } from "@/lib/i18nMetadata";
import {
  buildBreadcrumbListLd,
  buildFaqPageLd,
  serializeJsonLd,
} from "@/lib/jsonLd";

/**
 * Country page: `/[locale]/country/[slug]`
 *
 * Displays:
 *   - Country overview with RPM/CPM data
 *   - Top creators from that country
 *   - Category breakdown
 *   - FAQ with structured data
 *   - Links to related pages
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  slug: string;
}

export function generateStaticParams() {
  return getAllCountrySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getCountryPageData(slug);
  if (!data) return {};

  const title = `Top YouTube Creators in ${data.label} — Earnings, RPM & Stats (2026)`;
  const description = `Discover the top YouTube creators from ${data.label}. Average RPM: $${data.averageRpm.toFixed(2)}/1,000 views. Browse ${data.totalCreators} creators, earnings estimates, and country-specific YouTube statistics.`;

  return {
    title,
    description,
    alternates: (() => {
      // If a curated /creators/country/ page exists for the same country,
      // point canonical there to avoid duplicate indexing.
      const curatedPage = COUNTRY_PAGES.find((c) => c.countryCode === data.countryCode);
      if (curatedPage) {
        return buildAlternates({ pathSuffix: `/creators/country/${curatedPage.slug}` });
      }
      return buildAlternates({ pathSuffix: `/country/${slug}` });
    })(),
    openGraph: {
      title,
      description,
      url: `${publicConfig.siteUrl}/country/${slug}`,
      siteName: publicConfig.siteName,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    keywords: [
      `YouTube ${data.label}`,
      `${data.label} YouTubers`,
      `YouTube RPM ${data.label}`,
      `YouTube CPM ${data.label}`,
      `${data.label} creators`,
      "YouTube earnings",
      "creator revenue",
    ],
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;

  const data = getCountryPageData(slug);
  if (!data) notFound();

  const faqEntries = buildCountryFaq(data);
  const allCreators = listCreators();

  // Get Creator interface records for the top creators
  const topCreatorRecords = data.topCreators
    .map((entry) => allCreators.find((c) => c.slug === entry.slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const avatars = await getCreatorAvatars(topCreatorRecords);

  const t = getT("common.breadcrumbs");

  // JSON-LD
  const canonicalUrl = `${publicConfig.siteUrl}/country/${slug}`;
  const breadcrumbLd = buildBreadcrumbListLd([
    { name: t("home"), url: `${publicConfig.siteUrl}` },
    { name: "Countries", url: `${publicConfig.siteUrl}/creators` },
    { name: data.label, url: canonicalUrl },
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
            <span className="text-slate-700 dark:text-slate-300">{data.label}</span>
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="space-y-4">
        <p className="label">Country</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Top YouTube Creators in {data.label}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Explore the top YouTube creators from {data.label}. This page covers estimated
          RPM rates, top categories, and detailed earnings data for {data.totalCreators} creators
          in our database.
        </p>
      </header>

      {/* Stats grid */}
      <section aria-labelledby="country-stats-title" className="card p-6 sm:p-8">
        <h2 id="country-stats-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
          {data.label} YouTube Statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Base RPM" value={<Money amount={data.baseRpm} />} subtitle="per 1,000 views" />
          <StatCard label="Shorts RPM" value={<Money amount={data.shortsRpm} />} subtitle="per 1,000 Shorts views" />
          <StatCard label="Estimated CPM" value={<Money amount={data.estimatedCpm} />} subtitle="advertiser cost" />
          <StatCard label="Creators" value={data.totalCreators.toString()} subtitle="in our database" />
        </div>
      </section>

      {/* Top Categories */}
      <section aria-labelledby="country-categories-title">
        <h2 id="country-categories-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Top Categories in {data.label}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.topCategories.slice(0, 8).map((cat) => (
            <div key={cat.category} className="card p-4">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{cat.category}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {cat.count} creator{cat.count !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Creators */}
      <section aria-labelledby="country-creators-title">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <h2 id="country-creators-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Top Creators from {data.label}
          </h2>
          <Link
            href={`/creators?country=${data.label}` as `/creators?country=${string}`}
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

      {/* RPM by Niche */}
      <section aria-labelledby="country-rpm-title" className="card p-6 sm:p-8">
        <h2 id="country-rpm-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          RPM by Niche in {data.label}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Estimated creator RPM (revenue per 1,000 views) for each content niche in {data.label}.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 text-left font-medium text-slate-600 dark:text-slate-400">Niche</th>
                <th className="py-2 text-right font-medium text-slate-600 dark:text-slate-400">Long-form RPM</th>
                <th className="py-2 text-right font-medium text-slate-600 dark:text-slate-400">Shorts RPM</th>
                <th className="py-2 text-right font-medium text-slate-600 dark:text-slate-400">Creators</th>
              </tr>
            </thead>
            <tbody>
              {data.topNiches.map((niche) => (
                <tr key={niche.niche} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2 text-slate-900 dark:text-slate-100">{niche.label}</td>
                  <td className="py-2 text-right font-medium text-emerald-700 dark:text-emerald-400">
                    ${(data.baseRpm * (data.topNiches.find((n) => n.niche === niche.niche) ? 1 : 1)).toFixed(2)}
                  </td>
                  <td className="py-2 text-right text-slate-600 dark:text-slate-400">
                    ${data.shortsRpm.toFixed(4)}
                  </td>
                  <td className="py-2 text-right text-slate-600 dark:text-slate-400">{niche.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      {faqEntries.length > 0 && (
        <section aria-labelledby="country-faq-title">
          <h2 id="country-faq-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
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

      {/* Related Countries */}
      <section aria-labelledby="related-countries-title">
        <h2 id="related-countries-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Explore Other Countries
        </h2>
        <div className="flex flex-wrap gap-2">
          {getAllCountrySlugs()
            .filter((s) => s !== slug)
            .slice(0, 8)
            .map((s) => {
              const otherData = getCountryPageData(s);
              if (!otherData) return null;
              // Link to the preferred /creators/country/ route when one exists
              const curatedPage = COUNTRY_PAGES.find((c) => c.countryCode === otherData.countryCode);
              const linkHref = curatedPage
                ? `/creators/country/${curatedPage.slug}` as `/creators/country/${string}`
                : `/country/${s}` as `/country/${string}`;
              return (
                <Link
                  key={s}
                  href={linkHref}
                  className="chip hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  {otherData.label}
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
