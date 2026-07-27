import { useT } from "@/lib/t";

import Link from "next/link";
import { ChartIcon, DollarIcon, FilmIcon, ShareIcon, TrendingUpIcon } from "../icons";

// ─── Decision Tools (no creator analytics here) ─────────────────────

interface Tool {
  href: string;
  titleKey: string;
  descriptionKey: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

const BADGE_DECISION = "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";

const TOOLS: readonly Tool[] = [
  { href: "/spin-the-wheel", titleKey: "decisionTools.cards.spinWheel.title", descriptionKey: "decisionTools.cards.spinWheel.description", Icon: ChartIcon },
  { href: "/coin-flip", titleKey: "decisionTools.cards.coinFlip.title", descriptionKey: "decisionTools.cards.coinFlip.description", Icon: DollarIcon },
  { href: "/dice-roller", titleKey: "decisionTools.cards.diceRoller.title", descriptionKey: "decisionTools.cards.diceRoller.description", Icon: FilmIcon },
  { href: "/random-number-generator", titleKey: "decisionTools.cards.randomNumber.title", descriptionKey: "decisionTools.cards.randomNumber.description", Icon: TrendingUpIcon },
  { href: "/random-name-picker", titleKey: "decisionTools.cards.namePicker.title", descriptionKey: "decisionTools.cards.namePicker.description", Icon: ShareIcon },
  { href: "/yes-no-picker-wheel", titleKey: "decisionTools.cards.yesNo.title", descriptionKey: "decisionTools.cards.yesNo.description", Icon: ChartIcon },
  { href: "/random-team-generator", titleKey: "decisionTools.cards.teamGenerator.title", descriptionKey: "decisionTools.cards.teamGenerator.description", Icon: ShareIcon },
  { href: "/character-counter", titleKey: "decisionTools.cards.characterCounter.title", descriptionKey: "decisionTools.cards.characterCounter.description", Icon: TrendingUpIcon },
  { href: "/word-counter", titleKey: "decisionTools.cards.wordCounter.title", descriptionKey: "decisionTools.cards.wordCounter.description", Icon: TrendingUpIcon },
  { href: "/random-color-generator", titleKey: "decisionTools.cards.colorGenerator.title", descriptionKey: "decisionTools.cards.colorGenerator.description", Icon: ChartIcon },
  { href: "/truth-or-dare-generator", titleKey: "decisionTools.cards.truthOrDare.title", descriptionKey: "decisionTools.cards.truthOrDare.description", Icon: FilmIcon },
];

/**
 * Decision Tools section for the homepage.
 * Only randomness/decision utilities — no creator analytics.
 */
export function DecisionTools() {
  const t = useT();

  return (
    <section id="decision-tools" aria-labelledby="decision-tools-title" className="scroll-mt-20">
      <div className="mb-10 text-center sm:text-left">
        <h2
          id="decision-tools-title"
          className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          {t("decisionTools.title")}
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          {t("decisionTools.subtitle")}
        </p>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TOOLS.map(({ href, titleKey, descriptionKey, Icon }) => (
          <li key={href}>
            <Link
              href={href as never}
              className="group card flex h-full flex-col gap-4 p-5 transition duration-200 hover:-translate-y-1 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/15 to-accent-500/15 text-purple-700 dark:text-purple-200">
                  <Icon width={18} height={18} />
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${BADGE_DECISION}`}>
                  {t("decisionTools.badge")}
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

              <span className="inline-flex items-center gap-1 text-sm font-medium text-purple-700 dark:text-purple-300">
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
