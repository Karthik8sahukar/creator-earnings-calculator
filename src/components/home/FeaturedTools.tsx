import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import {
  ChartIcon,
  DollarIcon,
  FilmIcon,
  ShareIcon,
  TrendingUpIcon,
} from "../icons";

// ─── Tool definitions (Creator Analytics only) ──────────────────────

interface Tool {
  href: string;
  titleKey: string;
  descriptionKey: string;
  badgeKey: string;
  badgeColor: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
  featured?: boolean;
}

const BADGE_ANALYTICS = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
const BADGE_STREAMING = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";

const FEATURED_TOOL: Tool = {
  href: "/#find-channel",
  titleKey: "featuredTools.cards.money.title",
  descriptionKey: "featuredTools.cards.money.description",
  badgeKey: "featuredTools.badges.analytics",
  badgeColor: BADGE_ANALYTICS,
  Icon: DollarIcon,
  featured: true,
};

const OTHER_TOOLS: readonly Tool[] = [
  { href: "/youtube-rpm-calculator", titleKey: "featuredTools.cards.rpm.title", descriptionKey: "featuredTools.cards.rpm.description", badgeKey: "featuredTools.badges.analytics", badgeColor: BADGE_ANALYTICS, Icon: TrendingUpIcon },
  { href: "/youtube-cpm-calculator", titleKey: "featuredTools.cards.cpm.title", descriptionKey: "featuredTools.cards.cpm.description", badgeKey: "featuredTools.badges.analytics", badgeColor: BADGE_ANALYTICS, Icon: ChartIcon },
  { href: "/youtube-shorts-calculator", titleKey: "featuredTools.cards.shorts.title", descriptionKey: "featuredTools.cards.shorts.description", badgeKey: "featuredTools.badges.analytics", badgeColor: BADGE_ANALYTICS, Icon: FilmIcon },
  { href: "/youtube-sponsorship-calculator", titleKey: "featuredTools.cards.sponsorship.title", descriptionKey: "featuredTools.cards.sponsorship.description", badgeKey: "featuredTools.badges.analytics", badgeColor: BADGE_ANALYTICS, Icon: ShareIcon },
  { href: "/youtube-engagement-calculator", titleKey: "featuredTools.cards.engagement.title", descriptionKey: "featuredTools.cards.engagement.description", badgeKey: "featuredTools.badges.analytics", badgeColor: BADGE_ANALYTICS, Icon: TrendingUpIcon },
  { href: "/youtube-adsense-calculator", titleKey: "featuredTools.cards.adsense.title", descriptionKey: "featuredTools.cards.adsense.description", badgeKey: "featuredTools.badges.analytics", badgeColor: BADGE_ANALYTICS, Icon: DollarIcon },
  { href: "/instagram-money-calculator", titleKey: "featuredTools.cards.instagram.title", descriptionKey: "featuredTools.cards.instagram.description", badgeKey: "featuredTools.badges.analytics", badgeColor: BADGE_ANALYTICS, Icon: ShareIcon },
  { href: "/twitch-bits-calculator", titleKey: "featuredTools.cards.twitch.title", descriptionKey: "featuredTools.cards.twitch.description", badgeKey: "featuredTools.badges.streaming", badgeColor: BADGE_STREAMING, Icon: DollarIcon },
];

/**
 * Creator Analytics tools grid — homepage section 1.
 *
 * Layout: Featured card (2-col span, larger) + 8 standard cards in a 3-col grid.
 * No decision/utility tools here (those are in DecisionTools section below).
 */
export function FeaturedTools() {
  const t = useTranslations();

  return (
    <section id="creator-tools" aria-labelledby="featured-tools-title" className="scroll-mt-20">
      <div className="mb-10 text-center sm:text-left">
        <h2
          id="featured-tools-title"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          {t("featuredTools.title")}
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          {t("featuredTools.subtitle")}
        </p>
      </div>

      {/* Featured: YouTube Money Calculator — larger card spanning 2 columns */}
      <Link
        href={FEATURED_TOOL.href as "/#find-channel"}
        className="group card mb-5 flex flex-col sm:flex-row items-start gap-6 p-7 sm:p-8 border-2 border-brand-200 bg-gradient-to-br from-white to-brand-50/40 dark:border-brand-700/50 dark:from-slate-900 dark:to-brand-950/20 transition duration-200 hover:-translate-y-1 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
      >
        <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/15 text-brand-700 dark:text-brand-200">
          <FEATURED_TOOL.Icon width={30} height={30} />
        </span>
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t(FEATURED_TOOL.titleKey)}
            </h3>
            <span className="inline-flex items-center rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
              Flagship
            </span>
          </div>
          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
            {t(FEATURED_TOOL.descriptionKey)}
          </p>
          <span className="inline-flex items-center gap-1.5 text-base font-semibold text-brand-700 dark:text-brand-300">
            Try the calculator
            <span aria-hidden className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </span>
        </div>
      </Link>

      {/* Other Creator Analytics tools */}
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {OTHER_TOOLS.map(({ href, titleKey, descriptionKey, badgeKey, badgeColor, Icon }) => (
          <li key={href}>
            <Link
              href={href as "/youtube-rpm-calculator"}
              className="group card flex h-full flex-col gap-4 p-5 transition duration-200 hover:-translate-y-1 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-accent-500/15 text-brand-700 dark:text-brand-200">
                  <Icon width={18} height={18} />
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeColor}`}>
                  {t(badgeKey)}
                </span>
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {t(titleKey)}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t(descriptionKey)}
                </p>
              </div>

              <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-300">
                Open
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
