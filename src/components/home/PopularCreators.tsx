
import { CreatorCard } from "@/components/creator/CreatorCard";
import Link from "next/link";
import { getCreatorAvatars } from "@/lib/creatorAvatars";
import { getCreatorBySlug } from "@/lib/creators";

/**
 * The set of six creators that appear on the homepage strip, in
 * order. All six are guaranteed to exist in `CREATORS`; a mismatch
 * would surface at build time via the `filter(Boolean)` type
 * narrowing below.
 */
const POPULAR_SLUGS = [
  "mrbeast",
  "ishowspeed",
  "pewdiepie",
  "markiplier",
  "dream",
  "coryxkenshin",
] as const;

/**
 * Homepage "Popular creators" strip.
 *
 * A server component so the CreatorCard `<Link>` prefetches
 * correctly and no JavaScript is shipped for a display-only grid.
 * Sits between `<PopularCalculators/>` and `<CreatorPlatforms/>` on
 * the homepage — see `src/app/[locale]/page.tsx`.
 *
 * Fetches the 6 avatars in parallel via `getCreatorAvatars()`,
 * which reuses the existing YouTube TtlCache and never throws.
 */
export async function PopularCreators() {
  const t = await getTranslations("popularCreators");

  const creators = POPULAR_SLUGS.map((slug) => getCreatorBySlug(slug)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  );

  const avatars = await getCreatorAvatars(creators);

  return (
    <section aria-labelledby="popular-creators-title">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="label">{t("eyebrow")}</p>
          <h2
            id="popular-creators-title"
            className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            {t("title")}
          </h2>
        </div>
        <Link
          href="/creators"
          className="btn-secondary text-sm"
          data-testid="popular-creators-view-all"
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
              testId={`popular-creator-${c.slug}`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
