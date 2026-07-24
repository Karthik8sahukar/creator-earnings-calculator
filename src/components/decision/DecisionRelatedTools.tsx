import { Link } from "@/i18n/navigation";
import {
  ChartIcon,
  DollarIcon,
  FilmIcon,
  ShareIcon,
  TrendingUpIcon,
} from "../icons";

// ─── Single shared data source for all Decision Tools ───────────────

export interface DecisionToolDef {
  href: string;
  title: string;
  description: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

/**
 * Canonical list of all Decision Tools.
 * To add a new tool, add one object here — all related-tools sections
 * across the platform will automatically include it.
 */
export const ALL_DECISION_TOOLS: readonly DecisionToolDef[] = [
  {
    href: "/spin-the-wheel",
    title: "Spin the Wheel",
    description: "Create a customizable spinning wheel with unlimited options.",
    Icon: ChartIcon,
  },
  {
    href: "/coin-flip",
    title: "Coin Flip",
    description: "Flip a virtual coin for quick and unbiased decisions.",
    Icon: DollarIcon,
  },
  {
    href: "/dice-roller",
    title: "Dice Roller",
    description: "Roll one or more virtual dice for games, classrooms and tabletop RPGs.",
    Icon: FilmIcon,
  },
  {
    href: "/random-number-generator",
    title: "Random Number Generator",
    description: "Generate random numbers instantly within any custom range.",
    Icon: TrendingUpIcon,
  },
  {
    href: "/random-name-picker",
    title: "Random Name Picker",
    description: "Pick a random winner from a list of names.",
    Icon: ShareIcon,
  },
  {
    href: "/yes-no-picker-wheel",
    title: "Yes / No Picker Wheel",
    description: "Spin a wheel to get a random Yes or No answer.",
    Icon: ChartIcon,
  },
  {
    href: "/random-team-generator",
    title: "Random Team Generator",
    description: "Split names into balanced random teams instantly.",
    Icon: ShareIcon,
  },
];

// ─── Component ──────────────────────────────────────────────────────

interface Props {
  /** The href of the current tool page (will be excluded from the grid). */
  currentTool: string;
}

/**
 * Related Decision Tools grid — automatically displays all tools
 * except the current one. Placed below the main tool, above the FAQ.
 *
 * Responsive grid: 1 col (mobile) → 2 cols (tablet) → 3 cols (desktop).
 */
export function DecisionRelatedTools({ currentTool }: Props) {
  const tools = ALL_DECISION_TOOLS.filter((t) => t.href !== currentTool);

  return (
    <section aria-labelledby="related-tools-title" className="space-y-5">
      <div>
        <h2
          id="related-tools-title"
          className="text-xl font-semibold text-slate-900 dark:text-slate-100"
        >
          Try More Decision Tools
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Explore more free tools for random choices, games, classrooms and team activities.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(({ href, title, description, Icon }) => (
          <li key={href}>
            <Link
              href={href as never}
              className="group card flex h-full flex-col gap-3 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/15 to-accent-500/15 text-purple-700 dark:text-purple-200">
                  <Icon width={16} height={16} />
                </span>
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  Decision Tool
                </span>
              </div>

              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                {description}
              </p>

              <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 dark:text-purple-300">
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
