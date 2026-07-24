import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ChannelWorkspace } from "@/components/ChannelWorkspace";
import { DecisionTools } from "@/components/home/DecisionTools";
import { Faq } from "@/components/home/Faq";
import { FeaturedCreators } from "@/components/home/FeaturedCreators";
import { FeaturedTools } from "@/components/home/FeaturedTools";
import { Hero } from "@/components/home/Hero";
import { LatestBlogs } from "@/components/home/LatestBlogs";
import { PopularCreators } from "@/components/home/PopularCreators";
import { TopByCategory } from "@/components/home/TopByCategory";
import { TopByCountry } from "@/components/home/TopByCountry";
import { TopEarningCreators } from "@/components/home/TopEarningCreators";
import { TrendingCreators } from "@/components/home/TrendingCreators";
import { WhyBeHumler } from "@/components/home/WhyBeHumler";
import { buildAlternates } from "@/lib/i18nMetadata";

/**
 * Homepage — the Creator Analytics Platform landing page.
 *
 * Sections (in order):
 *   1. Hero (platform identity + search)
 *   2. Featured Tools (categorized tool grid)
 *   3. Trending Creators
 *   4. Featured Creators
 *   5. Top Earning Creators
 *   6. Top Creators by Country
 *   7. Top Creators by Category
 *   8. Popular Creators
 *   9. Latest Blog Posts
 *  10. Platform Statistics
 *  11. Why BeHumler
 *  12. FAQ
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

      <FeaturedTools />
      <DecisionTools />
      <TrendingCreators />
      <FeaturedCreators />
      <TopEarningCreators />
      <TopByCountry />
      <TopByCategory />
      <PopularCreators />
      <LatestBlogs />
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
