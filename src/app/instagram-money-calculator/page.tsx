import { getT } from "@/lib/t";
import type { Metadata } from "next";
import Script from "next/script";

import Link from "next/link";
import { publicConfig } from "@/lib/config";
import { buildAlternates } from "@/lib/i18nMetadata";

import { InstagramCalcClient } from "@/components/instagram/InstagramCalcClient";

/**
 * Instagram Money Calculator — server-rendered shell.
 *
 * • `generateMetadata` emits Title / Description / Canonical /
 *   hreflang / OpenGraph / Twitter card / keywords.
 * • The page emits three JSON-LD blocks:
 *     1. BreadcrumbList
 *     2. SoftwareApplication
 *     3. FAQPage
 * • The interactive calculator itself is a client component; the
 *   informational sections (hero, "how we estimate", "factors",
 *   FAQ, methodology, disclaimer, related calculators) are
 *   server-rendered so they are indexable regardless of JS.
 */

const PATH_SUFFIX = "/instagram-money-calculator";

const FAQ_KEYS = [
  "howMuchDoesInstagramPay",
  "howMuchCan100k",
  "howMuchShouldICharge",
  "howDoSponsoredPostsWork",
  "doReelsEarnMore",
  "howMuchDoStoriesPay",
  "howIsEngagementUsed",
  "doesInstagramPayDirectly",
  "reachVsFollowers",
] as const;

export async function generateStaticParams() {
  return [{}];
}

export async function generateMetadata({
  params,
}: {
  /* no params */;
}): Promise<Metadata> {
  const t = getT("instagramCalculator.meta");

  return {
    title: t("title"),
    description: t("description"),
    keywords: [
      "Instagram Money Calculator",
      "Instagram Earnings Calculator",
      "Instagram Income Calculator",
      "Instagram Influencer Calculator",
      "Instagram Sponsorship Calculator",
      "How much do Instagram influencers make",
      "Instagram Revenue Calculator",
    ],
    alternates: buildAlternates({ pathSuffix: PATH_SUFFIX }),
    openGraph: {
      type: "website",
      title: t("title"),
      description: t("ogDescription"),
      url: `${PATH_SUFFIX}`,
      siteName: publicConfig.siteName,
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("ogDescription"),
    },
  };
}

