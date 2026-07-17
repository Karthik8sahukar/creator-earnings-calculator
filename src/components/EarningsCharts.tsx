"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/format";
import type { EarningsResult } from "@/types/youtube";

interface Props {
  earnings: EarningsResult;
  currency: string;
  /** Extra "other" income (dollar value, already in target currency). */
  otherIncome?: number;
}

const PALETTE = [
  "#7c3aed", // brand
  "#06b6d4", // accent cyan
  "#f59e0b", // amber
  "#ec4899", // pink
  "#10b981", // emerald
];

/**
 * Two accessible charts:
 *   1. Monthly revenue by source (bar) — expected values.
 *   2. Twelve-month projection (line) — constant monthly across
 *      low / expected / high bands. We deliberately don't imply growth.
 *
 * Charts respect prefers-reduced-motion by disabling entry animation.
 * Every chart is accompanied by a text summary for screen readers.
 */
export function EarningsCharts({ earnings, currency, otherIncome = 0 }: Props) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const breakdown = useMemo(
    () => [
      { key: "ads", label: "Ads", value: earnings.monthlyAdRevenue.monthly },
      { key: "spn", label: "Sponsorships", value: earnings.extras.sponsorship },
      { key: "aff", label: "Affiliate", value: earnings.extras.affiliate },
      { key: "mem", label: "Memberships", value: earnings.extras.membership },
      { key: "oth", label: "Other", value: Math.max(otherIncome, 0) },
    ],
    [earnings, otherIncome],
  );

  const total = breakdown.reduce((acc, r) => acc + Math.max(r.value, 0), 0);

  const projection = useMemo(() => {
    // Constant monthly projection across the year — no growth assumption.
    return Array.from({ length: 12 }, (_, i) => ({
      month: `M${i + 1}`,
      low: earnings.low.monthly * (i + 1),
      expected: earnings.expected.monthly * (i + 1),
      high: earnings.high.monthly * (i + 1),
    }));
  }, [earnings]);

  const fmt = (n: number) => formatCurrency(n, currency, { compact: true });
  const fmtFull = (n: number) => formatCurrency(n, currency);
  const animation = prefersReducedMotion ? false : true;

  return (
    <section aria-labelledby="charts-title" className="card p-6 sm:p-8">
      <h2 id="charts-title" className="text-lg font-semibold text-slate-900">
        Charts
      </h2>
      <p className="text-sm text-slate-500 mt-1">
        Visual summary of the monthly breakdown and a flat 12-month
        projection using the current assumptions.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-2">
            Monthly revenue by source
          </h3>
          {total === 0 ? (
            <EmptyChart message="Enter monthly views or income to see the breakdown." />
          ) : (
            <div className="h-64" role="img" aria-labelledby="chart-breakdown-summary">
              <ResponsiveContainer>
                <BarChart data={breakdown} margin={{ top: 8, right: 10, bottom: 4, left: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#475569" }} />
                  <YAxis
                    tickFormatter={fmt}
                    tick={{ fontSize: 12, fill: "#475569" }}
                    width={56}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(124, 58, 237, 0.06)" }}
                    formatter={(value) => [fmtFull(Number(value) || 0), "Monthly"]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="value"
                    isAnimationActive={animation}
                    radius={[6, 6, 0, 0]}
                    aria-label="Monthly revenue by source"
                  >
                    {breakdown.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p id="chart-breakdown-summary" className="sr-only">
            Monthly revenue by source. {breakdown
              .map((r) => `${r.label}: ${fmtFull(r.value)}`)
              .join(", ")}. Total {fmtFull(total)}.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-2">
            12-month cumulative projection
          </h3>
          <p className="text-xs text-slate-500 mb-2">
            Assumes constant monthly earnings — no growth assumption is baked
            in.
          </p>
          {earnings.expected.monthly === 0 ? (
            <EmptyChart message="Enter monthly views or income to see the projection." />
          ) : (
            <div className="h-64" role="img" aria-labelledby="chart-projection-summary">
              <ResponsiveContainer>
                <LineChart data={projection} margin={{ top: 8, right: 10, bottom: 4, left: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#475569" }}
                  />
                  <YAxis
                    tickFormatter={fmt}
                    tick={{ fontSize: 12, fill: "#475569" }}
                    width={56}
                  />
                  <Tooltip
                    formatter={(value) => [fmtFull(Number(value) || 0), ""]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="low"
                    name="Low"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={animation}
                  />
                  <Line
                    type="monotone"
                    dataKey="expected"
                    name="Expected"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={animation}
                  />
                  <Line
                    type="monotone"
                    dataKey="high"
                    name="High"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={animation}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <p id="chart-projection-summary" className="sr-only">
            Twelve-month cumulative projection. Low
            {" "}
            {fmtFull(projection[11].low)}, expected
            {" "}
            {fmtFull(projection[11].expected)}, high
            {" "}
            {fmtFull(projection[11].high)}.
          </p>
        </div>
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
