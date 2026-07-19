import Image from "next/image";
import { useTranslations } from "next-intl";

import {
  CalendarIcon,
  EyeIcon,
  ExternalIcon,
  FilmIcon,
  GlobeIcon,
  UsersIcon,
} from "@/components/icons";
import { formatCompact, formatDate } from "@/lib/format";
import type { ChannelDetails } from "@/types/youtube";

interface Props {
  channel: ChannelDetails;
}

/**
 * Channel Analyzer — hero card.
 *
 * Renders every field the spec calls for:
 *
 *   • Banner (from `bannerUrl` when available; falls back to a brand
 *     gradient so we never leave a bare rectangle)
 *   • Avatar (thumbnail)
 *   • Channel Name (as an <h2> — the page already owns the <h1>)
 *   • Handle
 *   • Subscribers  · Total Views · Videos · Country · Joined
 *   • Description  (line-clamp so hero stays short)
 *
 * Follows the visual conventions of the site-wide `ProfileCard`
 * component but is a dedicated Channel Analyzer variant so the tool
 * can evolve independently (e.g. surface additional analytics
 * chrome later) without regressing the channel-page hero.
 *
 * A server component. All values are static per render.
 */
export function ChannelCard({ channel }: Props) {
  const t = useTranslations("tools.channelAnalyzer.card");
  const tProfile = useTranslations("profile");

  const bannerSrc = channel.bannerUrl ?? null;

  return (
    <section
      aria-labelledby="channel-analyzer-title"
      className="card overflow-hidden"
    >
      {/* Banner. Real image when we have one; branded gradient when we don't. */}
      <div className="relative h-32 sm:h-44 bg-gradient-to-br from-brand-100 via-white to-accent-400/20 dark:from-brand-900/40 dark:via-slate-900 dark:to-accent-500/10">
        {bannerSrc && (
          <Image
            src={bannerSrc}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 960px"
            className="object-cover"
            unoptimized
            priority={false}
          />
        )}
      </div>

      <div className="px-6 sm:px-8 pb-6 sm:pb-8 -mt-14 sm:-mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
          {/* Avatar */}
          <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-full ring-4 ring-white dark:ring-slate-950 bg-slate-100 overflow-hidden shadow-card">
            {channel.thumbnail ? (
              <Image
                src={channel.thumbnail}
                alt={tProfile("profilePictureAlt", { title: channel.title })}
                fill
                sizes="128px"
                className="object-cover"
                unoptimized
                priority
              />
            ) : null}
          </div>

          {/* Name + handle + country */}
          <div className="min-w-0 flex-1">
            <h2
              id="channel-analyzer-title"
              className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-50 leading-tight"
            >
              {channel.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
              {channel.handle && <span>{channel.handle}</span>}
              {channel.country && (
                <span className="inline-flex items-center gap-1">
                  <GlobeIcon width={14} height={14} />
                  {channel.country}
                </span>
              )}
            </div>
          </div>

          {/* External link — matches the ProfileCard CTA. */}
          <a
            href={channel.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={tProfile("viewOnYouTubeAria", { title: channel.title })}
            className="btn-primary self-start sm:self-end"
          >
            {tProfile("viewOnYouTube")}
            <ExternalIcon width={16} height={16} aria-hidden />
          </a>
        </div>

        {channel.description && (
          <p className="mt-6 text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl whitespace-pre-line line-clamp-5">
            {channel.description}
          </p>
        )}

        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Stat
            icon={<UsersIcon />}
            label={t("subscribers")}
            value={
              channel.hiddenSubscriberCount
                ? tProfile("hidden")
                : formatCompact(channel.subscriberCount ?? 0)
            }
            title={
              channel.hiddenSubscriberCount
                ? tProfile("subscribersHiddenTitle")
                : tProfile("subscriberCount", {
                    count: channel.subscriberCount ?? 0,
                  })
            }
          />
          <Stat
            icon={<EyeIcon />}
            label={t("totalViews")}
            value={formatCompact(channel.viewCount)}
            title={tProfile("viewCount", { count: channel.viewCount })}
          />
          <Stat
            icon={<FilmIcon />}
            label={t("videos")}
            value={formatCompact(channel.videoCount)}
            title={tProfile("videoCount", { count: channel.videoCount })}
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
      className="rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 px-4 py-3"
    >
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <span className="text-brand-600 dark:text-brand-300">{icon}</span>
        <dt className="text-xs uppercase tracking-wide">{label}</dt>
      </div>
      <dd className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}
