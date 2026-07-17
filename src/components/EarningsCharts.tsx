"use client";

/**
 * Lightweight wrapper around the Recharts canvas.
 *
 * We deliberately DO NOT import Recharts at the module top level. It
 * lives in `EarningsChartsCanvas` and is loaded via `next/dynamic`
 * (client-only) only after the wrapper mounts AND has real data.
 *
 * A screen-reader-accessible text summary is rendered synchronously,
 * so users on assistive tech never depend on the chart canvas loading.
 */

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { formatCurrency } from "@/lib/format";
import type { EarningsResult } from "@/types/youtube";

interface Props {
  earnings: EarningsResult;
  currency: string;
  /** Extra "other" income (dollar value, already in target currency). */
  otherIncome?: number;
}

/**
 * Recharts is client-only. `ssr: false` avoids the ~40 kB chart module
 * from entering the server-rendered HTML or the initial hydration
 * bundle for the channel page.
 */
const EarningsChartsCanvas = dynamic(
  () =>
    import("./EarningsChartsCanvas").then((m) => ({
      default: m.EarningsChartsCanvas,
    })),
  {
    ssr: false,
    loading: () => <ChartsSkeleton />,
  },
);

export function EarningsCharts({ earnings, currency, otherIncome = 0 }: Props) {
  const breakdown = useMemo(
    () => [
      { label: "Ads", value: earnings.monthlyAdRevenue.monthly },
      { label: "Sponsorships", value: earnings.extras.sponsorship },
      { label: "Affiliate", value: earnings.extras.affiliate },
      { label: "Memberships", value: earnings.extras.membership },
      { label: "Other", value: Math.max(otherIncome, 0) },
    ],
    [earnings, otherIncome],
  );

  const total = breakdown.reduce((acc, r) => acc + Math.max(r.value, 0), 0);
  const hasProjection = earnings.expected.monthly > 0;
  const hasAnyData = total > 0 || hasProjection;

  const fmt = (n: number) => formatCurrency(n, currency);

  return (
    <section aria-labelledby="charts-title" className="card p-6 sm:p-8">
      <h2 id="charts-title" className="text-lg font-semibold text-slate-900">
        Charts
      </h2>
      <p className="text-sm text-slate-500 mt-1">
        Visual summary of the monthly breakdown and a flat 12-month projection
        using the current assumptions.
      </p>

      {/*
        SR summaries are always in the DOM — they must be present even
        when the visual canvas hasn't loaded yet.
      */}
      <p id="chart-breakdown-summary" className="sr-only">
        Monthly revenue by source.{" "}
        {breakdown.map((r) => `${r.label}: ${fmt(r.value)}`).join(", ")}. Total{" "}
        {fmt(total)}.
      </p>
      <p id="chart-projection-summary" className="sr-only">
        Twelve-month cumulative projection. Low {fmt(earnings.low.monthly * 12)},
        expected {fmt(earnings.expected.monthly * 12)}, high{" "}
        {fmt(earnings.high.monthly * 12)}.
      </p>

      <div className="mt-6">
        {hasAnyData ? (
          <EarningsChartsCanvas
            earnings={earnings}
            currency={currency}
            otherIncome={otherIncome}
          />
        ) : (
          <EmptyChart message="Enter monthly views or income to see charts." />
        )}
      </div>
    </section>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="h-64 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-500 px-6 text-center"
    >
      {message}
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div
      className="grid gap-8 lg:grid-cols-2"
      aria-hidden
      data-testid="charts-loading"
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
