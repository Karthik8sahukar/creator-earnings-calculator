"use client";

interface Props {
  /** The primary result value (e.g. "$5.00"). */
  value: string | number;
  /** Label above the value (e.g. "Your RPM"). */
  label?: string;
  /** Sub-text below the value. */
  subtitle?: string;
  /** Size variant. Default: "md". */
  size?: "sm" | "md" | "lg";
  /** Additional className. */
  className?: string;
}

const sizeStyles = {
  sm: "text-xl sm:text-2xl",
  md: "text-3xl sm:text-4xl",
  lg: "text-4xl sm:text-5xl",
} as const;

/**
 * ResultHighlight — A prominent single-value display for the
 * primary calculation result. Designed to be the visual focal point.
 *
 * Usage:
 *   <ResultHighlight label="Your RPM" value="$5.00" subtitle="Revenue per 1,000 views" />
 */
export function ResultHighlight({
  value,
  label,
  subtitle,
  size = "md",
  className = "",
}: Props) {
  return (
    <div
      className={`text-center space-y-1 ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {label && (
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </p>
      )}
      <p className={`${sizeStyles[size]} font-bold tracking-tight text-brand-700 dark:text-brand-300`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
