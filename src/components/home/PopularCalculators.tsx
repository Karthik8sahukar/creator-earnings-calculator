import { useT } from "@/lib/t";

import Link from "next/link";
import {
  ChartIcon,
  DollarIcon,
  FilmIcon,
  ShareIcon,
  TrendingUpIcon,
} from "../icons";

interface Card {
  href:
    | "/#find-channel"
    | "/youtube-rpm-calculator"
    | "/youtube-cpm-calculator"
    | "/youtube-shorts-calculator"
    | "/youtube-sponsorship-calculator"
    | "/instagram-money-calculator";
  titleKey: string;
  descriptionKey: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

const CARDS: readonly Card[] = [
  {
    href: "/#find-channel",
    titleKey: "popularCalculators.cards.money.title",
    descriptionKey: "popularCalculators.cards.money.description",
    Icon: DollarIcon,
  },
  {
    href: "/instagram-money-calculator",
    titleKey: "popularCalculators.cards.instagram.title",
    descriptionKey: "popularCalculators.cards.instagram.description",
    Icon: ShareIcon,
  },
  {
    href: "/youtube-rpm-calculator",
    titleKey: "popularCalculators.cards.rpm.title",
    descriptionKey: "popularCalculators.cards.rpm.description",
    Icon: TrendingUpIcon,
  },
  {
    href: "/youtube-cpm-calculator",
    titleKey: "popularCalculators.cards.cpm.title",
    descriptionKey: "popularCalculators.cards.cpm.description",
    Icon: ChartIcon,
  },
  {
    href: "/youtube-shorts-calculator",
    titleKey: "popularCalculators.cards.shorts.title",
    descriptionKey: "popularCalculators.cards.shorts.description",
    Icon: FilmIcon,
  },
  {
    href: "/youtube-sponsorship-calculator",
    titleKey: "popularCalculators.cards.sponsorship.title",
    descriptionKey: "popularCalculators.cards.sponsorship.description",
    Icon: ShareIcon,
  },
] as const;

/** Derive a stable test id from a card href. */
function normalizeHref(href: string): string {
  return href.replace(/^\/?#?/, "").replace(/[^a-z0-9-]/gi, "-") || "home";
}

export function PopularCalculators() {
  const t = useT();
  return (
    <section aria-labelledby="popular-calc-title">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <p className="label">{t("popularCalculators.eyebrow")}</p>
          <h2
            id="popular-calc-title"
            className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            {t("popularCalculators.title")}
          </h2>
        </div>
      </div>

      {/*
        Every card is a full-clickable Link with a visible "Open →"
        CTA. The CTA used to appear only on hover — that concealed the
        affordance on touch devices and made the primary action less
        discoverable — so it's now always rendered, with the arrow
        translating on hover for polish.
      */}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ href, titleKey, descriptionKey, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group card block h-full p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
              data-testid={`popular-card-${normalizeHref(href)}`}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-accent-500/15 text-brand-700 dark:text-brand-200">
                <Icon width={20} height={20} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                {t(titleKey)}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t(descriptionKey)}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-300 transition">
                {t("popularCalculators.openCta")}
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                >
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