export default async function InstagramCalculatorPage({
  params,
}: {
  /* no params */;
}) {

  const t = getT("instagramCalculator.meta");
  const tCommon = getT();

  const pageUrl = `${publicConfig.siteUrl}${PATH_SUFFIX}`;
  const inLanguage = HREFLANG_MAP[locale as AppLocale] ?? locale;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: tCommon("common.breadcrumbs.home"),
        item: `${publicConfig.siteUrl}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("breadcrumb"),
        item: pageUrl,
      },
    ],
  };

  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t("meta.title"),
    description: t("meta.description"),
    applicationCategory: "FinanceApplication",
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

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage,
    mainEntity: FAQ_KEYS.map((k) => ({
      "@type": "Question",
      name: t(`faq.items.${k}.q`),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(`faq.items.${k}.a`),
      },
    })),
  };

  const jsonLd = [breadcrumbLd, softwareLd, faqLd];

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Breadcrumbs (visible) */}
      <nav
        aria-label={tCommon("channelPage.breadcrumbAria")}
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

      {/* Hero */}
      <header className="space-y-3 text-center sm:text-left">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">
          {t("hero.eyebrow")}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {t("hero.title")}
        </h1>
        <p className="max-w-2xl text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
          {t("hero.subtitle")}
        </p>
        <ul className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
          {(["free", "noLogin", "estimatesOnly"] as const).map((key) => (
            <li key={key}>
              <span className="chip-brand">{t(`hero.badges.${key}`)}</span>
            </li>
          ))}
        </ul>
      </header>

      {/* Interactive calculator + results + chart */}
      <InstagramCalcClient />

      {/* How We Estimate Earnings */}
      <section
        aria-labelledby="ig-how-title"
        className="card p-6 sm:p-8 space-y-4"
      >
        <h2
          id="ig-how-title"
          className="text-xl font-semibold text-slate-900 dark:text-slate-100"
        >
          {t("how.title")}
        </h2>
        <p className="text-slate-600 dark:text-slate-300">{t("how.intro")}</p>
        <ol className="list-decimal space-y-2 pl-5 text-slate-700 dark:text-slate-300">
          {(["reach", "engagement", "niche", "country", "cadence", "affiliate", "subscriptions"] as const).map(
            (k) => (
              <li key={k}>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {t(`how.steps.${k}.title`)}:
                </span>{" "}
                {t(`how.steps.${k}.body`)}
              </li>
            ),
          )}
        </ol>
      </section>

      {/* Factors Affecting Income */}
      <section
        aria-labelledby="ig-factors-title"
        className="card p-6 sm:p-8 space-y-4"
      >
        <h2
          id="ig-factors-title"
          className="text-xl font-semibold text-slate-900 dark:text-slate-100"
        >
          {t("factors.title")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              "audienceQuality",
              "postingConsistency",
              "brandFit",
              "seasonality",
              "algorithmChanges",
              "geographyMix",
              "disclosureCompliance",
              "categoryDemand",
            ] as const
          ).map((k) => (
            <div
              key={k}
              className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {t(`factors.items.${k}.title`)}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t(`factors.items.${k}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section
        aria-labelledby="ig-faq-title"
        className="card p-6 sm:p-8 space-y-4"
      >
        <h2
          id="ig-faq-title"
          className="text-xl font-semibold text-slate-900 dark:text-slate-100"
        >
          {t("faq.title")}
        </h2>
        <dl className="space-y-4">
          {FAQ_KEYS.map((k) => (
            <div key={k}>
              <dt className="font-medium text-slate-900 dark:text-slate-100">
                {t(`faq.items.${k}.q`)}
              </dt>
              <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t(`faq.items.${k}.a`)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Related calculators */}
      <section
        aria-labelledby="ig-related-title"
        className="card p-6 sm:p-8 space-y-4"
      >
        <h2
          id="ig-related-title"
          className="text-xl font-semibold text-slate-900 dark:text-slate-100"
        >
          {t("related.title")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("related.subtitle")}
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <RelatedLink
            href="/youtube-money-calculator"
            title={t("related.links.money.title")}
            description={t("related.links.money.description")}
          />
          <RelatedLink
            href="/youtube-rpm-calculator"
            title={t("related.links.rpm.title")}
            description={t("related.links.rpm.description")}
          />
          <RelatedLink
            href="/youtube-cpm-calculator"
            title={t("related.links.cpm.title")}
            description={t("related.links.cpm.description")}
          />
          <RelatedLink
            href="/youtube-shorts-calculator"
            title={t("related.links.shorts.title")}
            description={t("related.links.shorts.description")}
          />
          <RelatedLink
            href="/youtube-sponsorship-calculator"
            title={t("related.links.sponsorship.title")}
            description={t("related.links.sponsorship.description")}
          />
          <RelatedLink
            href="/methodology"
            title={t("related.links.methodology.title")}
            description={t("related.links.methodology.description")}
          />
        </ul>
      </section>

      {/* Methodology teaser + disclaimer */}
      <section
        aria-labelledby="ig-methodology-title"
        className="card p-6 sm:p-8 space-y-3"
      >
        <h2
          id="ig-methodology-title"
          className="text-xl font-semibold text-slate-900 dark:text-slate-100"
        >
          {t("methodology.title")}
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          {t("methodology.body")}
        </p>
        <p className="text-sm">
          <Link
            href="/methodology"
            className="text-brand-700 underline underline-offset-2 hover:no-underline dark:text-brand-300"
          >
            {t("methodology.linkText")}
          </Link>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("methodology.disclaimer")}
        </p>
      </section>

      <Script
        id="ig-money-calc-ld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

function RelatedLink({
  href,
  title,
  description,
}: {
  href:
    | "/youtube-money-calculator"
    | "/youtube-rpm-calculator"
    | "/youtube-cpm-calculator"
    | "/youtube-shorts-calculator"
    | "/youtube-sponsorship-calculator"
    | "/methodology";
  title: string;
  description: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-pop dark:border-slate-800 dark:bg-slate-900"
      >
        <p className="font-medium text-slate-900 dark:text-slate-100">{title}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </Link>
    </li>
  );
}
