import Image from "next/image";
import { useT } from "@/lib/t";

import {
  CalendarIcon,
  EyeIcon,
  ExternalIcon,
  FilmIcon,
  GlobeIcon,
  UsersIcon,
} from "./icons";
import { formatCompact, formatDate } from "@/lib/format";
import type { ChannelDetails } from "@/types/youtube";

interface Props {
  channel: ChannelDetails;
}

export function ProfileCard({ channel }: Props) {
  const t = useT("profile");
  return (
    <section aria-labelledby="channel-title" className="card overflow-hidden">
      <div className="bg-gradient-to-br from-brand-100 via-white to-accent-400/20 h-24 sm:h-32" />
      <div className="px-6 sm:px-8 pb-6 sm:pb-8 -mt-14 sm:-mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
          <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-full ring-4 ring-white bg-slate-100 overflow-hidden shadow-card">
            {channel.thumbnail ? (
              <Image
                src={channel.thumbnail}
                alt={t("profilePictureAlt", { title: channel.title })}
                fill
                sizes="128px"
                className="object-cover"
                unoptimized
                priority
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <h1
              id="channel-title"
              className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-tight"
            >
              {channel.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              {channel.handle && <span>{channel.handle}</span>}
              {channel.country && (
                <span className="inline-flex items-center gap-1">
                  <GlobeIcon width={14} height={14} />
                  {channel.country}
                </span>
              )}
            </div>
          </div>
          <a
            href={channel.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary self-start sm:self-end"
            aria-label={t("viewOnYouTubeAria", { title: channel.title })}
          >
            {t("viewOnYouTube")}
            <ExternalIcon width={16} height={16} aria-hidden />
          </a>
        </div>

        {channel.description && (
          <p className="mt-6 text-slate-600 leading-relaxed max-w-3xl whitespace-pre-line line-clamp-5">
            {channel.description}
          </p>
        )}

        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Stat
            icon={<UsersIcon />}
            label={t("subscribers")}
            value={
              channel.hiddenSubscriberCount
                ? t("hidden")
                : formatCompact(channel.subscriberCount ?? 0)
            }
            title={
              channel.hiddenSubscriberCount
                ? t("subscribersHiddenTitle")
                : t("subscriberCount", { count: channel.subscriberCount ?? 0 })
            }
          />
          <Stat
            icon={<EyeIcon />}
            label={t("totalViews")}
            value={formatCompact(channel.viewCount)}
            title={t("viewCount", { count: channel.viewCount })}
          />
          <Stat
            icon={<FilmIcon />}
            label={t("videos")}
            value={formatCompact(channel.videoCount)}
            title={t("videoCount", { count: channel.videoCount })}
          />
          <Stat
            icon={<CalendarIcon />}
            label={t("joined")}
            value={formatDate(channel.publishedAt)}
          />
        </dl>
      </div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div
      title={title}
      className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3"
    >
      <div className="flex items-center gap-2 text-slate-500">
        <span className="text-brand-600">{icon}</span>
        <dt className="text-xs uppercase tracking-wide">{label}</dt>
      </div>
      <dd className="mt-1 text-xl font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
