"use client";

interface Props {
  label: string;
  value: string;
  variant?: "primary" | "neutral";
}

/**
 * Large result display card for decision tool outcomes.
 */
export function ResultCard({ label, value, variant = "primary" }: Props) {
  const isPrimary = variant === "primary";
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`rounded-xl p-6 text-center ${
        isPrimary
          ? "bg-gradient-to-br from-brand-600 to-brand-800 text-white"
          : "border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
      }`}
    >
      <p className={`text-sm uppercase tracking-wide ${isPrimary ? "text-brand-100" : "text-slate-500 dark:text-slate-400"}`}>
        {label}
      </p>
      <p className={`mt-1 text-3xl sm:text-4xl font-bold ${isPrimary ? "" : "text-slate-900 dark:text-slate-100"}`}>
        {value}
      </p>
    </div>
  );
}
