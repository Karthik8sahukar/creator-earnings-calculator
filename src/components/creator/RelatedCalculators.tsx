import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import {
  ChartIcon,
  DollarIcon,
  FilmIcon,
  ShareIcon,
  TrendingUpIcon,
} from "@/components/icons";

interface CalcCard {
  href:
    | "/youtube-money-calculator"
    | "/youtube-rpm-calculator"
    | "/youtube-cpm-calculator"
    | "/youtube-shorts-calculator"
    | "/youtube-sponsorship-calculator";
  titleKey: string;
  descriptionKey: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

/**
 * The five calculators listed here match the ones on the home
 * "Popular calculators" section — but each one is contextualized
 * for the creator profile page (e.g. "Estimate this channel's
 * earnings with the Money Calculator").
 */
const CARDS: readonly CalcCard[] = [
  {
    href: "/youtube-money-calculator",
    titleKey: "money.title",
    descriptionKey: "money.description",
    Icon: DollarIcon,
  },
  {
    href: "/youtube-rpm-calculator",
    titleKey: "rpm.title",
    descriptionKey: "rpm.description",
    Icon: TrendingUpIcon,
  },
  {
    href: "/youtube-cpm-calculator",
    titleKey: "cpm.title",
    descriptionKey: "cpm.description",
    Icon: ChartIcon,
  },
  {
    href: "/youtube-shorts-calculator",
    titleKey: "shorts.title",
    descriptionKey: "shorts.description",
    Icon: FilmIcon,
  },
  {
    href: "/youtube-sponsorship-calculator",
    titleKey: "sponsorship.title",
    descriptionKey: "sponsorship.description",
    Icon: ShareIcon,
  },
];

export function RelatedCalculators() {
  const t = useTranslations("creator.relatedCalculators");

  return (
    <section aria-labelledby="creator-related-calcs" className="space-y-4">
      <div>
        <p className="label">{t("eyebrow")}</p>
        <h2
          id="creator-related-calcs"
          className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100"
        >
          {t("title")}
        </h2>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ href, titleKey, descriptionKey, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group card block h-full p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                <Icon width={18} height={18} />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t(titleKey)}
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t(descriptionKey)}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-300">
                {t("openCta")}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
