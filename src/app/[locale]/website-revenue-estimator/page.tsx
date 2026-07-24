import type { Metadata } from "next";
import Script from "next/script";
import { setRequestLocale } from "next-intl/server";

import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { WebsiteRevenueClient } from "./WebsiteRevenueClient";

const PATH_SUFFIX = "/website-revenue-estimator";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "Website Revenue Estimator — Estimate Any Website's Earnings";
  const description =
    "Estimate how much any website earns per month. See estimated monthly revenue, RPM, yearly earnings, website valuation, and monetization breakdown. Free, instant, no login.";
  return {
    title,
    description,
    keywords: [
      "website revenue estimator",
      "website earnings calculator",
      "how much does a website make",
      "website income calculator",
      "website value estimator",
      "website RPM calculator",
      "website monetization calculator",
    ],
    alternates: buildAlternates({ locale, pathSuffix: PATH_SUFFIX }),
    openGraph: {
      type: "website",
      title,
      description,
      url: `/${locale}${PATH_SUFFIX}`,
      siteName: publicConfig.siteName,
      locale,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

const FAQ = [
  { q: "How does the Website Revenue Estimator work?", a: "The tool estimates revenue based on the website's detected niche, estimated traffic volume, and industry-average RPM (revenue per 1,000 pageviews). You can customize all inputs for more accurate estimates." },
  { q: "Are these actual revenue figures?", a: "No. All figures are estimates based on industry averages and publicly observable signals. Actual revenue depends on many private factors including specific ad networks, fill rates, traffic quality, and monetization strategy." },
  { q: "What is website RPM?", a: "RPM (Revenue Per Mille) is the estimated revenue earned per 1,000 pageviews. It varies significantly by niche — finance sites typically earn $15-45 RPM while gaming sites might earn $3-12 RPM." },
  { q: "How is website valuation calculated?", a: "Website value is estimated as a multiple of monthly revenue (typically 24-60x depending on niche). This reflects what buyers might pay on website marketplaces like Flippa or Empire Flippers." },
  { q: "Can I adjust the estimates?", a: "Yes. Use the RPM slider to see how different rates affect revenue. You can also manually enter your own traffic numbers for more precise estimates." },
  { q: "What factors affect website revenue?", a: "Key factors include: traffic volume, audience geography (US/UK traffic pays more), niche (finance pays highest), ad placement optimization, content quality, and monetization diversity." },
];

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const pageUrl = `${publicConfig.siteUrl}/${locale}${PATH_SUFFIX}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${publicConfig.siteUrl}/${locale}` },
        { "@type": "ListItem", position: 2, name: "Website Revenue Estimator", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Website Revenue Estimator",
      description: "Estimate any website's monthly revenue, RPM, yearly earnings, and valuation based on traffic and niche.",
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
    <>
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500 dark:text-slate-400">
          <ol className="flex items-center gap-1">
            <li><a href={`/${locale}`} className="hover:text-slate-900 dark:hover:text-slate-100">Home</a></li>
            <li className="flex items-center gap-1"><span aria-hidden>&rsaquo;</span><span>Website Revenue Estimator</span></li>
          </ol>
        </nav>

        <WebsiteRevenueClient />

        {/* FAQ — server-rendered for SEO */}
        <section aria-labelledby="wre-faq" className="card p-6 sm:p-8 space-y-4">
          <h2 id="wre-faq" className="text-xl font-semibold text-slate-900 dark:text-slate-100">Frequently Asked Questions</h2>
          <dl className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="font-medium text-slate-900 dark:text-slate-100">{item.q}</dt>
                <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Related Tools */}
        <section className="card p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Related Tools</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <li><a href={`/${locale}`} className="text-brand-600 hover:underline dark:text-brand-400">YouTube Money Calculator</a> — Estimate channel earnings</li>
            <li><a href={`/${locale}/youtube-rpm-calculator`} className="text-brand-600 hover:underline dark:text-brand-400">RPM Calculator</a> — Revenue per 1,000 views</li>
            <li><a href={`/${locale}/youtube-cpm-calculator`} className="text-brand-600 hover:underline dark:text-brand-400">CPM Calculator</a> — Advertiser cost per impressions</li>
            <li><a href={`/${locale}/youtube-adsense-calculator`} className="text-brand-600 hover:underline dark:text-brand-400">AdSense Calculator</a> — Estimate ad revenue</li>
            <li><a href={`/${locale}/instagram-money-calculator`} className="text-brand-600 hover:underline dark:text-brand-400">Instagram Calculator</a> — Creator earnings</li>
            <li><a href={`/${locale}/twitch-bits-calculator`} className="text-brand-600 hover:underline dark:text-brand-400">Twitch Bits Calculator</a> — Bits to USD</li>
          </ul>
        </section>
      </div>
      <Script
        id="wre-ld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
