"use client";

/**
 * Recharts canvas for the Instagram breakdown chart. Loaded via
 * `next/dynamic({ ssr: false })` from the wrapper so this module
 * (and Recharts itself) never enters the initial client bundle.
 *
 * Renders two views side-by-side on wide screens:
 *   • Percentage-share pie
 *   • Absolute-amount bar
 *
 * On narrow viewports they stack.
 */

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/format";
import type { EarningsLine } from "@/lib/instagram/earnings";

interface Props {
  breakdown: readonly EarningsLine[];
  currency: string;
  labels: Record<string, string>;
}

const PALETTE = [
  "#7c3aed", // brand
  "#06b6d4", // accent cyan
  "#f59e0b", // amber
  "#ec4899", // pink
  "#10b981", // emerald
];

export function InstagramBreakdownChartCanvas({
  breakdown,
  currency,
  labels,
}: Props) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const data = useMemo(
    () =>
      breakdown
        .filter((line) => line.amount > 0)
        .map((line) => ({
          key: line.key,
          label: labels[line.key] ?? line.key,
          value: Math.max(line.amount, 0),
          share: line.share,
        })),
    [breakdown, labels],
  );

  const fmt = (n: number) => formatCurrency(n, currency, { compact: true });
  const fmtFull = (n: number) => formatCurrency(n, currency);
  const animation = !prefersReducedMotion;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Share of monthly revenue
        </h3>
        <div
          className="h-64"
          role="img"
          aria-labelledby="ig-chart-summary"
        >
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                innerRadius="55%"
                paddingAngle={2}
                isAnimationActive={animation}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, entry) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const payload = (entry as any)?.payload ?? {};
                  const share = payload.share ?? 0;
                  return [
                    `${fmtFull(Number(value) || 0)} (${Math.round(share * 100)}%)`,
                    payload.label ?? "",
                  ];
                }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Monthly revenue by source
        </h3>
        <div
          className="h-64"
          role="img"
          aria-labelledby="ig-chart-summary"
        >
          <ResponsiveContainer>
            <BarChart
              data={data}
              margin={{ top: 8, right: 10, bottom: 4, left: 0 }}
            >
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#475569" }}
              />
              <YAxis
                tickFormatter={fmt}
                tick={{ fontSize: 12, fill: "#475569" }}
                width={64}
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
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default InstagramBreakdownChartCanvas;
