import { getT } from "@/lib/t";
import type { Metadata } from "next";

import { CreatorsDirectoryClient } from "@/components/creator/CreatorsDirectoryClient";
import { publicConfig } from "@/lib/config";
import { getCreatorAvatars } from "@/lib/creatorAvatars";
import {
  listCreatorCategories,
  listCreatorCountries,
  listCreators,
} from "@/lib/creators";
import {
  filterCreators,
  sortCreators,
  paginateCreators,
  type CreatorFilters,
  type CreatorSortField,
} from "@/lib/creatorDirectory";
import { buildAlternates } from "@/lib/i18nMetadata";
import {
  buildBreadcrumbListLd,
  buildItemListLd,
  serializeJsonLd,
} from "@/lib/jsonLd";
import type { CreatorCountryCode } from "@/data/creators/schema";

/**
 * `/[locale]/creators` — Enhanced creator directory with:
 *   - URL-based search, filters, sort, and pagination
 *   - Server-side filtering for SEO
 *   - 24 creators per page
 *   - Shareable URLs like /creators?country=IN&category=Gaming&sort=name&page=2
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function generateMetadata({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const searchParams = await searchParamsPromise;
  const t = getT("creators.meta");

  // Build descriptive title from active filters
  const country = typeof searchParams.country === "string" ? searchParams.country : "";
  const category = typeof searchParams.category === "string" ? searchParams.category : "";

  let title = t("title");
  if (country && category) {
    title = `${category} YouTube Creators in ${country} — Earnings & Stats`;
  } else if (country) {
    title = `YouTube Creators in ${country} — Earnings & Revenue`;
  } else if (category) {
    title = `${category} YouTube Creators — Earnings & Revenue`;
  }

  return {
    title,
    description: t("description"),
    alternates: buildAlternates({ pathSuffix: "/creators" }),
    openGraph: {
      title,
      description: t("description"),
      url: `${publicConfig.siteUrl}/creators`,
      siteName: publicConfig.siteName,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: t("description"),
    },
  };
}

// Map country names to codes for filtering
const COUNTRY_NAME_TO_CODE: Record<string, CreatorCountryCode> = {
  "United States": "US",
  "United Kingdom": "GB",
  "Canada": "CA",
  "Australia": "AU",
  "Germany": "DE",
  "France": "FR",
  "Netherlands": "NL",
  "Sweden": "SE",
  "Japan": "JP",
  "South Korea": "KR",
  "India": "IN",
  "Brazil": "BR",
  "Mexico": "MX",
  "Spain": "ES",
  "Italy": "IT",
  "Indonesia": "ID",
  "Philippines": "PH",
  "South Africa": "ZA",
  "United Arab Emirates": "AE",
};

export default async function CreatorsIndexPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await searchParamsPromise;

  const t = getT("creators");
  const tCommon = getT("common.breadcrumbs");

  // ── Parse URL params ──────────────────────────────────────────
  const search = typeof searchParams.q === "string" ? searchParams.q : "";
  const countryParam = typeof searchParams.country === "string" ? searchParams.country : "all";
  const categoryParam = typeof searchParams.category === "string" ? searchParams.category : "all";
  const verifiedParam = typeof searchParams.verified === "string" ? searchParams.verified : "all";
  const sortParam = typeof searchParams.sort === "string" ? searchParams.sort : "subscribers";
  const pageParam = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
  const perPage = 24;

  // ── Build filter object ───────────────────────────────────────
  const filters: CreatorFilters = {};
  if (search) filters.search = search;
  if (countryParam !== "all") {
    // Could be a country name or code
    const code = COUNTRY_NAME_TO_CODE[countryParam];
    if (code) filters.country = code;
    else filters.search = (filters.search ?? "") + " " + countryParam;
  }
  if (categoryParam !== "all") filters.category = categoryParam;
  if (verifiedParam === "true") filters.verified = true;

  // ── Execute query ─────────────────────────────────────────────
  const filtered = filterCreators(filters);
  const sortField = (["name", "country", "category", "subscriberTier", "newest"].includes(sortParam)
    ? sortParam === "subscribers" ? "subscriberTier" : sortParam
    : "subscriberTier") as CreatorSortField;
  const sorted = sortCreators(filtered, sortField, "asc");
  const paginated = paginateCreators(sorted, { page: pageParam, perPage });

  // ── Convert to Creator interface for cards ────────────────────
  const allCreators = listCreators();
  const countries = listCreatorCountries();
  const categories = listCreatorCategories();

  // Map CreatorEntry[] to Creator[] by slug lookup
  const creatorsForCards = paginated.creators
    .map((entry) => allCreators.find((c) => c.slug === entry.slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  // Fetch avatars for the current page only
  const avatars = await getCreatorAvatars(creatorsForCards);

  // ── JSON-LD ───────────────────────────────────────────────────
  const breadcrumbLd = buildBreadcrumbListLd([
    { name: tCommon("home"), url: `${publicConfig.siteUrl}` },
    {
      name: t("meta.breadcrumb"),
      url: `${publicConfig.siteUrl}/creators`,
    },
  ]);
  const itemListLd = buildItemListLd(
    creatorsForCards.map((c) => ({
      name: c.displayName,
      url: `${publicConfig.siteUrl}/creator/${c.slug}`,
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
        <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
          {paginated.total} {t("creatorsCount") ?? "creators"}
        </p>
      </header>

      <CreatorsDirectoryClient
        creators={creatorsForCards}
        countries={countries as string[]}
        categories={categories as string[]}
        avatars={avatars}
        currentFilters={{
          search,
          country: countryParam,
          category: categoryParam,
          verified: verifiedParam,
          sort: sortParam,
          page: paginated.page,
          perPage,
        }}
        totalResults={paginated.total}
        totalPages={paginated.totalPages}
      />
    </div>
  );
}
