import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CollectionSection } from "@/components/home/CollectionSection";
import { Faq } from "@/components/home/Faq";
import { FeaturedGrid } from "@/components/home/FeaturedGrid";
import { HomePageClient } from "@/components/home/HomePageClient";
import { LatestBlogs } from "@/components/home/LatestBlogs";
import { TrustStats } from "@/components/home/TrustStats";
import { WhyBeHumler } from "@/components/home/WhyBeHumler";
import { t } from "@/lib/t";
import { publicConfig } from "@/lib/config";

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
export function generateMetadata(): Metadata {
  const title = t("homeMeta.title");
  const description = t("homeMeta.description");

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${publicConfig.siteUrl}/`,
    },
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default function HomePage() {
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
