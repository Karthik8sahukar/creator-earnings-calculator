import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import {
  ChartIcon,
  DollarIcon,
  FilmIcon,
  ShareIcon,
  TrendingUpIcon,
} from "../icons";

// ─── Tool definitions ───────────────────────────────────────────────

interface Tool {
  href: string;
  titleKey: string;
  descriptionKey: string;
  categoryKey: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

const TOOLS: readonly Tool[] = [
  {
    href: "/#find-channel",
    titleKey: "featuredTools.cards.money.title",
    descriptionKey: "featuredTools.cards.money.description",
    categoryKey: "featuredTools.categories.analytics",
    Icon: DollarIcon,
  },
  {
    href: "/youtube-rpm-calculator",
    titleKey: "featuredTools.cards.rpm.title",
    descriptionKey: "featuredTools.cards.rpm.description",
    categoryKey: "featuredTools.categories.analytics",
    Icon: TrendingUpIcon,
  },
  {
    href: "/youtube-cpm-calculator",
    titleKey: "featuredTools.cards.cpm.title",
    descriptionKey: "featuredTools.cards.cpm.description",
    categoryKey: "featuredTools.categories.analytics",
    Icon: ChartIcon,
  },
  {
    href: "/youtube-shorts-calculator",
    titleKey: "featuredTools.cards.shorts.title",
    descriptionKey: "featuredTools.cards.shorts.description",
    categoryKey: "featuredTools.categories.analytics",
    Icon: FilmIcon,
  },
  {
    href: "/youtube-sponsorship-calculator",
    titleKey: "featuredTools.cards.sponsorship.title",
    descriptionKey: "featuredTools.cards.sponsorship.description",
    categoryKey: "featuredTools.categories.analytics",
    Icon: ShareIcon,
  },
  {
    href: "/youtube-engagement-calculator",
    titleKey: "featuredTools.cards.engagement.title",
    descriptionKey: "featuredTools.cards.engagement.description",
    categoryKey: "featuredTools.categories.analytics",
    Icon: TrendingUpIcon,
  },
  {
    href: "/youtube-adsense-calculator",
    titleKey: "featuredTools.cards.adsense.title",
    descriptionKey: "featuredTools.cards.adsense.description",
    categoryKey: "featuredTools.categories.analytics",
    Icon: DollarIcon,
  },
  {
    href: "/instagram-money-calculator",
    titleKey: "featuredTools.cards.instagram.title",
    descriptionKey: "featuredTools.cards.instagram.description",
    categoryKey: "featuredTools.categories.analytics",
    Icon: ShareIcon,
  },
  {
    href: "/twitch-bits-calculator",
    titleKey: "featuredTools.cards.twitch.title",
    descriptionKey: "featuredTools.cards.twitch.description",
    categoryKey: "featuredTools.categories.streaming",
    Icon: DollarIcon,
  },
  {
    href: "/yes-no-picker-wheel",
    titleKey: "featuredTools.cards.yesNo.title",
    descriptionKey: "featuredTools.cards.yesNo.description",
    categoryKey: "featuredTools.categories.utilities",
    Icon: ChartIcon,
  },
  {
    href: "/random-team-generator",
    titleKey: "featuredTools.cards.teams.title",
    descriptionKey: "featuredTools.cards.teams.description",
    categoryKey: "featuredTools.categories.utilities",
    Icon: ShareIcon,
  },
];

// ─── Component ──────────────────────────────────────────────────────

/**
 * Featured tools grid — the primary tool discovery section on the homepage.
 *
 * Responsive grid:
 *   - Mobile: 1 column
 *   - Tablet: 2 columns
 *   - Desktop: 3 columns (4 on xl+)
 *
 * Each card is a full-click Link with:
 *   - Icon
 *   - Title
 *   - Description
 *   - Category badge
 *   - Hover animation (translate-y + shadow)
 */
export function FeaturedTools() {
  const t = useTranslations();

  return (
    <section id="tools" aria-labelledby="featured-tools-title" className="scroll-mt-20">
      <div className="mb-8 text-center sm:text-left">
        <h2
          id="featured-tools-title"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          {t("featuredTools.title")}
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl">
          {t("featuredTools.subtitle")}
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TOOLS.map(({ href, titleKey, descriptionKey, categoryKey, Icon }) => (
          <li key={href}>
            <Link
              href={href as "/youtube-rpm-calculator"}
              className="group card flex h-full flex-col gap-3 p-5 transition duration-200 hover:-translate-y-1 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-accent-500/15 text-brand-700 dark:text-brand-200">
                  <Icon width={20} height={20} />
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {t(categoryKey)}
                </span>
              </div>

              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t(titleKey)}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                {t(descriptionKey)}
              </p>

              <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-300 transition">
                Open
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  &rarr;
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
