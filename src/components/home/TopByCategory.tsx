import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { ChartIcon } from "../icons";
import { getCategoryStats } from "@/lib/creatorDirectory";
import { findNiche } from "@/lib/rpmData";

/**
 * Top creators by category section on the homepage.
 * Shows category cards with creator counts and RPM multipliers.
 */
export async function TopByCategory() {
  const t = await getTranslations("home.byCategory");
  const categoryStats = getCategoryStats();

  return (
    <section aria-labelledby="top-by-category-title">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="label inline-flex items-center gap-1.5">
            <ChartIcon width={14} height={14} />
            {t("eyebrow")}
          </p>
          <h2
            id="top-by-category-title"
            className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            {t("title")}
          </h2>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categoryStats.slice(0, 8).map((stat) => {
          const nicheData = findNiche(stat.niche);
          const slug = stat.category.toLowerCase().replace(/\s+&\s+/g, "-").replace(/\s+/g, "-");

          return (
            <Link
              key={stat.category}
              href={`/category/${slug}` as `/category/${string}`}
              className="group card p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {stat.category}
                </h3>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400">
                  {stat.count} {t("creators")}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("rpmMultiplier")}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {nicheData.rpmMultiplier}×
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("avgRpm")}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    ${(6.5 * nicheData.rpmMultiplier).toFixed(2)}
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
