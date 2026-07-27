import { useT } from "@/lib/t";

import { CreatorAvatar } from "./CreatorAvatar";
import Link from "next/link";
import { GlobeIcon } from "@/components/icons";
import type { Creator } from "@/lib/creators";

interface Props {
  creator: Creator;
  /**
   * Live YouTube channel avatar URL. Pass `null` (or omit) to render
   * the initial-based placeholder — that path never crashes and never
   * shows a broken image icon.
   *
   * The parent server component is responsible for fetching this
   * (see `src/lib/creatorAvatars.ts`). CreatorCard itself is a pure
   * presentation component — it does NOT make network requests.
   */
  avatarUrl?: string | null;
  /** Optional test id — set on the /creators grid to make E2E precise. */
  testId?: string;
}

/**
 * A compact card summarizing a creator. Shared surface between:
 *   - `/[locale]/creators` (search + filter grid)
 *   - The "Related creators" strip on `/creator/[slug]`
 *   - The "Popular creators" strip on the homepage
 *
 * The avatar is rendered by `<CreatorAvatar/>`, which handles both
 * happy-path (YouTube image) and fallback (initial) states — see
 * that component for the rules.
 */
export function CreatorCard({ creator, avatarUrl, testId }: Props) {
  const t = useT("creators.card");

  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={`/creator/${creator.slug}` as any}
      data-testid={testId ?? `creator-card-${creator.slug}`}
      data-creator-slug={creator.slug}
      className="group card block h-full p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
    >
      <div className="flex items-start gap-3">
        <CreatorAvatar
          src={avatarUrl}
          alt={creator.displayName}
          initial={creator.displayName.charAt(0)}
        />
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
