import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { ChannelWorkspace } from "@/components/ChannelWorkspace";
import { buildAlternates } from "@/lib/i18nMetadata";

/**
 * Homepage — locale-aware.
 *
 * H1 stays "YouTube Money Calculator" for SEO (English) — however other
 * locales get a translated H1 taken from `home.title`, which is
 * deliberately the same string for `en` and localized for other
 * locales when a natural translation exists. This preserves the SEO
 * meaning of the English H1 while making the localized page feel native.
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
  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations();
  return (
    <div className="space-y-10">
      <section
        aria-labelledby="hero-title"
        className="text-center space-y-4 pt-6 sm:pt-10"
      >
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          {t("home.chip")}
        </p>
        <h1
          id="hero-title"
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900"
        >
          {t("home.title")}
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-600">
          {t("home.subtitle")}
        </p>
        <ul className="flex flex-wrap justify-center gap-2 text-xs text-slate-600 pt-1">
          <li className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1">
            ✓ {t("home.trustBadges.poweredBy")}
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1">
            ✓ {t("home.trustBadges.free")}
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1">
            ✓ {t("home.trustBadges.noLogin")}
          </li>
        </ul>
      </section>

      <Suspense fallback={<WorkspaceFallback />}>
        <ChannelWorkspace />
      </Suspense>
    </div>
  );
}

function WorkspaceFallback() {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="skeleton h-14 w-full rounded-2xl" aria-hidden />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
