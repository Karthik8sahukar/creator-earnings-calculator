import { getTranslations } from "next-intl/server";

import { SparklesIcon } from "../icons";
import { CREATORS_DATASET } from "@/data/creators/dataset";
import { COUNTRIES, NICHES } from "@/lib/rpmData";

/**
 * Platform statistics section on the homepage.
 *
 * Every metric is computed at render time from the canonical data
 * structures — NOTHING is hardcoded. When creators are added to
 * `src/data/creators/dataset.ts` or RPM tiers are added to
 * `src/lib/rpmData.ts`, these numbers update automatically.
 *
 * Data contracts:
 *
 *   "Creator profiles"      = CREATORS_DATASET.length
 *   "API-verified channels" = creators where verified === true
 *                             (means youtubeChannelId is confirmed
 *                             via the YouTube Data API)
 *   "Creator countries"     = unique countryCode values present in
 *                             the creator dataset (NOT the same as
 *                             RPM country tiers)
 *   "Content categories"    = unique category labels in the dataset
 *   "Niches with RPM data"  = NICHES array length (the RPM engine's
 *                             niche multiplier table)
 *   "Countries with RPM data" = COUNTRIES array length (the RPM
 *                             engine's country tier table)
 */
export async function PlatformStats() {
  const t = await getTranslations("home.stats");

  const totalCreators = CREATORS_DATASET.length;
  const verifiedCreators = CREATORS_DATASET.filter((c) => c.verified).length;
  const countries = new Set(CREATORS_DATASET.map((c) => c.countryCode)).size;
  const categories = new Set(CREATORS_DATASET.map((c) => c.category)).size;
  const totalNiches = NICHES.length;
  const totalCountryTiers = COUNTRIES.length;

  const stats = [
    { label: t("totalCreators"), value: totalCreators.toString() },
    { label: t("verifiedCreators"), value: verifiedCreators.toString() },
    { label: t("countriesCovered"), value: countries.toString() },
    { label: t("categories"), value: categories.toString() },
    { label: t("nichesTracked"), value: totalNiches.toString() },
    { label: t("rpmCountries"), value: totalCountryTiers.toString() },
  ];

  return (
    <section aria-labelledby="platform-stats-title">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <p className="label inline-flex items-center gap-1.5 justify-center">
          <SparklesIcon width={14} height={14} />
          {t("eyebrow")}
        </p>
        <h2
          id="platform-stats-title"
          className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          {t("title")}
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="card p-6 text-center"
          >
            <p className="text-4xl font-bold text-brand-700 dark:text-brand-300">
              {stat.value}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
