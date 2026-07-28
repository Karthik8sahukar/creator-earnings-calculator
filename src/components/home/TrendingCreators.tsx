import { getT } from "@/lib/t";

import { CreatorAvatar } from "@/components/creator/CreatorAvatar";
import Link from "next/link";
import { getCreatorAvatars } from "@/lib/creatorAvatars";
import { getCreatorBySlug } from "@/lib/creators";
import { TrendingUpIcon } from "../icons";

/**
 * "Trending" creators that appear near the top of the homepage.
 * These are manually curated fast-growing or viral creators.
 */
const TRENDING_SLUGS = [
  "ishowspeed",
  "mrbeast",
  "markrober",
  "dream",
  "xqc",
  "airrack",
] as const;

export async function TrendingCreators() {
  const t = getT("home.trending");

  const creators = TRENDING_SLUGS.map((slug) => getCreatorBySlug(slug)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  );

  const avatars = await getCreatorAvatars(creators);

  return (
    <section aria-labelledby="trending-creators-title">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="label inline-flex items-center gap-1.5">
            <TrendingUpIcon width={14} height={14} />
            {t("eyebrow")}
          </p>
          <h2
            id="trending-creators-title"
            className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            {t("title")}
          </h2>
        </div>
        <Link
          href="/creators"
          className="btn-secondary text-sm"
          data-testid="creators-directory-link"
        >
          {t("viewAll")}
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map((c) => (
          <Link
            key={c.slug}
            href={`/creator/${c.slug}` as `/creator/${string}`}
            className="group card flex items-center gap-4 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop"
          >
            <CreatorAvatar
              src={avatars[c.slug] ?? null}
              alt={c.displayName}
              initial={c.displayName.charAt(0)}
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {c.displayName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {c.youtubeHandle} · {c.country}
              </p>
            </div>
            <span className="chip-brand text-[10px]">{c.category}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
