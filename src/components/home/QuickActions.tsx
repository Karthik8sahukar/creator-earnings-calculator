import Link from "next/link";
import { ChartIcon, DollarIcon, FilmIcon, ShareIcon, TrendingUpIcon } from "../icons";

/**
 * Quick Actions — most-clicked tools displayed prominently.
 */

interface QuickAction {
  href: string;
  title: string;
  description: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

const ACTIONS: QuickAction[] = [
  { href: "/#find-channel", title: "YouTube Calculator", description: "Estimate channel revenue", Icon: DollarIcon },
  { href: "/json-formatter", title: "JSON Formatter", description: "Beautify & validate JSON", Icon: ChartIcon },
  { href: "/spin-the-wheel", title: "Spin the Wheel", description: "Random decision spinner", Icon: FilmIcon },
  { href: "/jwt-decoder", title: "JWT Decoder", description: "Decode tokens locally", Icon: TrendingUpIcon },
  { href: "/uuid-generator", title: "UUID Generator", description: "Secure UUID v4", Icon: ShareIcon },
  { href: "/random-number-generator", title: "Random Number", description: "Generate in any range", Icon: ChartIcon },
];

export function QuickActions() {
  return (
    <section aria-labelledby="quick-title" className="scroll-mt-20">
      <div className="mb-8">
        <h2 id="quick-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Popular Today
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Jump straight into the most-used tools.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {ACTIONS.map(({ href, title, description, Icon }) => (
          <Link
            key={title}
            href={href as never}
            className="group card p-5 flex flex-col items-center text-center gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/10 to-accent-500/10 text-brand-600 dark:text-brand-300">
              <Icon width={20} height={20} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
