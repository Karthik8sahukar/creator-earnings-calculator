import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
 * Homepage — "The App Store for Free Online Tools"
 *
 * A pure discovery page. No tool-specific functionality lives here.
 * Individual tools (including YouTube Money Calculator) have their
 * own dedicated pages.
 *
 * Section order:
 *   1. Hero (branding + tool search trigger)
 *   2. Quick Discovery (tabbed: Popular/Featured/Recent/Recommended)
 *   3. Category Grid (8 categories with dynamic counts)
 *   4. Featured Grid (mixed-category featured tools)
 *   5. Collections (horizontal scroll)
 *   6. Trust Stats
 *   7. Why BeHumler
 *   8. Latest Blogs
 *   9. FAQ
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
      <HomePageClient>
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
