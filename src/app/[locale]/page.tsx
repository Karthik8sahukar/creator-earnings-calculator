import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ChannelWorkspace } from "@/components/ChannelWorkspace";
import { AppShell } from "@/components/AppShell";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CollectionSection } from "@/components/home/CollectionSection";
import { Faq } from "@/components/home/Faq";
import { FeaturedGrid } from "@/components/home/FeaturedGrid";
import { HomePageClient } from "@/components/home/HomePageClient";
import { LatestBlogs } from "@/components/home/LatestBlogs";
import { TrustStats } from "@/components/home/TrustStats";
import { WhyBeHumler } from "@/components/home/WhyBeHumler";
import { buildAlternates } from "@/lib/i18nMetadata";

/**
 * Homepage — "App Store for Free Online Tools"
 *
 * New section order:
 *   1. Hero (BeHumler branding + Tools/Creators tab + search trigger)
 *   2. Quick Discovery (tabbed horizontal scroll: Popular/Featured/Recent/Recommended)
 *   3. Category Grid (8 categories with dynamic counts)
 *   4. Featured Grid (mixed-category featured tools)
 *   5. Collections (horizontal scroll: For Developers, For Creators, etc.)
 *   6. Trust Stats (reused)
 *   7. Why BeHumler (reused)
 *   8. Latest Blogs (reused)
 *   9. FAQ (reused)
 *
 * SEO: All metadata, canonical, hreflang, schema preserved exactly.
 * The H1 remains as a sr-only element matching the existing home.title key.
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
    <AppShell variant="landing">
      {/*
        HomePageClient is the client boundary — owns the search modal
        state and renders: Hero + QuickDiscovery (both need client JS).
        Server sections are passed as children to stay server-rendered.
      */}
      <HomePageClient
        creatorSearch={
          <Suspense fallback={<WorkspaceFallback />}>
            <ChannelWorkspace />
          </Suspense>
        }
      >
        {/* Everything below here is server-rendered */}
        <CategoryGrid />
        <FeaturedGrid />
        <CollectionSection />
        <TrustStats />
        <WhyBeHumler />
        <LatestBlogs />
        <Faq />
      </HomePageClient>
    </AppShell>
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
