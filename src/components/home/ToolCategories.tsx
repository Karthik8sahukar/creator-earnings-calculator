import Link from "next/link";
import { ChartIcon, DollarIcon, FilmIcon } from "../icons";

/**
 * Three large category cards — main navigation area for the homepage.
 */

interface CategoryCard {
  href: string;
  title: string;
  description: string;
  tools: string[];
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
  gradient: string;
}

const CATEGORIES: CategoryCard[] = [
  {
    href: "/#find-channel",
    title: "Creator Analytics",
    description: "Estimate revenue, analyze performance, and benchmark creator channels across platforms.",
    tools: ["Revenue Calculator", "RPM", "CPM", "Engagement", "Sponsorship"],
    Icon: ChartIcon,
    gradient: "from-brand-500/10 to-brand-600/5",
  },
  {
    href: "/developer-tools",
    title: "Developer Tools",
    description: "Browser-based utilities for everyday development. No data leaves your device.",
    tools: ["JSON Formatter", "JWT Decoder", "Regex Tester", "UUID", "Base64"],
    Icon: DollarIcon,
    gradient: "from-accent-500/10 to-accent-600/5",
  },
  {
    href: "/spin-the-wheel",
    title: "Decision Tools",
    description: "Random generators and decision makers for games, classrooms, and quick choices.",
    tools: ["Spin Wheel", "Dice Roller", "Coin Flip", "Random Team", "Name Picker"],
    Icon: FilmIcon,
    gradient: "from-purple-500/10 to-purple-600/5",
  },
];

export function ToolCategories() {
  return (
    <section id="tools" aria-labelledby="categories-title" className="scroll-mt-20">
      <div className="text-center mb-10">
        <h2 id="categories-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Everything You Need
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
          Three tool suites built for creators, developers, and teams.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {CATEGORIES.map(({ href, title, description, tools, Icon, gradient }) => (
          <Link
            key={title}
            href={href as never}
            className={`group card p-8 flex flex-col gap-5 bg-gradient-to-br ${gradient} transition-all duration-200 hover:-translate-y-1 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60`}
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200/60 text-brand-600 dark:bg-slate-800 dark:border-slate-700 dark:text-brand-300">
              <Icon width={22} height={22} />
            </span>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-auto">
              {tools.map((tool) => (
                <span key={tool} className="chip text-[11px]">{tool}</span>
              ))}
            </div>

            <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-300 mt-2">
              Explore
              <span aria-hidden className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
