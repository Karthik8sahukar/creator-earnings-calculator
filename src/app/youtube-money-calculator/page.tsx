import type { Metadata } from "next";
import { Suspense } from "react";

import { ChannelWorkspace } from "@/components/ChannelWorkspace";
import Link from "next/link";
import { ToolPageActions } from "@/components/ui/ToolPageActions";
import { publicConfig } from "@/lib/config";
import { buildAlternates } from "@/lib/i18nMetadata";

/**
 * YouTube Money Calculator — dedicated tool page.
 *
 * This is the flagship creator analytics tool. It wraps the existing
 * ChannelWorkspace component (YouTube channel search + earnings estimator)
 * in a proper SEO-optimized page with metadata, FAQ, and structured data.
 *
 * Route: /[locale]/youtube-money-calculator
 */

const PATH = "/youtube-money-calculator";

const FAQ = [
  { q: "How does the YouTube Money Calculator work?", a: "Enter a YouTube @handle, channel URL, or channel ID. We fetch public statistics from the YouTube Data API and estimate monthly earnings using country-specific RPM rates, niche multipliers, and content-type adjustments." },
  { q: "Is this tool free?", a: "Yes. The YouTube Money Calculator is completely free, requires no login, and processes all data in your browser. Only the YouTube API lookup touches our server." },
  { q: "How accurate are the earnings estimates?", a: "Estimates are based on industry-average RPM data. Actual creator earnings vary based on ad rates, audience geography, watch time, memberships, sponsorships, and merchandise. Our estimates provide a reasonable range (Conservative / Expected / Optimistic)." },
  { q: "Can I check any YouTube channel?", a: "You can look up any public YouTube channel by entering its @handle (e.g., @MrBeast), channel URL, or channel ID (UC...). Private or terminated channels cannot be resolved." },
  { q: "What data do you collect?", a: "None. We do not store search queries, channel data, or earnings estimates. Every calculation happens in real-time and is discarded after you leave the page." },
];

export function generateStaticParams() {
  return [{}];
}

export async function generateMetadata({
  params,
}: {
  /* no params */;
}): Promise<Metadata> {

  const title = "YouTube Money Calculator — Estimate Channel Earnings Free";
  const description = "Estimate how much any YouTube channel earns per month. Enter a @handle or channel URL to see estimated revenue, RPM, CPM, and monetization analytics. Free, no login required.";

  return {
    title,
    description,
    keywords: [
      "YouTube Money Calculator",
      "YouTube earnings calculator",
      "how much does a YouTuber make",
      "YouTube revenue estimator",
      "channel income calculator",
      "YouTube RPM",
      "YouTube CPM",
    ],
    alternates: buildAlternates({ pathSuffix: PATH }),
    openGraph: {
      type: "website",
      title,
      description,
      url: `${publicConfig.siteUrl}${PATH}`,
      siteName: publicConfig.siteName,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function YouTubeMoneyCalculatorPage({
  params,
}: {
  /* no params */;
}) {

  const pageUrl = `${publicConfig.siteUrl}${PATH}`;

  // JSON-LD structured data
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${publicConfig.siteUrl}` },
        { "@type": "ListItem", position: 2, name: "YouTube Money Calculator", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "YouTube Money Calculator",
      description: "Estimate YouTube channel earnings from public statistics.",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: pageUrl,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: { "@type": "Organization", name: publicConfig.siteName },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 dark:text-slate-400">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">Home</Link>
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden>&rsaquo;</span>
            <span className="text-slate-700 dark:text-slate-300">YouTube Money Calculator</span>
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="space-y-3 text-center sm:text-left">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium dark:bg-brand-500/10 dark:text-brand-200">
              Creator Analytics
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              YouTube Money Calculator
            </h1>
          </div>
          <ToolPageActions slug="youtube-money-calculator" title="YouTube Money Calculator" />
        </div>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl">
          Estimate how much any YouTube channel earns per month. Enter a @handle, channel URL, or channel ID to see estimated revenue, RPM, and monetization analytics.
        </p>
      </header>

      {/* Channel Search + Earnings Calculator */}
      <section aria-label="YouTube channel search and earnings calculator">
        <Suspense fallback={<SearchFallback />}>
          <ChannelWorkspace />
        </Suspense>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="card p-6 sm:p-8 space-y-4">
        <h2 id="faq-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Frequently Asked Questions
        </h2>
        <dl className="space-y-4">
          {FAQ.map((item) => (
            <div key={item.q}>
              <dt className="font-medium text-slate-900 dark:text-slate-100">{item.q}</dt>
              <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Related calculators */}
      <section aria-labelledby="related-title" className="space-y-4">
        <h2 id="related-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Related Calculators
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <RelatedLink href="/youtube-rpm-calculator" title="RPM Calculator" description="Calculate revenue per 1,000 views." />
          <RelatedLink href="/youtube-cpm-calculator" title="CPM Calculator" description="Calculate advertiser cost per 1,000 impressions." />
          <RelatedLink href="/youtube-shorts-calculator" title="Shorts Calculator" description="Estimate Shorts-specific revenue." />
          <RelatedLink href="/youtube-sponsorship-calculator" title="Sponsorship Calculator" description="Estimate per-video sponsorship rates." />
          <RelatedLink href="/instagram-money-calculator" title="Instagram Calculator" description="Estimate Instagram creator earnings." />
          <RelatedLink href="/youtube-engagement-calculator" title="Engagement Calculator" description="Calculate engagement rate." />
        </div>
      </section>
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="skeleton h-14 w-full rounded-2xl" aria-hidden />
      <span className="sr-only">Loading calculator...</span>
    </div>
  );
}

function RelatedLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href as never}
      className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition hover:-translate-y-0.5 hover:shadow-pop"
    >
      <p className="font-medium text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </Link>
  );
}
