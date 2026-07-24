import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { GlobeIcon } from "../icons";
import { getCountryStats } from "@/lib/creatorDirectory";
import { COUNTRY_CODE_TO_SLUG } from "@/lib/countryData";
import { findCountry } from "@/lib/rpmData";

/**
 * Top creators by country section on the homepage.
 * Shows country cards with creator counts and average RPM.
 */
export async function TopByCountry() {
  const t = await getTranslations("home.byCountry");
  const countryStats = getCountryStats();

  return (
    <section aria-labelledby="top-by-country-title">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="label inline-flex items-center gap-1.5">
            <GlobeIcon width={14} height={14} />
            {t("eyebrow")}
          </p>
          <h2
            id="top-by-country-title"
            className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            {t("title")}
          </h2>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {countryStats.slice(0, 8).map((stat) => {
          const countryTier = findCountry(stat.countryCode);
          const slug = COUNTRY_CODE_TO_SLUG[stat.countryCode];

          return (
            <Link
              key={stat.countryCode}
              href={`/country/${slug}` as `/country/${string}`}
              className="group card p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {stat.country}
                </h3>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400">
                  {stat.count} {t("creators")}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("rpm")}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    ${countryTier.baseRpm.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("shortsRpm")}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    ${countryTier.shortsRpm.toFixed(3)}
                  </p>
                </div>
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-300">
                {t("explore")}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
