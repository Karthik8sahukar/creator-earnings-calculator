import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { GlobeIcon } from "@/components/icons";
import type { Creator } from "@/lib/creators";

interface Props {
  creator: Creator;
  /** Optional test id — set on the /creators grid to make E2E precise. */
  testId?: string;
}

/**
 * A compact card summarizing a creator. Shared surface between:
 *   - `/[locale]/creators` (search + filter grid)
 *   - The "Related creators" strip on `/creator/[slug]`
 *   - The "Popular creators" strip on the homepage
 *
 * We render only the STATIC catalog fields (name, handle, country,
 * category, description) — never subscriber counts or thumbnail
 * URLs. Live YouTube stats live on the profile page itself, which is
 * the one route that server-side fetches them.
 */
export function CreatorCard({ creator, testId }: Props) {
  const t = useTranslations("creators.card");

  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={`/creator/${creator.slug}` as any}
      data-testid={testId ?? `creator-card-${creator.slug}`}
      data-creator-slug={creator.slug}
      className="group card block h-full p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
    >
      <div className="flex items-start gap-3">
        {/*
          Decorative circular avatar placeholder — the same gradient
          treatment the profile hero uses when we don't have a live
          thumbnail. Kept static so the /creators grid doesn't hammer
          the YouTube API on every page load.
        */}
        <div
          aria-hidden
          className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-brand-100 to-accent-400/30 dark:from-brand-500/30 dark:to-accent-500/20 flex items-center justify-center text-lg font-bold text-brand-700 dark:text-brand-100"
        >
          {creator.displayName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
            {creator.displayName}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {creator.youtubeHandle}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
        {creator.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="chip-brand">{creator.category}</span>
        <span className="chip inline-flex items-center gap-1">
          <GlobeIcon width={12} height={12} />
          {creator.country}
        </span>
      </div>

      <span className="sr-only">{t("cardAria", { name: creator.displayName })}</span>
    </Link>
  );
}
