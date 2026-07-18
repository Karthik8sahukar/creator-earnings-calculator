import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { StaticPage } from "@/components/StaticPage";
import { TranslationPending } from "@/components/TranslationPending";
import { routing } from "@/i18n/routing";
import { legalLastUpdatedIso } from "@/lib/config";
import { buildAlternates } from "@/lib/i18nMetadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "static.methodology" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates({ locale, pathSuffix: "/methodology" }),
  };
}

export default async function MethodologyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale !== routing.defaultLocale) {
    return <TranslationPending pathSuffix="/methodology" />;
  }

  const t = await getTranslations({ locale, namespace: "static.methodology" });

  return (
    <StaticPage title={t("heading")} description={t("subheading")}>
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <strong className="font-medium text-slate-900">
          Benchmark review date:
        </strong>{" "}
        <time dateTime={legalLastUpdatedIso}>{legalLastUpdatedIso}</time>.
        Country RPM ranges, niche multipliers, and currency rates were last
        reviewed on this date. Numbers are approximations from public
        creator-economy reports — they are not official YouTube data.
      </div>

      <h2 className="text-xl font-semibold text-slate-900">
        What we retrieve from YouTube
      </h2>
      <p>
        We use only the official{" "}
        <a
          href="https://developers.google.com/youtube/v3"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          YouTube Data API v3
        </a>
        . For every channel we fetch:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Title, handle, description, join date, country, thumbnail</li>
        <li>Subscriber count (or a &ldquo;hidden&rdquo; flag), total views, video count</li>
        <li>Uploads playlist id (used to fetch recent uploads)</li>
        <li>For each recent upload: title, published date, duration, views, likes, comments</li>
      </ul>
      <p>No scraping is performed. No private analytics data is retrieved.</p>

      <h2 className="text-xl font-semibold text-slate-900">
        What we cannot see
      </h2>
      <p>
        YouTube channels have a lot of private data that only the channel
        owner can see. We do NOT have access to any of it:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Actual RPM / CPM</li>
        <li>Audience geography breakdown (only the channel&apos;s primary country)</li>
        <li>Watch time and average view duration</li>
        <li>Ad fill rate and ad category mix</li>
        <li>Revenue from YouTube Premium subscribers</li>
        <li>Sponsorship, affiliate, and merchandising income</li>
      </ul>
      <p>
        <strong>This is why exact earnings cannot be known.</strong> Any
        website claiming to show a real creator&apos;s actual earnings is
        guessing, including this one.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">RPM vs. CPM</h2>
      <p>
        <strong>CPM</strong> (Cost Per Mille) is what advertisers pay per 1,000
        monetized ad impressions, before YouTube takes its cut. It&apos;s an
        advertiser-side metric that creators do not directly see.
      </p>
      <p>
        <strong>RPM</strong> (Revenue Per Mille) is what remains for the
        creator per 1,000 total views (not just monetized ones), after
        YouTube&apos;s share. RPM is always lower than CPM. When someone talks
        about &ldquo;how much a creator earns per 1,000 views&rdquo; they
        almost always mean RPM.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Monetized-view percentage
      </h2>
      <p>
        Not every view generates ad revenue — viewers may skip ads, use
        ad-blockers, or watch on YouTube Premium. Our niche and country
        RPM tables are calibrated for a channel that monetizes at the
        industry-typical rate of <strong>90%</strong> of views.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Country and niche assumptions
      </h2>
      <p>
        Different countries and niches pay very different rates because
        advertisers value different audiences differently. We use per-country
        RPM tiers and per-niche multipliers derived from public
        creator-economy reports.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Shorts vs. long-form
      </h2>
      <p>
        Shorts monetize very differently from long-form videos. In practice
        Shorts RPM is roughly an order of magnitude lower than long-form RPM
        for a comparable channel. For Shorts we use a{" "}
        <strong>separate RPM table</strong> — not a multiplier on top of
        long-form.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Known limitations
      </h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Ad fill rate, seasonality, and category mix are unknown.</li>
        <li>YouTube&apos;s share of ad revenue is baked into RPM.</li>
        <li>Refunds, invalid traffic, and taxes are not modelled.</li>
        <li>Currency conversion uses a static approximate rate.</li>
        <li>Sponsorship rate estimates are always negotiable.</li>
        <li>
          We cannot see private analytics such as playback locations, watch
          time, or actual RPM.
        </li>
      </ul>
      <p>
        In short: the numbers on this site are informed estimates. Treat them
        as a starting point, not as truth.
      </p>
    </StaticPage>
  );
}
