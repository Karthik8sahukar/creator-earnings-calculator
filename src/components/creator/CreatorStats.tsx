import { useT } from "@/lib/t";

import type { CreatorProfile } from "@/lib/creatorProfile";
import { formatCompact } from "@/lib/format";

interface Props {
  profile: CreatorProfile;
}

/**
 * Channel-level statistics card.
 *
 * Shows five values that the profile page's users care about:
 *   - Average views (from `analyzePerformance()`).
 *   - Upload frequency (uploads over the last 30 / 90 days).
 *   - Estimated engagement — the median (likes + comments) / views
 *     ratio across the analyzed sample.
 *   - Revenue sources — a static, creator-agnostic list. This is a
 *     UI hint (what streams a creator of this size usually taps),
 *     not a claim about the specific channel.
 *   - Content category — mirrored from the creator record so the
 *     card is a self-contained summary.
 *
 * When we have no video sample all numeric fields render em-dashes;
 * the section stays visible so the layout doesn't reflow.
 */
export function CreatorStats({ profile }: Props) {
  const t = useT("creator.stats");
  const { creator, analysis, videos } = profile;

  const hasVideos = videos.length > 0;

  // Estimated engagement — a rough (likes + comments) / views ratio.
  // Averaged across the sample so a single viral video doesn't skew
  // it. Purely a display number — we never feed it back into the
  // earnings estimator (that has its own baseline in
  // `calculateSponsorship`).
  const engagement = hasVideos ? averageEngagement(videos) : 0;

  return (
    <section aria-labelledby="creator-stats-title" className="card p-6 sm:p-8">
      <p className="label">{t("eyebrow")}</p>
      <h2
        id="creator-stats-title"
        className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100"
      >
        {t("title")}
      </h2>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Row
          label={t("averageViews")}
          value={hasVideos ? formatCompact(analysis.averageRecentViews) : "—"}
          hint={
            hasVideos
              ? t("averageViewsHint", { count: analysis.sampleSize })
              : t("noVideoSampleHint")
          }
        />
        <Row
          label={t("uploadFrequency")}
          value={
            hasVideos
              ? t("uploadFrequencyValue", {
                  count30: analysis.uploadsLast30Days,
                  count90: analysis.uploadsLast90Days,
                })
              : "—"
          }
        />
        <Row
          label={t("engagement")}
          value={hasVideos ? `${engagement.toFixed(1)}%` : "—"}
          hint={hasVideos ? t("engagementHint") : undefined}
        />
        <Row
          label={t("contentMix")}
          value={
            hasVideos
              ? t("contentMixValue", {
                  long: analysis.longFormPercentage,
                  shorts: analysis.shortsPercentage,
                })
              : "—"
          }
        />
        <Row
          label={t("contentCategory")}
          value={creator.category}
        />
        <Row
          label={t("revenueSources")}
          value={t("revenueSourcesValue")}
          hint={t("revenueSourcesHint")}
        />
      </dl>
    </section>
  );
}

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </dd>
      {hint && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

function averageEngagement(
  videos: readonly { likeCount: number; commentCount: number; viewCount: number }[],
): number {
  if (videos.length === 0) return 0;
  let sum = 0;
  let counted = 0;
  for (const v of videos) {
    if (!v.viewCount || v.viewCount <= 0) continue;
    sum += ((v.likeCount + v.commentCount) / v.viewCount) * 100;
    counted += 1;
  }
  if (counted === 0) return 0;
  return sum / counted;
}
