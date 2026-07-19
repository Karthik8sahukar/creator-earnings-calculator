import type { ReactNode } from "react";

/**
 * Channel Analyzer — single performance metric tile.
 *
 * Small, composable stat card used by `PerformanceGrid`. Deliberately
 * a plain server component so we can pass icon nodes and optional
 * badges directly from the grid without prop-drilling translation
 * keys.
 *
 * Shape:
 *
 *   ┌───────────────────────────────────────┐
 *   │  [icon]  LABEL              [badge?]  │
 *   │                                       │
 *   │  BIG-VALUE                            │
 *   │  optional caption                     │
 *   └───────────────────────────────────────┘
 *
 * Every tile marks numbers as estimates via the "Estimated" prefix
 * added by the caller (via the `label` prop) so users cannot mistake
 * them for authoritative YouTube figures.
 */
export interface PerformanceCardProps {
  label: string;
  value: string;
  caption?: string;
  icon?: ReactNode;
  /** Right-aligned pill / chip content. */
  badge?: ReactNode;
  /** Emphasize the tile — used for the primary revenue tiles. */
  emphasized?: boolean;
  /** Optional native tooltip on the value for extra transparency. */
  title?: string;
}

export function PerformanceCard({
  label,
  value,
  caption,
  icon,
  badge,
  emphasized,
  title,
}: PerformanceCardProps) {
  const wrapperClass = emphasized
    ? "rounded-xl border border-brand-500/50 bg-gradient-to-br from-brand-500 to-brand-600 p-5 text-white shadow-card"
    : "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5";

  const labelClass = emphasized
    ? "text-xs uppercase tracking-wide text-brand-100"
    : "text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400";

  const valueClass = emphasized
    ? "mt-2 text-2xl font-bold"
    : "mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100";

  const captionClass = emphasized
    ? "mt-1 text-xs text-brand-100/90"
    : "mt-1 text-xs text-slate-500 dark:text-slate-400";

  return (
    <article className={wrapperClass}>
      <div className="flex items-center gap-2">
        {icon && (
          <span
            className={
              emphasized
                ? "text-white/80"
                : "text-brand-600 dark:text-brand-300"
            }
            aria-hidden
          >
            {icon}
          </span>
        )}
        <p className={labelClass}>{label}</p>
        {badge && <span className="ml-auto">{badge}</span>}
      </div>
      <p className={valueClass} title={title}>
        {value}
      </p>
      {caption && <p className={captionClass}>{caption}</p>}
    </article>
  );
}
