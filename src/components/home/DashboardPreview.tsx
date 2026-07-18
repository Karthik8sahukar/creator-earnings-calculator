import {
  ChartIcon,
  DollarIcon,
  EyeIcon,
  TrendingUpIcon,
  UsersIcon,
} from "../icons";

interface Stat {
  label: string;
  value: string;
  delta?: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

const STATS: readonly Stat[] = [
  { label: "Subscribers", value: "1.2M", delta: "+2.4%", Icon: UsersIcon },
  { label: "Monthly Views", value: "8.5M", delta: "+11.3%", Icon: EyeIcon },
  { label: "Estimated Revenue", value: "$12,800", delta: "+7.1%", Icon: DollarIcon },
  { label: "RPM", value: "$2.65", delta: "+0.4%", Icon: TrendingUpIcon },
] as const;

/**
 * Illustrative analytics preview card shown next to the hero on
 * `lg+` screens. Every number here is a static example — it is NOT
 * derived from any live channel, is `aria-hidden` from assistive tech,
 * and carries a visible "Illustrative preview" label so a sighted
 * reader can never mistake it for real data.
 *
 * These figures MUST NOT appear in metadata or structured data.
 */
export function DashboardPreview() {
  return (
    <aside
      aria-hidden="true"
      className="card p-5 relative overflow-hidden animate-fade-in"
    >
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-400/10" />
      <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-accent-500/10 blur-3xl dark:bg-accent-400/10" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
              <ChartIcon width={16} height={16} />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Channel snapshot
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Sample creator
              </p>
            </div>
          </div>
          <span className="chip">Illustrative preview</span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800/70 dark:bg-slate-900/50"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <dt className="text-[11px] font-medium uppercase tracking-wider">
                  {s.label}
                </dt>
                <s.Icon width={14} height={14} />
              </div>
              <dd className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {s.value}
                </span>
                {s.delta && (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    {s.delta}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Views · last 6 months
          </p>
          <SparkBars />
        </div>

        <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-500">
          Example estimate — actual figures are calculated from a real
          channel once you search above.
        </p>
      </div>
    </aside>
  );
}

/** Static, decorative bar chart. No dependency on recharts on the homepage. */
function SparkBars() {
  const bars = [42, 55, 48, 68, 74, 82]; // arbitrary example, in % of max
  return (
    <svg
      role="presentation"
      viewBox="0 0 120 40"
      className="mt-1 h-16 w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="dp-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="rgb(124 58 237)" stopOpacity="0.9" />
          <stop offset="1" stopColor="rgb(6 182 212)" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {bars.map((v, i) => {
        const w = 120 / bars.length - 4;
        const h = (v / 100) * 36;
        const x = i * (120 / bars.length) + 2;
        const y = 40 - h - 2;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={w}
            height={h}
            rx={2}
            fill="url(#dp-grad)"
          />
        );
      })}
    </svg>
  );
}
