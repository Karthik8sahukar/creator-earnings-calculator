import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { ChartIcon, DollarIcon, FilmIcon, ShareIcon, TrendingUpIcon } from "../icons";

interface Tool {
  href: string;
  titleKey: string;
  descriptionKey: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

const TOOLS: readonly Tool[] = [
  { href: "/spin-the-wheel", titleKey: "decisionTools.cards.spinWheel.title", descriptionKey: "decisionTools.cards.spinWheel.description", Icon: ChartIcon },
  { href: "/coin-flip", titleKey: "decisionTools.cards.coinFlip.title", descriptionKey: "decisionTools.cards.coinFlip.description", Icon: DollarIcon },
  { href: "/dice-roller", titleKey: "decisionTools.cards.diceRoller.title", descriptionKey: "decisionTools.cards.diceRoller.description", Icon: FilmIcon },
  { href: "/random-number-generator", titleKey: "decisionTools.cards.randomNumber.title", descriptionKey: "decisionTools.cards.randomNumber.description", Icon: TrendingUpIcon },
  { href: "/random-name-picker", titleKey: "decisionTools.cards.namePicker.title", descriptionKey: "decisionTools.cards.namePicker.description", Icon: ShareIcon },
  { href: "/yes-no-picker-wheel", titleKey: "decisionTools.cards.yesNo.title", descriptionKey: "decisionTools.cards.yesNo.description", Icon: ChartIcon },
  { href: "/random-team-generator", titleKey: "decisionTools.cards.teamGenerator.title", descriptionKey: "decisionTools.cards.teamGenerator.description", Icon: ShareIcon },
];

/**
 * Decision Tools section for the homepage.
 * Showcases all randomness/decision-making utilities in a responsive grid.
 */
export function DecisionTools() {
  const t = useTranslations();

  return (
    <section id="decision-tools" aria-labelledby="decision-tools-title" className="scroll-mt-20">
      <div className="mb-8 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          {t("decisionTools.eyebrow")}
        </p>
        <h2
          id="decision-tools-title"
          className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          {t("decisionTools.title")}
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl">
          {t("decisionTools.subtitle")}
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TOOLS.map(({ href, titleKey, descriptionKey, Icon }) => (
          <li key={href}>
            <Link
              href={href as never}
              className="group card flex h-full flex-col gap-3 p-5 transition duration-200 hover:-translate-y-1 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500/15 to-brand-500/15 text-accent-700 dark:text-accent-200">
                <Icon width={20} height={20} />
              </span>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t(titleKey)}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                {t(descriptionKey)}
              </p>
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
