import { useTranslations } from "next-intl";
import Image from "next/image";

import { ChatIcon, ClockIcon, EyeIcon, ThumbsUpIcon } from "./icons";
import { formatCompact, formatRelativeDate } from "@/lib/format";
import type { VideoItem } from "@/types/youtube";

interface Props {
  videos: VideoItem[];
}

export function VideosGrid({ videos }: Props) {
  const t = useTranslations("videos");
  const tCommon = useTranslations("common.actions");

  if (videos.length === 0) {
    return <p className="text-sm text-slate-500">{t("emptyShort")}</p>;
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((v) => (
        <li key={v.videoId} className="card overflow-hidden flex flex-col">
          <a
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("watchAria", {
              title: v.title,
              newTab: tCommon("openInNewTab"),
            })}
            className="relative block aspect-video bg-slate-100 group"
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
                {t("shortBadge")}
              </span>
            )}
          </a>
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-medium text-slate-900 line-clamp-2">
              <a
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-700"
              >
                {v.title}
              </a>
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {formatRelativeDate(v.publishedAt)}
            </p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
              <Meta
                icon={<EyeIcon width={14} height={14} />}
                label={t("views")}
                value={formatCompact(v.viewCount)}
              />
              <Meta
                icon={<ThumbsUpIcon width={14} height={14} />}
                label={t("likes")}
                value={formatCompact(v.likeCount)}
              />
              <Meta
                icon={<ChatIcon width={14} height={14} />}
                label={t("comments")}
                value={formatCompact(v.commentCount)}
              />
            </dl>
          </div>
        </li>
      ))}
    </ul>
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
    <div className="flex flex-col items-center rounded-md bg-slate-50 px-2 py-2">
      <span className="text-slate-500">{icon}</span>
      <span className="mt-1 font-semibold text-slate-800">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </span>
    </div>
  );
}
