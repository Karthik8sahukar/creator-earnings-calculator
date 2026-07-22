import { useTranslations } from "next-intl";

import { PlayIcon } from "@/components/icons";
import type { CreatorFeaturedVideo } from "@/lib/creators";
import { formatCompact } from "@/lib/format";

interface Props {
  videos: CreatorFeaturedVideo[];
  creatorName: string;
}

/**
 * Renders featured videos from the local dataset when live video data
 * is unavailable. Each entry links to the YouTube video.
 */
export function CreatorFeaturedVideos({ videos, creatorName }: Props) {
  const t = useTranslations("creator.featuredVideos");

  if (videos.length === 0) return null;

  return (
    <section aria-labelledby="creator-featured-title" className="card p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <PlayIcon width={20} height={20} className="text-brand-600 dark:text-brand-300" />
        <h2
          id="creator-featured-title"
          className="text-xl font-semibold text-slate-900 dark:text-slate-100"
        >
          {t("title", { name: creatorName })}
        </h2>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <a
            key={v.videoId}
            href={`https://www.youtube.com/watch?v=${v.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-brand-300 dark:hover:border-brand-600 transition-colors"
          >
            <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`}
                alt={v.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="rounded-full bg-white/90 p-2">
                  <PlayIcon width={20} height={20} className="text-slate-900" />
                </div>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                {v.title}
              </p>
              {v.views && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {formatCompact(v.views)} {t("views")}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
