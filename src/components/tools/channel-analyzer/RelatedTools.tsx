import { useTranslations } from "next-intl";

import {
  ChartIcon,
  DollarIcon,
  FilmIcon,
  ShareIcon,
  TrendingUpIcon,
} from "@/components/icons";
import { Link } from "@/i18n/navigation";

/**
 * The five related-tool links the Channel Analyzer surfaces.
 *
 * Every href is one of the existing calculator routes on BeHumler —
 * we do NOT introduce new routes here. The `href` types come from
 * the same string-literal union that `CalculatorsMenu` uses, so a
 * typo would fail typecheck.
 */
interface ToolLink {
  href:
    | "/#find-channel"
    | "/youtube-rpm-calculator"
    | "/youtube-cpm-calculator"
    | "/youtube-shorts-calculator"
    | "/youtube-sponsorship-calculator";
  labelKey:
    | "money"
    | "rpm"
    | "cpm"
    | "shorts"
    | "sponsorship";
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

const TOOL_LINKS: readonly ToolLink[] = [
  { href: "/#find-channel", labelKey: "money", Icon: DollarIcon },
  { href: "/youtube-rpm-calculator", labelKey: "rpm", Icon: TrendingUpIcon },
  { href: "/youtube-cpm-calculator", labelKey: "cpm", Icon: ChartIcon },
  { href: "/youtube-shorts-calculator", labelKey: "shorts", Icon: FilmIcon },
  {
    href: "/youtube-sponsorship-calculator",
    labelKey: "sponsorship",
    Icon: ShareIcon,
  },
] as const;

/**
 * Channel Analyzer — Related Tools section.
 *
 * Renders five links to the site's other calculators. This matches
 * the "Related calculators" pattern from
 * `/[locale]/instagram-money-calculator/page.tsx` but is a dedicated
 * component so the analyzer can control the icon set and copy
 * without threading an inline `RelatedLink` through the page.
 *
 * A server component. Uses `@/i18n/navigation` so the active locale
 * prefix is preserved.
 */
export function RelatedTools() {
  const t = useTranslations("tools.channelAnalyzer.related");

  return (
    <section
      aria-labelledby="channel-analyzer-related-title"
      className="card p-6 sm:p-8 space-y-4"
    >
      <div>
        <h2
          id="channel-analyzer-related-title"
          className="text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("subtitle")}
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOL_LINKS.map(({ href, labelKey, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-pop dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                <Icon width={18} height={18} />
              </span>
              <span className="flex flex-col">
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {t(`links.${labelKey}.title`)}
                </span>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t(`links.${labelKey}.description`)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
