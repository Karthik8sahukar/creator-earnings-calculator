import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CreatorsIndexClient } from "@/components/creator/CreatorsIndexClient";
import { routing } from "@/i18n/routing";
import { publicConfig } from "@/lib/config";
import { getCreatorAvatars } from "@/lib/creatorAvatars";
import {
  listCreatorCategories,
  listCreatorCountries,
  listCreators,
} from "@/lib/creators";
import { buildAlternates } from "@/lib/i18nMetadata";
import {
  buildBreadcrumbListLd,
  buildItemListLd,
  serializeJsonLd,
} from "@/lib/jsonLd";

// The directory page fetches every creator's avatar from the
// YouTube Data API on render. Even though `getCreatorAvatars()`
// reuses the process-local TtlCache, the very first render after a
// cold cache still needs the API key to be present — so we opt out
// of build-time prerendering and force the Node runtime. In steady
// state this is cheap: each avatar lookup is served from the
// TtlCache (45m for search entries, 6h for channel entries), and
// the entire batch completes in a few milliseconds once warm.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `/[locale]/creators` — the search + filter index of every creator
 * in the catalog. Statically generated per locale because the catalog
 * itself is data-driven from `src/lib/creators.ts`.
 */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "creators.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates({ locale, pathSuffix: "/creators" }),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${publicConfig.siteUrl}/${locale}/creators`,
      siteName: publicConfig.siteName,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function CreatorsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "creators" });
  const tCommon = await getTranslations({
    locale,
    namespace: "common.breadcrumbs",
  });

  const creators = listCreators();
  const countries = listCreatorCountries();
  const categories = listCreatorCategories();

  // Fetch every avatar in parallel, reusing the existing TtlCache
  // via the youtube service. Failures fall through to `null`, which
  // the card renders as an initial-based placeholder — the page
  // never blocks on a single flaky lookup.
  const avatars = await getCreatorAvatars(creators);

  // JSON-LD: BreadcrumbList + ItemList of creator profiles.
  const breadcrumbLd = buildBreadcrumbListLd([
    { name: tCommon("home"), url: `${publicConfig.siteUrl}/${locale}` },
    {
      name: t("meta.breadcrumb"),
      url: `${publicConfig.siteUrl}/${locale}/creators`,
    },
  ]);
  const itemListLd = buildItemListLd(
    creators.map((c) => ({
      name: c.displayName,
      url: `${publicConfig.siteUrl}/${locale}/creator/${c.slug}`,
      description: c.description,
    })),
  );

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        data-testid="creators-index-jsonld"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([breadcrumbLd, itemListLd]),
        }}
      />

      <header className="space-y-2">
        <p className="label">{t("eyebrow")}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {t("title")}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
          {t("subtitle")}
        </p>
      </header>

      <CreatorsIndexClient
        creators={creators}
        countries={countries}
        categories={categories}
        avatars={avatars}
      />
    </div>
  );
}
