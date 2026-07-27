import { useT } from "@/lib/t";

import type { CreatorFallbackReason } from "@/lib/creatorProfile";

interface Props {
  reason: CreatorFallbackReason;
}

/**
 * Small, non-blocking banner that explains why the numbers on the
 * page are placeholders. Rendered when `getCreatorProfile()` couldn't
 * reach the YouTube Data API cleanly — never crashes the page, per
 * spec.
 *
 * Copy is per-reason so the user gets a specific hint (quota
 * exceeded vs. handle unknown vs. server misconfigured) instead of
 * a generic "something went wrong".
 */
export function CreatorFallbackNotice({ reason }: Props) {
  const t = useT("creator.fallback");
  return (
    <div
      role="note"
      aria-label={t("aria")}
      className="rounded-2xl border border-amber-300/60 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
    >
      <span className="font-medium">{t("prefix")}</span>{" "}
      <span>{t(`reasons.${reason}`)}</span>
    </div>
  );
}
