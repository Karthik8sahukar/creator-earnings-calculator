import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ChannelWorkspace } from "@/components/ChannelWorkspace";
import { CreatorPlatforms } from "@/components/home/CreatorPlatforms";
import { Faq } from "@/components/home/Faq";
import { Hero } from "@/components/home/Hero";
import { PopularCalculators } from "@/components/home/PopularCalculators";
import { WhyBeHumler } from "@/components/home/WhyBeHumler";
import { buildAlternates } from "@/lib/i18nMetadata";

/**
 * Homepage — locale-aware composition of the redesigned home sections.
 *
 * H1 stays "YouTube Money Calculator" for SEO (English key in every
 * locale's `home.title` — the same string, deliberately, so the SEO
 * meaning is preserved). Non-English locales still render the H1 in
 * English because the string IS "YouTube Money Calculator" — a proper
 * product name that is not localized.
 *
 * The homepage is a thin composition: Hero > PopularCalculators >
 * WhyBeHumler > Faq. Every visible string inside those sections comes
 * from `messages/{locale}.json`.
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

      <PopularCalculators />
      <CreatorPlatforms />
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
