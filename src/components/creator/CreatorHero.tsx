import Image from "next/image";
import { useTranslations } from "next-intl";

import {
  CalendarIcon,
  CheckIcon,
  ExternalIcon,
  EyeIcon,
  FilmIcon,
  GlobeIcon,
  LinkIcon,
  UsersIcon,
  XLogoIcon,
} from "@/components/icons";
import type { Creator, CreatorSocialLinks } from "@/lib/creators";
import { formatCompact, formatDate } from "@/lib/format";
import type { ChannelDetails } from "@/types/youtube";

interface Props {
  creator: Creator;
  channel: ChannelDetails;
  /** True when we're rendering placeholder data (YouTube API failed). */
  isFallback?: boolean;
}

/**
 * Creator profile hero.
 *
 * Structurally similar to `<ProfileCard/>` (the /channel page hero)
 * but tuned for creator-specific fields:
 *   - Uses the creator's YouTube banner when available (falls back to
 *     the same brand gradient the channel page uses).
 *   - Surfaces `country` and `category` as chips so search-engine
 *     snippets and users can immediately place the creator.
 *   - Renders subscribers / views / videos / joined stats even when
 *     the channel is a placeholder (they simply show "—").
 */
export function CreatorHero({ creator, channel, isFallback = false }: Props) {
  const t = useTranslations("creator.hero");
  const tProfile = useTranslations("profile");

  const canShowSubs =
    channel.subscriberCount !== null &&
    !channel.hiddenSubscriberCount &&
    channel.subscriberCount > 0;

  return (
    <section aria-labelledby="creator-title" className="card overflow-hidden">
      {/*
       * Banner: use YouTube's channel banner when the API returns one.
       * Fall back to the same brand-gradient strip that ProfileCard
       * uses so the layout height stays stable either way.
       */}
      <div className="relative h-32 sm:h-44 bg-gradient-to-br from-brand-100 via-white to-accent-400/20 dark:from-brand-500/20 dark:via-slate-900 dark:to-accent-500/10">
        {channel.bannerUrl ? (
          <Image
            src={channel.bannerUrl}
            alt={t("bannerAlt", { name: creator.displayName })}
            fill
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover"
            unoptimized
            priority
          />
        ) : null}
      </div>

      <div className="px-6 sm:px-8 pb-6 sm:pb-8 -mt-14 sm:-mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
          <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-full ring-4 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-card">
            {channel.thumbnail ? (
              <Image
                src={channel.thumbnail}
                alt={tProfile("profilePictureAlt", { title: creator.displayName })}
                fill
                sizes="128px"
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              // Placeholder gradient with the creator's initial
              <div
                aria-hidden
                className="h-full w-full flex items-center justify-center text-3xl font-bold text-brand-700 bg-gradient-to-br from-brand-100 to-accent-400/30 dark:from-brand-500/30 dark:to-accent-500/20 dark:text-brand-100"
              >
                {creator.displayName.charAt(0)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1
              id="creator-title"
              className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight"
            >
              {creator.displayName}
              {creator.verified && (
                <span
                  className="ml-2 inline-flex items-center align-middle rounded-full bg-brand-100 dark:bg-brand-500/20 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-300"
                  title="Verified Creator"
                >
                  <CheckIcon width={12} height={12} />
                  <span className="ml-1">Verified</span>
                </span>
              )}
              {!creator.verified && (
                <span
                  className="ml-2 inline-flex items-center align-middle rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-500 dark:text-slate-400"
                  title="Directory Profile"
                >
                  Directory
                </span>
              )}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {creator.youtubeHandle}
              </span>
              <span className="chip-brand">{creator.category}</span>
              <span className="inline-flex items-center gap-1">
                <GlobeIcon width={14} height={14} />
                {creator.country}
              </span>
              {creator.language && (
                <span className="text-xs">{creator.language}</span>
              )}
            </div>
          </div>

          <a
            href={channel.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary self-start sm:self-end"
            aria-label={tProfile("viewOnYouTubeAria", {
              title: creator.displayName,
            })}
          >
            {tProfile("viewOnYouTube")}
            <ExternalIcon width={16} height={16} aria-hidden />
          </a>
        </div>

        <p className="mt-5 text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          {creator.biography || creator.description}
        </p>

        {/* Social Links */}
        <SocialLinksBar links={creator.socialLinks} creatorName={creator.displayName} />

        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Stat
            icon={<UsersIcon />}
            label={tProfile("subscribers")}
            value={canShowSubs ? formatCompact(channel.subscriberCount) : "—"}
            title={
              canShowSubs
                ? tProfile("subscriberCount", {
                    count: channel.subscriberCount ?? 0,
                  })
                : undefined
            }
          />
          <Stat
            icon={<EyeIcon />}
            label={tProfile("totalViews")}
            value={channel.viewCount > 0 ? formatCompact(channel.viewCount) : "—"}
            title={
              channel.viewCount > 0
                ? tProfile("viewCount", { count: channel.viewCount })
                : undefined
            }
          />
          <Stat
            icon={<FilmIcon />}
            label={tProfile("videos")}
            value={channel.videoCount > 0 ? formatCompact(channel.videoCount) : "—"}
            title={
              channel.videoCount > 0
                ? tProfile("videoCount", { count: channel.videoCount })
                : undefined
            }
          />
          <Stat
            icon={<CalendarIcon />}
            label={tProfile("joined")}
            value={channel.publishedAt ? formatDate(channel.publishedAt) : "—"}
          />
        </dl>

        {isFallback && (
          <p
            className="mt-4 text-xs text-slate-500 dark:text-slate-400"
            role="note"
          >
            {t("fallbackNote")}
          </p>
        )}
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
      className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 dark:bg-slate-900 dark:border-slate-800"
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

function SocialLinksBar({ links, creatorName }: { links: CreatorSocialLinks; creatorName: string }) {
  const items: { href: string; label: string; icon: React.ReactNode }[] = [];

  if (links.twitter) items.push({ href: links.twitter, label: `${creatorName} on X`, icon: <XLogoIcon width={16} height={16} /> });
  if (links.instagram) items.push({ href: links.instagram, label: `${creatorName} on Instagram`, icon: <span className="text-sm">IG</span> });
  if (links.tiktok) items.push({ href: links.tiktok, label: `${creatorName} on TikTok`, icon: <span className="text-sm">TT</span> });
  if (links.twitch) items.push({ href: links.twitch, label: `${creatorName} on Twitch`, icon: <span className="text-sm">TV</span> });
  if (links.discord) items.push({ href: links.discord, label: `${creatorName} Discord`, icon: <span className="text-sm">DC</span> });
  if (links.website) items.push({ href: links.website, label: `${creatorName} website`, icon: <LinkIcon width={16} height={16} /> });

  if (items.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {item.icon}
          <ExternalIcon width={12} height={12} className="opacity-50" />
        </a>
      ))}
    </div>
  );
}
