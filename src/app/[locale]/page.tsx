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
 * Homepage — Premium landing page for BeHumler.
 *
 * Redesigned section order:
 *   1. Hero (platform headline + search)
 *   2. Trust Stats (metric cards)
 *   3. Tool Categories (3 category cards)
 *   4. Quick Actions (popular tools)
 *   5. Featured Tools (Creator Analytics)
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
    <div className="space-y-20 sm:space-y-28">
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
