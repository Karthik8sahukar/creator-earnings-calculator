"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useFormatMoney } from "@/components/currency";
import { TrendingUpIcon, CalendarIcon } from "@/components/icons";
import { formatCompact } from "@/lib/format";
import type { CreatorAnalytics, TimeRange } from "@/lib/analytics/types";

// ─── Types ──────────────────────────────────────────────────────────

interface Props {
  /** Creator slug for data fetching. */
  slug: string;
  /** Pre-loaded analytics (server-fetched for SSR). */
  initialData: CreatorAnalytics | null;
}

type ChartMetric = "subscribers" | "totalViews" | "monthlyEarnings" | "videoCount";

const TIME_RANGES: TimeRange[] = ["7d", "30d", "90d", "1y", "all"];
const CHART_METRICS: { key: ChartMetric; labelKey: string }[] = [
  { key: "subscribers", labelKey: "subscribers" },
  { key: "totalViews", labelKey: "totalViews" },
  { key: "monthlyEarnings", labelKey: "monthlyEarnings" },
  { key: "videoCount", labelKey: "videoCount" },
];

// ─── Component ──────────────────────────────────────────────────────

export function CreatorAnalyticsSection({ slug, initialData }: Props) {
  const t = useTranslations("creator.analytics");
  const { formatMoney } = useFormatMoney();
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(initialData);
  const [range, setRange] = useState<TimeRange>("30d");
  const [metric, setMetric] = useState<ChartMetric>("subscribers");
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(false);

  // Fetch analytics if not pre-loaded
  useEffect(() => {
    if (initialData) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/analytics/${slug}?range=all`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setAnalytics(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug, initialData]);

  // Filter snapshots by range for chart
  const filteredSnapshots = useCallback(() => {
    if (!analytics?.snapshots) return [];
    if (range === "all") return analytics.snapshots;
    const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return analytics.snapshots.filter(
      (s) => new Date(s.capturedAt).getTime() >= cutoff,
    );
  }, [analytics, range]);

  const chartData = filteredSnapshots().map((s) => ({
    date: new Date(s.capturedAt).toLocaleDateString("en", { month: "short", day: "numeric" }),
    subscribers: s.subscribers ?? 0,
    totalViews: s.totalViews,
    monthlyEarnings: s.estimatedMonthlyEarningsUsd,
    videoCount: s.videoCount,
  }));

  const hasData = analytics && analytics.snapshots.length >= 2;
  const growth30d = analytics?.growth["30d"];

  // ─── Empty state ────────────────────────────────────────────────
  if (!loading && !hasData) {
    return (
      <section aria-labelledby="analytics-title" className="card p-6 sm:p-8">
        <header className="flex items-center gap-2 mb-4">
          <TrendingUpIcon width={20} height={20} className="text-brand-600 dark:text-brand-300" />
          <h2 id="analytics-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t("title")}
          </h2>
        </header>
        <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="analytics-empty">
          {t("empty")}
        </p>
      </section>
    );
  }

  // ─── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <section aria-labelledby="analytics-title" className="card p-6 sm:p-8">
        <header className="flex items-center gap-2 mb-4">
          <TrendingUpIcon width={20} height={20} className="text-brand-600 dark:text-brand-300" />
          <h2 id="analytics-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t("title")}
          </h2>
        </header>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ─── Error state ────────────────────────────────────────────────
  if (error) {
    return (
      <section aria-labelledby="analytics-title" className="card p-6 sm:p-8">
        <header className="flex items-center gap-2 mb-4">
          <TrendingUpIcon width={20} height={20} className="text-brand-600 dark:text-brand-300" />
          <h2 id="analytics-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t("title")}
          </h2>
        </header>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("error")}
        </p>
      </section>
    );
  }

  // ─── Populated state ────────────────────────────────────────────
  return (
    <section aria-labelledby="analytics-title" className="card p-6 sm:p-8 space-y-6" data-testid="analytics-section">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUpIcon width={20} height={20} className="text-brand-600 dark:text-brand-300" />
          <h2 id="analytics-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t("title")}
          </h2>
        </div>
        {analytics?.lastUpdated && (
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <CalendarIcon width={12} height={12} />
            {t("lastUpdated", { date: new Date(analytics.lastUpdated).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) })}
          </span>
        )}
      </header>

      {/* Growth metrics strip */}
      {growth30d?.hasData && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <GrowthTile
            label={t("subGrowth30d")}
            value={growth30d.subscriberGrowth !== null ? formatCompact(growth30d.subscriberGrowth) : "—"}
            pct={growth30d.subscriberGrowthPct}
          />
          <GrowthTile
            label={t("viewGrowth30d")}
            value={formatCompact(growth30d.viewGrowth)}
            pct={growth30d.viewGrowthPct}
          />
          <GrowthTile
            label={t("earningsChange30d")}
            value={formatMoney(growth30d.earningsChange)}
            pct={growth30d.earningsChangePct}
          />
          <GrowthTile
            label={t("dailySubGain")}
            value={growth30d.avgDailySubscriberGain !== null ? formatCompact(Math.round(growth30d.avgDailySubscriberGain)) : "—"}
          />
        </div>
      )}

      {/* Time range controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">{t("range")}:</span>
        {TIME_RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition ${
              range === r
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
            aria-pressed={range === r}
            data-testid={`analytics-range-${r}`}
          >
            {r === "all" ? t("rangeAll") : r.toUpperCase()}
          </button>
        ))}

        <span className="ml-auto" />

        {/* Metric selector */}
        {CHART_METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetric(m.key)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition ${
              metric === m.key
                ? "bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-200"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
            aria-pressed={metric === m.key}
          >
            {t(`metrics.${m.labelKey}`)}
          </button>
        ))}
      </div>

      {/* Chart */}
      {chartData.length >= 2 ? (
        <div className="h-64 sm:h-72" data-testid="analytics-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="analytics-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(124 58 237)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="rgb(124 58 237)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                className="text-slate-500 dark:text-slate-400"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-slate-500 dark:text-slate-400"
                tickFormatter={(v) => metric === "monthlyEarnings" ? `$${formatCompact(v)}` : formatCompact(v)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const val = payload[0].value as number;
                  return (
                    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 shadow-lg text-xs">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {metric === "monthlyEarnings" ? formatMoney(val) : formatCompact(val)}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {payload[0].payload.date}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke="rgb(124 58 237)"
                strokeWidth={2}
                fill="url(#analytics-gradient)"
                dot={chartData.length <= 30}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
          {t("insufficientData")}
        </div>
      )}

      {/* Multi-period growth table */}
      {analytics && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                <th className="py-2 text-left font-medium">{t("period")}</th>
                <th className="py-2 text-right font-medium">{t("subChange")}</th>
                <th className="py-2 text-right font-medium">{t("viewChange")}</th>
                <th className="py-2 text-right font-medium">{t("uploads")}</th>
                <th className="py-2 text-right font-medium">{t("earningsChange")}</th>
              </tr>
            </thead>
            <tbody>
              {(["7d", "30d", "90d", "1y"] as const).map((period) => {
                const g = analytics.growth[period];
                return (
                  <tr key={period} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 font-medium text-slate-700 dark:text-slate-300">{period.toUpperCase()}</td>
                    <td className="py-2 text-right">
                      {g.hasData && g.subscriberGrowth !== null ? (
                        <GrowthValue value={g.subscriberGrowth} pct={g.subscriberGrowthPct} />
                      ) : "—"}
                    </td>
                    <td className="py-2 text-right">
                      {g.hasData ? <GrowthValue value={g.viewGrowth} pct={g.viewGrowthPct} /> : "—"}
                    </td>
                    <td className="py-2 text-right text-slate-600 dark:text-slate-400">
                      {g.hasData ? `+${g.uploadGrowth}` : "—"}
                    </td>
                    <td className="py-2 text-right">
                      {g.hasData ? <GrowthValue value={g.earningsChange} pct={g.earningsChangePct} isMoney /> : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        {t("disclaimer")}
      </p>
    </section>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function GrowthTile({ label, value, pct }: { label: string; value: string; pct?: number | null }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</p>
        {pct !== undefined && pct !== null && (
          <span className={`text-xs font-medium ${pct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function GrowthValue({ value, pct, isMoney }: { value: number; pct?: number | null; isMoney?: boolean }) {
  const formatted = isMoney ? `$${formatCompact(Math.abs(value))}` : formatCompact(Math.abs(value));
  const sign = value >= 0 ? "+" : "−";
  const color = value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";

  return (
    <span className={color}>
      {sign}{formatted}
      {pct !== undefined && pct !== null && (
        <span className="ml-1 text-[10px] opacity-75">({pct >= 0 ? "+" : ""}{pct.toFixed(1)}%)</span>
      )}
    </span>
  );
}
