import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CreatorAvatar } from "@/components/creator/CreatorAvatar";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { publicConfig } from "@/lib/config";
import { getCreatorAvatars } from "@/lib/creatorAvatars";
import { getCreatorBySlug } from "@/lib/creators";
import {
  getComparisonData,
  buildComparisonFaq,
  getPopularComparisons,
  type ComparisonCreatorData,
} from "@/lib/comparison";
import { buildAlternates } from "@/lib/i18nMetadata";
import {
  buildBreadcrumbListLd,
  buildFaqPageLd,
  serializeJsonLd,
} from "@/lib/jsonLd";

/**
 * `/[locale]/compare/[slug]` — Creator comparison page
 * Slug format: "mrbeast-vs-pewdiepie"
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  locale: string;
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = getComparisonData(slug);
  if (!data) return {};

  const name1 = data.creator1.creator.name;
  const name2 = data.creator2.creator.name;
  const title = `${name1} vs ${name2} — YouTube Earnings Comparison (2026)`;
  const description = `Compare ${name1} and ${name2} on YouTube: subscribers, views, estimated earnings, RPM, CPM, country, category, and more.`;

  return {
    title,
    description,
    alternates: buildAlternates({ locale, pathSuffix: `/compare/${slug}` }),
    openGraph: {
      title,
      description,
      url: `${publicConfig.siteUrl}/${locale}/compare/${slug}`,
      siteName: publicConfig.siteName,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
    keywords: [
      `${name1} vs ${name2}`,
      `${name1} earnings`,
      `${name2} earnings`,
      "YouTube comparison",
      "creator earnings comparison",
    ],
  };
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const data = getComparisonData(slug);
  if (!data) notFound();

  const { creator1: c1, creator2: c2 } = data;
  const faqEntries = buildComparisonFaq(data);
  const popularComparisons = getPopularComparisons();

  // Get creator records for avatars
  const cr1 = getCreatorBySlug(c1.creator.slug);
  const cr2 = getCreatorBySlug(c2.creator.slug);
  const creatorsForAvatars = [cr1, cr2].filter((c): c is NonNullable<typeof c> => Boolean(c));
  const avatars = await getCreatorAvatars(creatorsForAvatars);

  // JSON-LD
  const name1 = c1.creator.name;
  const name2 = c2.creator.name;
  const canonicalUrl = `${publicConfig.siteUrl}/${locale}/compare/${slug}`;
  const breadcrumbLd = buildBreadcrumbListLd([
    { name: "Home", url: `${publicConfig.siteUrl}/${locale}` },
    { name: "Compare", url: canonicalUrl },
    { name: `${name1} vs ${name2}`, url: canonicalUrl },
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
            <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">Home</Link>
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden>›</span>
            <span className="text-slate-700 dark:text-slate-300">{name1} vs {name2}</span>
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="text-center space-y-4">
        <p className="label">Creator Comparison</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {name1} vs {name2}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          A detailed comparison of estimated earnings, RPM, content niche, and audience between these two creators.
        </p>
      </header>

      {/* Comparison cards */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ComparisonCard
          creator={c1}
          avatarUrl={avatars[c1.creator.slug] ?? null}
        />
        <ComparisonCard
          creator={c2}
          avatarUrl={avatars[c2.creator.slug] ?? null}
        />
      </section>

      {/* Side-by-side comparison table */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
          Detailed Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 text-left font-medium text-slate-600 dark:text-slate-400">Metric</th>
                <th className="py-3 text-center font-medium text-slate-600 dark:text-slate-400">{name1}</th>
                <th className="py-3 text-center font-medium text-slate-600 dark:text-slate-400">{name2}</th>
              </tr>
            </thead>
            <tbody>
              <CompRow label="Country" v1={c1.creator.country} v2={c2.creator.country} />
              <CompRow label="Category" v1={c1.creator.category} v2={c2.creator.category} />
              <CompRow label="Niche" v1={c1.nicheLabel} v2={c2.nicheLabel} />
              <CompRow label="Content Type" v1={c1.creator.contentType} v2={c2.creator.contentType} />
              <CompRow label="Subscriber Tier" v1={c1.creator.subscriberTier} v2={c2.creator.subscriberTier} />
              <CompRow label="Verified" v1={c1.creator.verified ? "Yes ✓" : "No"} v2={c2.creator.verified ? "Yes ✓" : "No"} />
              <CompRow
                label="Estimated RPM"
                v1={`$${c1.rpmExpected.toFixed(2)}`}
                v2={`$${c2.rpmExpected.toFixed(2)}`}
                highlight={c1.rpmExpected > c2.rpmExpected ? "v1" : c2.rpmExpected > c1.rpmExpected ? "v2" : undefined}
              />
              <CompRow
                label="Estimated CPM"
                v1={`$${c1.cpmExpected.toFixed(2)}`}
                v2={`$${c2.cpmExpected.toFixed(2)}`}
                highlight={c1.cpmExpected > c2.cpmExpected ? "v1" : c2.cpmExpected > c1.cpmExpected ? "v2" : undefined}
              />
              <CompRow
                label="Shorts RPM"
                v1={`$${c1.shortsRpmExpected.toFixed(4)}`}
                v2={`$${c2.shortsRpmExpected.toFixed(4)}`}
                highlight={c1.shortsRpmExpected > c2.shortsRpmExpected ? "v1" : c2.shortsRpmExpected > c1.shortsRpmExpected ? "v2" : undefined}
              />
              <CompRow label="Language" v1={c1.creator.language} v2={c2.creator.language} />
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          All figures are independent estimates. Actual earnings depend on monthly views, upload frequency, sponsorships, and other factors we cannot observe.
        </p>
      </section>

      {/* FAQ */}
      {faqEntries.length > 0 && (
        <section aria-labelledby="compare-faq-title">
          <h2 id="compare-faq-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
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

      {/* Popular Comparisons */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Popular Comparisons
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popularComparisons
            .filter((p) => p.slug !== slug)
            .slice(0, 6)
            .map((comparison) => (
              <Link
                key={comparison.slug}
                href={`/compare/${comparison.slug}` as `/compare/${string}`}
                className="card p-4 hover:-translate-y-0.5 transition hover:shadow-pop text-center"
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  {comparison.name1} vs {comparison.name2}
                </p>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function ComparisonCard({
  creator,
  avatarUrl,
}: {
  creator: ComparisonCreatorData;
  avatarUrl: string | null;
}) {
  return (
    <Link
      href={`/creator/${creator.creator.slug}` as `/creator/${string}`}
      className="card p-6 hover:-translate-y-0.5 transition hover:shadow-pop"
    >
      <div className="flex items-center gap-4 mb-4">
        <CreatorAvatar
          src={avatarUrl}
          alt={creator.creator.name}
          initial={creator.creator.name.charAt(0)}
        />
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {creator.creator.name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {creator.creator.handle}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MiniStat label="RPM" value={`$${creator.rpmExpected.toFixed(2)}`} />
        <MiniStat label="CPM" value={`$${creator.cpmExpected.toFixed(2)}`} />
        <MiniStat label="Country" value={creator.creator.country} />
        <MiniStat label="Category" value={creator.creator.category} />
      </div>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function CompRow({
  label,
  v1,
  v2,
  highlight,
}: {
  label: string;
  v1: string;
  v2: string;
  highlight?: "v1" | "v2";
}) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">{label}</td>
      <td className={`py-3 text-center ${highlight === "v1" ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"}`}>
        {v1}
      </td>
      <td className={`py-3 text-center ${highlight === "v2" ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"}`}>
        {v2}
      </td>
    </tr>
  );
}
