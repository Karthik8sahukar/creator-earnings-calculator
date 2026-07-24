import { getTranslations } from "next-intl/server";

import { CreatorAvatar } from "@/components/creator/CreatorAvatar";
import { Money } from "@/components/currency";
import { Link } from "@/i18n/navigation";
import { DollarIcon } from "../icons";
import { getCreatorAvatars } from "@/lib/creatorAvatars";
import { getCreatorBySlug } from "@/lib/creators";
import { findCountry, findNiche } from "@/lib/rpmData";

/**
 * Top earning creators section.
 * Curated list of creators with the highest estimated RPM × tier combination.
 */
const TOP_EARNING_SLUGS = [
  "grahamstephan",
  "mkbhd",
  "aliabdaal",
  "linustechtips",
  "veritasium",
  "markrober",
] as const;

export async function TopEarningCreators() {
  const t = await getTranslations("home.topEarning");

  const creators = TOP_EARNING_SLUGS.map((slug) => getCreatorBySlug(slug)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  );

  const avatars = await getCreatorAvatars(creators);

  return (
    <section aria-labelledby="top-earning-title">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="label inline-flex items-center gap-1.5">
            <DollarIcon width={14} height={14} />
            {t("eyebrow")}
          </p>
          <h2
            id="top-earning-title"
            className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href="/creators"
          className="btn-secondary text-sm"
        >
          {t("viewAll")}
        </Link>
      </div>

      <div className="card overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {creators.map((c, i) => {
          const country = findCountry(c.countryCode ?? "OTHER");
          const niche = findNiche(c.nicheId ?? "other");
          const rpm = country.baseRpm * niche.rpmMultiplier;

          return (
            <Link
              key={c.slug}
              href={`/creator/${c.slug}` as `/creator/${string}`}
              className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500 w-6 text-center">
                {i + 1}
              </span>
              <CreatorAvatar
                src={avatars[c.slug] ?? null}
                alt={c.displayName}
                initial={c.displayName.charAt(0)}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {c.displayName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {c.category} · {c.country}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  <Money amount={rpm} /> RPM
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {niche.label}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
