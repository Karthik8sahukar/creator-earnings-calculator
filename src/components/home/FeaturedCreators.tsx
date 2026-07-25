import { getTranslations } from "next-intl/server";

import { CreatorCard } from "@/components/creator/CreatorCard";
import { Link } from "@/i18n/navigation";
import { getCreatorAvatars } from "@/lib/creatorAvatars";
import { getCreatorBySlug } from "@/lib/creators";

/**
 * Featured creators section — curated hand-picked creators that
 * represent diversity across countries, niches, and tiers.
 */
const FEATURED_SLUGS = [
  "mrbeast",
  "pewdiepie",
  "mkbhd",
  "hikakintv",
  "linustechtips",
  "kurzgesagt",
  "blackpink",
  "markiplier",
] as const;

export async function FeaturedCreators() {
  const t = await getTranslations("home.featured");

  const creators = FEATURED_SLUGS.map((slug) => getCreatorBySlug(slug)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  );

  const avatars = await getCreatorAvatars(creators);

  return (
    <section aria-labelledby="featured-creators-title">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="label">{t("eyebrow")}</p>
          <h2
            id="featured-creators-title"
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

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map((c) => (
          <li key={c.slug}>
            <CreatorCard
              creator={c}
              avatarUrl={avatars[c.slug] ?? null}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
