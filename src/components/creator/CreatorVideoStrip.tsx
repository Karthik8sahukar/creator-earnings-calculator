import Image from "next/image";
import { useT } from "@/lib/t";

import { formatCompact, formatRelativeDate } from "@/lib/format";
import type { VideoItem } from "@/types/youtube";

interface Props {
  titleKey: "recentTitle" | "topTitle";
  emptyKey: "recentEmpty" | "topEmpty";
  videos: readonly VideoItem[];
  /** How many videos to render. */
  limit?: number;
}

/**
 * Grid of video cards used by both the "Recent uploads" and "Top
 * videos" sections. Two sections share this component because the
 * markup, aspect ratio, and metadata are identical — only the source
 * array (recency-sorted vs. views-sorted) and the section title
 * differ.
 *
 * We deliberately do NOT link to a channel-page video — the click
 * goes straight to YouTube (opens in a new tab), because the
 * creator-profile page is a marketing surface, not a video player.
 */
export function CreatorVideoStrip({
  titleKey,
  emptyKey,
  videos,
  limit = 10,
}: Props) {
  const t = useT("creator.videos");
  const tShared = useTranslations("videos");
  const list = videos.slice(0, limit);

  return (
    <section
      aria-labelledby={`creator-${titleKey}`}
      className="space-y-4"
    >
      <h2
        id={`creator-${titleKey}`}
        className="text-xl font-semibold text-slate-900 dark:text-slate-100"
      >
        {t(titleKey)}
      </h2>

      {list.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t(emptyKey)}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => (
            <li key={v.videoId}>
              <a
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card group block h-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                aria-label={tShared("watchAria", {
                  title: v.title,
                  newTab: tShared("shortBadge"),
                })}
              >
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
                  {v.thumbnail ? (
                    <Image
                      src={v.thumbnail}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition group-hover:scale-[1.02]"
                      unoptimized
                    />
                  ) : null}
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
                    {v.durationLabel}
                  </span>
                  {v.isShort && (
                    <span className="absolute top-2 left-2 chip-brand !py-0.5 !px-2 text-[10px]">
                      {tShared("shortBadge")}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {formatCompact(v.viewCount)} {tShared("views")} ·{" "}
                    {formatRelativeDate(v.publishedAt)}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
