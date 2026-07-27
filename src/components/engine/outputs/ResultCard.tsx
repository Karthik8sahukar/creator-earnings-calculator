"use client";

interface Props {
  /** Card title/label (e.g. "Estimated Monthly Revenue"). */
  label: string;
  /** Primary value to display (e.g. "$5,000"). */
  value: string | number;
  /** Secondary description or context below the value. */
  description?: string;
  /** Visual variant. Default: "default". */
  variant?: "default" | "success" | "warning" | "info" | "highlight";
  /** Icon or emoji rendered before the label. */
  icon?: React.ReactNode;
  /** Additional className for the container. */
  className?: string;
  /** Children rendered below the value (e.g. sub-metrics). */
  children?: React.ReactNode;
}

const variantStyles = {
  default: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700",
  success: "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-800",
  warning: "bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-800",
  info: "bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-800",
  highlight: "bg-brand-50 dark:bg-brand-500/5 border-brand-200 dark:border-brand-800",
} as const;

const valueStyles = {
  default: "text-slate-900 dark:text-slate-100",
  success: "text-emerald-700 dark:text-emerald-300",
  warning: "text-amber-700 dark:text-amber-300",
  info: "text-blue-700 dark:text-blue-300",
  highlight: "text-brand-700 dark:text-brand-300",
} as const;

/**
 * ResultCard — Displays a single computed result in a styled card.
 *
 * Usage:
 *   <ResultCard label="Monthly Revenue" value="$5,000" variant="success" />
 *   <ResultCard label="RPM" value="$5.00" description="Revenue per 1,000 views">
 *     <p>Based on 100K views</p>
 *   </ResultCard>
 */
export function ResultCard({
  label,
  value,
  description,
  variant = "default",
  icon,
  className = "",
  children,
}: Props) {
  return (
    <div
      className={`rounded-2xl border p-5 space-y-2 ${variantStyles[variant]} ${className}`}
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        {icon && <span className="shrink-0">{icon}</span>}
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {label}
        </p>
      </div>

      <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${valueStyles[variant]}`}>
        {value}
      </p>

      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}

      {children}
    </div>
  );
}
