import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  ChannelAnalyzerLoadingSkeleton,
  ChannelInput,
  RelatedTools,
} from "@/components/tools/channel-analyzer";
import { Link } from "@/i18n/navigation";
import { HREFLANG_MAP, routing, type AppLocale } from "@/i18n/routing";
import { publicConfig } from "@/lib/config";
import { buildAlternates } from "@/lib/i18nMetadata";
import {
  buildBreadcrumbListLd,
  serializeJsonLd,
} from "@/lib/jsonLd";

import { ChannelAnalyzerResults } from "./ChannelAnalyzerResults";

/**
 * ─────────────────────────────────────────────────────────────────
 *   YouTube Channel Analyzer — server-rendered shell
 * ─────────────────────────────────────────────────────────────────
 *
 * Route: `/[locale]/tools/channel-analyzer`
 *
 * Composition:
 *   • Breadcrumb + hero + <ChannelInput /> (client island)
 *   • <Suspense fallback=<LoadingSkeleton />>
 *       <ChannelAnalyzerResults q={q} />   (server, awaits analyzer)
 *     </Suspense>
 *   • <RelatedTools />  (server, static)
 *   • JSON-LD: BreadcrumbList + SoftwareApplication
 *
 * SEO:
 *   • `generateMetadata` emits title / description / keywords /
 *     alternates (canonical + hreflang for every locale + x-default)
 *     / OpenGraph / Twitter — mirrors the Instagram calculator page.
 *   • Query-string variants (`?q=…`) are `noindex, follow` so the
 *     canonical URL is the only one search engines rank. This
 *     prevents the tool from spawning thousands of thin per-channel
 *     variants in the index.
 *
 * Performance:
 *   • Suspense-based streaming keeps the hero/input interactive
 *     while the analyzer awaits YouTube.
 *   • All YouTube calls go through the process-local TtlCache
 *     in `src/lib/cache.ts` — analyzing the same channel twice
 *     within TTL costs zero API quota.
 *   • No client-side fetching happens on this page: the ChannelInput
 *     just navigates with `router.push(?q=…)` and the server
 *     re-renders.
 */

export const runtime = "nodejs";
// Analyzer results are per-query; opt out of static rendering.
export const dynamic = "force-dynamic";

const PATH_SUFFIX = "/tools/channel-analyzer";

interface RouteParams {
  locale: string;
}

interface RouteSearchParams {
  q?: string | string[];
  [key: string]: string | string[] | undefined;
}

interface PageProps {
  params: Promise<RouteParams>;
  searchParams: Promise<RouteSearchParams>;
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Extract the (single) `q` query string. Arrays (unlikely from a
 * plain form submit, but Next allows them) collapse to the first
 * non-empty entry, matching how the rest of the site treats
 * repeated search params.
 */
function pickQuery(raw: string | string[] | undefined): string {
  if (!raw) return "";
  if (Array.isArray(raw)) return raw.find((v) => v.trim().length > 0) ?? "";
  return raw;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const search = await searchParams;
  const query = pickQuery(search.q);
  const t = await getTranslations({
    locale,
    namespace: "tools.channelAnalyzer.meta",
  });

  const meta: Metadata = {
    title: t("title"),
    description: t("description"),
    keywords: [
      "YouTube Channel Analyzer",
      "YouTube channel earnings",
      "Channel statistics",
      "YouTube analytics tool",
      "Estimate YouTube earnings",
      "Channel performance analyzer",
      "YouTube RPM estimator",
    ],
    alternates: buildAlternates({ locale, pathSuffix: PATH_SUFFIX }),
    openGraph: {
      type: "website",
      title: t("title"),
      description: t("ogDescription"),
      url: `/${locale}${PATH_SUFFIX}`,
      siteName: publicConfig.siteName,
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("ogDescription"),
    },
  };

  // Per-query variants are useful UX but should not compete with the
  // canonical page in search results. `noindex, follow` keeps link
  // equity flowing without polluting the index.
  if (query) {
    meta.robots = { index: false, follow: true };
  }

  return meta;
}

export default async function ChannelAnalyzerPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const search = await searchParams;
  const query = pickQuery(search.q);

  const t = await getTranslations({
    locale,
    namespace: "tools.channelAnalyzer",
  });
  const tCommon = await getTranslations({ locale });

  const pageUrl = `${publicConfig.siteUrl}/${locale}${PATH_SUFFIX}`;
  const inLanguage = HREFLANG_MAP[locale as AppLocale] ?? locale;

  const breadcrumbLd = buildBreadcrumbListLd([
    {
      name: tCommon("common.breadcrumbs.home"),
      url: `${publicConfig.siteUrl}/${locale}`,
    },
    {
      name: t("breadcrumb"),
      url: pageUrl,
    },
  ]);

  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t("meta.title"),
    description: t("meta.description"),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: pageUrl,
    inLanguage,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: { "@type": "Organization", name: publicConfig.siteName },
  };

  const jsonLd = serializeJsonLd([breadcrumbLd, softwareLd]);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Breadcrumb — visible + machine-readable via JSON-LD below. */}
      <nav
        aria-label={t("breadcrumbAria")}
        className="text-xs text-slate-500 dark:text-slate-400"
      >
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link
              href="/"
              className="hover:text-slate-900 dark:hover:text-slate-100"
            >
              {tCommon("common.breadcrumbs.home")}
            </Link>
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden>›</span>
            <span aria-current="page">{t("breadcrumb")}</span>
          </li>
        </ol>
      </nav>

      {/* Hero + input */}
      <header
        className="space-y-4 text-center sm:text-left"
        aria-labelledby="channel-analyzer-h1"
      >
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">
          {t("hero.eyebrow")}
        </p>
        <h1
          id="channel-analyzer-h1"
          className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          {t("hero.title")}
        </h1>
        <p className="max-w-2xl text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
          {t("hero.subtitle")}
        </p>
        <ul className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
          {(["free", "noLogin", "estimatesOnly"] as const).map((key) => (
            <li key={key}>
              <span className="chip-brand">{t(`hero.badges.${key}`)}</span>
            </li>
          ))}
        </ul>

        <div className="pt-4">
          <ChannelInput initialValue={query} autoFocus={!query} />
        </div>
      </header>

      {/* Results — server-side data, wrapped in Suspense for
          non-blocking loading. The `key` prop makes the boundary
          re-suspend on every new query, so submitting a new URL
          shows the skeleton immediately instead of the previous
          channel's content. */}
      <Suspense
        key={query || "empty"}
        fallback={<ChannelAnalyzerLoadingSkeleton />}
      >
        <ChannelAnalyzerResults locale={locale} query={query} />
      </Suspense>

      {/* Static, evergreen sections */}
      <RelatedTools />

      <Script
        id="channel-analyzer-ld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
    </div>
  );
}
