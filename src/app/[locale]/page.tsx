import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ChannelWorkspace } from "@/components/ChannelWorkspace";
import { DecisionTools } from "@/components/home/DecisionTools";
import { DeveloperTools } from "@/components/home/DeveloperTools";
import { Faq } from "@/components/home/Faq";
import { FeaturedTools } from "@/components/home/FeaturedTools";
import { HeroRedesign } from "@/components/home/HeroRedesign";
import { LatestBlogs } from "@/components/home/LatestBlogs";
import { QuickActions } from "@/components/home/QuickActions";
import { ToolCategories } from "@/components/home/ToolCategories";
import { TrendingCreators } from "@/components/home/TrendingCreators";
import { TrustStats } from "@/components/home/TrustStats";
import { WhyBeHumler } from "@/components/home/WhyBeHumler";
import { buildAlternates } from "@/lib/i18nMetadata";

/**
 * Homepage — Premium dark landing page for BeHumler.
 *
 * Matches approved mockup layout:
 *   1. Hero (dark, two-col: headline+search left, dashboard preview right, trust bar)
 *   2. TrustStats (no-op — trust bar moved into hero)
 *   3. Tool Categories (3 product cards: Creator/Developer/Utilities)
 *   4. Featured Experience (YouTube Money Calculator card)
 *   5. Featured Tools (Creator Analytics grid)
 *   6. Trending Creators
 *   7. Developer Tools
 *   8. Decision Tools
 *   9. Why BeHumler
 *  10. Blog
 *  11. FAQ
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
    <div className="space-y-24 sm:space-y-32">
      <HeroRedesign>
        <Suspense fallback={<WorkspaceFallback />}>
          <ChannelWorkspace />
        </Suspense>
      </HeroRedesign>

      <TrustStats />
      <ToolCategories />
      <QuickActions />
      <FeaturedTools />
      <TrendingCreators />
      <DeveloperTools />
      <DecisionTools />
      <WhyBeHumler />
      <LatestBlogs />
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
