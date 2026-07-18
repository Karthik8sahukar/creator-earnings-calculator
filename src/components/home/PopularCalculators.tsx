import Link from "next/link";

import {
  ChartIcon,
  DollarIcon,
  FilmIcon,
  ShareIcon,
  TrendingUpIcon,
} from "../icons";

interface Card {
  href: string;
  title: string;
  description: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

const CARDS: readonly Card[] = [
  {
    href: "/#find-channel",
    title: "YouTube Money Calculator",
    description:
      "Estimate a channel's total monthly revenue from long-form and Shorts views combined.",
    Icon: DollarIcon,
  },
  {
    href: "/youtube-rpm-calculator",
    title: "RPM Calculator",
    description:
      "Revenue per 1,000 monetized views — a creator-side earnings metric.",
    Icon: TrendingUpIcon,
  },
  {
    href: "/youtube-cpm-calculator",
    title: "CPM Calculator",
    description:
      "What advertisers pay per 1,000 ad impressions. Useful for pricing benchmarks.",
    Icon: ChartIcon,
  },
  {
    href: "/youtube-shorts-calculator",
    title: "Shorts Calculator",
    description:
      "Estimate Creator Pool payouts based on Shorts views and monetization mix.",
    Icon: FilmIcon,
  },
  {
    href: "/youtube-sponsorship-calculator",
    title: "Sponsorship Calculator",
    description:
      "Ballpark brand-deal rates from subscriber count and engagement.",
    Icon: ShareIcon,
  },
] as const;

export function PopularCalculators() {
  return (
    <section aria-labelledby="popular-calc-title">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <p className="label">Tools</p>
          <h2
            id="popular-calc-title"
            className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            Popular calculators
          </h2>
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ href, title, description, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group card block h-full p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-accent-500/15 text-brand-700 dark:text-brand-200">
                <Icon width={20} height={20} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition">
                Open
                <span aria-hidden>→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
