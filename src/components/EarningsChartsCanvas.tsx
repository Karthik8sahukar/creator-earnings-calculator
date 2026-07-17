"use client";

/**
 * Recharts canvas. Kept in a dedicated module so the surrounding
 * wrapper (`EarningsCharts.tsx`) can `next/dynamic`-load this file
 * only when the user has real numbers on-screen — that way Recharts
 * (~40 kB of JS) never enters the initial client bundle.
 *
 * Accessibility summaries live in the wrapper, not here — they must
 * be present even when the canvas is still loading.
 */

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
  otherIncome?: number;
}

const PALETTE = [
  "#7c3aed", // brand
  "#06b6d4", // accent cyan
  "#f59e0b", // amber
  "#ec4899", // pink
  "#10b981", // emerald
];

export function EarningsChartsCanvas({
  earnings,
  currency,
  otherIncome = 0,
}: Props) {
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
  const animation = !prefersReducedMotion;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-2">
          Monthly revenue by source
        </h3>
        <div
          className="h-64"
          role="img"
          aria-labelledby="chart-breakdown-summary"
        >
          <ResponsiveContainer>
            <BarChart
              data={breakdown}
              margin={{ top: 8, right: 10, bottom: 4, left: 0 }}
            >
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#475569" }}
              />
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
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-2">
          12-month cumulative projection
        </h3>
        <p className="text-xs text-slate-500 mb-2">
          Assumes constant monthly earnings — no growth assumption is baked in.
        </p>
        <div
          className="h-64"
          role="img"
          aria-labelledby="chart-projection-summary"
        >
          <ResponsiveContainer>
            <LineChart
              data={projection}
              margin={{ top: 8, right: 10, bottom: 4, left: 0 }}
            >
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
      </div>
    </div>
  );
}

export default EarningsChartsCanvas;
