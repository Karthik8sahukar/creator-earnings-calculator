import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ChannelWorkspace } from "@/components/ChannelWorkspace";
import { Faq } from "@/components/home/Faq";
import { FeaturedCreators } from "@/components/home/FeaturedCreators";
import { Hero } from "@/components/home/Hero";
import { LatestBlogs } from "@/components/home/LatestBlogs";
import { PlatformStats } from "@/components/home/PlatformStats";
import { PopularCalculators } from "@/components/home/PopularCalculators";
import { PopularCreators } from "@/components/home/PopularCreators";
import { TopByCategory } from "@/components/home/TopByCategory";
import { TopByCountry } from "@/components/home/TopByCountry";
import { TopEarningCreators } from "@/components/home/TopEarningCreators";
import { TrendingCreators } from "@/components/home/TrendingCreators";
import { WhyBeHumler } from "@/components/home/WhyBeHumler";
import { buildAlternates } from "@/lib/i18nMetadata";

/**
 * Homepage — the Creator Intelligence Platform landing page.
 *
 * Sections (in order):
 *   1. Hero (search + YouTube Money Calculator CTA)
 *   2. Trending Creators
 *   3. Featured Creators
 *   4. Top Earning Creators
 *   5. Top Creators by Country
 *   6. Top Creators by Category
 *   7. Popular Calculators
 *   8. Latest Blog Posts
 *   9. Platform Statistics
 *  10. Why BeHumler
 *  11. FAQ
 *
 * Every section is a server component for maximum performance.
 * Creator avatars are lazy-loaded from the YouTube cache.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "homeMeta" });

  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: buildAlternates({ locale, pathSuffix: "/" }),
    openGraph: {
      title: t("title"),
      description: t("description"),
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-20 sm:space-y-28">
      <Hero>
        <Suspense fallback={<WorkspaceFallback />}>
          <ChannelWorkspace />
        </Suspense>
      </Hero>

      <TrendingCreators />
      <FeaturedCreators />
      <TopEarningCreators />
      <TopByCountry />
      <TopByCategory />
      <PopularCalculators />
      <PopularCreators />
      <LatestBlogs />
      <PlatformStats />
      <WhyBeHumler />
      <Faq />
    </div>
  );
}

async function WorkspaceFallback() {
  const t = await getTranslations("common.labels");
  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="skeleton h-14 w-full rounded-2xl" aria-hidden />
      <span className="sr-only">{t("loadingCalculator")}</span>
    </div>
  );
}
