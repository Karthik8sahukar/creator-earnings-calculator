"use client";

/**
 * Instagram earnings breakdown chart — thin wrapper that lazy-loads
 * Recharts and renders a screen-reader summary synchronously.
 *
 * Follows the same pattern as `EarningsCharts.tsx` for the YouTube
 * calculator so Recharts (~40 kB) never enters the initial bundle
 * for users who never see this section.
 */

import dynamic from "next/dynamic";

import { formatCurrency } from "@/lib/format";
import type { EarningsLine } from "@/lib/instagram/earnings";

interface Props {
  breakdown: readonly EarningsLine[];
  currency: string;
  /** Localized labels keyed by breakdown.key. */
  labels: Record<string, string>;
  /** i18n heading + supporting copy. */
  title: string;
  subtitle: string;
  totalLabel: string;
  emptyLabel: string;
}

const InstagramBreakdownChartCanvas = dynamic(
  () =>
    import("./InstagramBreakdownChartCanvas").then((m) => ({
      default: m.InstagramBreakdownChartCanvas,
    })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

export function InstagramBreakdownChart({
  breakdown,
  currency,
  labels,
  title,
  subtitle,
  totalLabel,
  emptyLabel,
}: Props) {
  const total = breakdown.reduce(
    (sum, line) => sum + Math.max(line.amount, 0),
    0,
  );
  const hasData = total > 0;

  return (
    <section
      aria-labelledby="ig-chart-title"
      className="card p-6 sm:p-8"
      data-testid="instagram-breakdown-chart"
    >
      <h2
        id="ig-chart-title"
        className="text-lg font-semibold text-slate-900 dark:text-slate-100"
      >
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {subtitle}
      </p>

      {/* SR summary — present regardless of whether the canvas has
          loaded yet. Screen-reader users get the data even during
          the lazy-load window. */}
      <p id="ig-chart-summary" className="sr-only">
        {totalLabel}: {formatCurrency(total, currency)}.{" "}
        {breakdown
          .filter((line) => line.amount > 0)
          .map(
            (line) =>
              `${labels[line.key] ?? line.key}: ${formatCurrency(
                line.amount,
                currency,
              )} (${Math.round(line.share * 100)}%)`,
          )
          .join(", ")}
      </p>

      <div className="mt-6">
        {hasData ? (
          <InstagramBreakdownChartCanvas
            breakdown={breakdown}
            currency={currency}
            labels={labels}
          />
        ) : (
          <div
            role="status"
            className="h-64 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-500 px-6 text-center dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400"
          >
            {emptyLabel}
          </div>
        )}
      </div>
    </section>
  );
}

function ChartSkeleton() {
  return (
    <div
      className="grid gap-8 lg:grid-cols-2"
      aria-hidden
      data-testid="ig-chart-loading"
    >
      <div className="space-y-2">
        <div className="skeleton h-4 w-1/3" />
        <div className="skeleton h-64 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="skeleton h-4 w-1/3" />
        <div className="skeleton h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
