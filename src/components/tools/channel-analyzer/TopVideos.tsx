import Image from "next/image";
import { useTranslations } from "next-intl";

import {
  ClockIcon,
  ExternalIcon,
  EyeIcon,
  ThumbsUpIcon,
} from "@/components/icons";
import { formatCompact, formatDate } from "@/lib/format";
import type { VideoItem } from "@/types/youtube";

interface Props {
  videos: VideoItem[];
  /** Maximum videos to show. Default 6. */
  limit?: number;
}

/**
 * Channel Analyzer — Top Videos section.
 *
 * Shows the highest-viewed videos from the analyzed sample. Each
 * card includes the fields the spec calls for: thumbnail, title,
 * views, likes, published date, and a link to YouTube.
 *
 * The sample is already sorted by viewCount descending in the
 * analyzer orchestrator, so this component performs no ranking —
 * it just slices to `limit` and renders. That keeps ranking logic
 * in one place (analyzer lib) and this file focused on presentation.
 *
 * Zero-safe: rendering nothing when `videos` is empty is the parent
 * page's responsibility (it displays an "empty state" message). If
 * an empty array reaches this component we render an empty <ul> for
 * defensive layout stability.
 */
export function TopVideos({ videos, limit = 6 }: Props) {
  const t = useTranslations("tools.channelAnalyzer.topVideos");
  const tVideos = useTranslations("videos");
  const tCommon = useTranslations("common.actions");

  const items = videos.slice(0, Math.max(0, limit));

  return (
    <section
      aria-labelledby="channel-analyzer-top-videos-title"
      className="space-y-3"
    >
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2
          id="channel-analyzer-top-videos-title"
          className="text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          {t("title")}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("subtitle", { count: items.length })}
        </p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((v) => (
          <li key={v.videoId} className="card overflow-hidden flex flex-col">
            <a
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tVideos("watchAria", {
                title: v.title,
                newTab: tCommon("openInNewTab"),
              })}
              className="relative block aspect-video bg-slate-100 dark:bg-slate-800 group"
            >
              {v.thumbnail ? (
                <Image
                  src={v.thumbnail}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-[1.02] transition-transform"
                  unoptimized
                />
              ) : null}
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
                <ClockIcon width={12} height={12} />
                {v.durationLabel}
              </span>
              {v.isShort && (
                <span className="absolute top-2 left-2 rounded-md bg-brand-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {tVideos("shortBadge")}
                </span>
              )}
            </a>
            <div className="p-4 flex-1 flex flex-col gap-2">
              <h3 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-700 dark:hover:text-brand-300"
                >
                  {v.title}
                </a>
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                <Meta
                  icon={<EyeIcon width={14} height={14} />}
                  label={tVideos("views")}
                  value={formatCompact(v.viewCount)}
                />
                <Meta
                  icon={<ThumbsUpIcon width={14} height={14} />}
                  label={tVideos("likes")}
                  value={formatCompact(v.likeCount)}
                />
              </dl>
              <div className="mt-auto flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <time dateTime={v.publishedAt}>{formatDate(v.publishedAt)}</time>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
                >
                  {t("watchOnYouTube")}
                  <ExternalIcon width={12} height={12} aria-hidden />
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5">
      <span className="text-slate-500 dark:text-slate-400">{icon}</span>
      <div className="flex flex-col leading-tight">
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {value}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {label}
        </span>
      </div>
    </div>
  );
}
