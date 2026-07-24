"use client";

import { useMemo, useState } from "react";
import { calculateChannelValuation } from "@/lib/calculators";
import { useFormatMoney } from "@/components/currency";

export function ValuationCalcClient() {
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(5000);
  const [subscribers, setSubscribers] = useState<number>(500000);
  const [monthlyViews, setMonthlyViews] = useState<number>(2000000);
  const [growthRate, setGrowthRate] = useState<number>(3);
  const { formatMoney } = useFormatMoney();

  const result = useMemo(
    () => calculateChannelValuation({ monthlyRevenue, subscribers, monthlyViews, growthRate, niche: "general" }),
    [monthlyRevenue, subscribers, monthlyViews, growthRate],
  );

  return (
    <section className="card p-6 sm:p-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="label">Monthly revenue (USD)</span>
          <input type="number" inputMode="numeric" min={0} value={monthlyRevenue || ""} onChange={(e) => setMonthlyRevenue(Number(e.target.value) || 0)} className="input mt-1" />
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">All sources combined</span>
        </label>
        <label className="block">
          <span className="label">Subscribers</span>
          <input type="number" inputMode="numeric" min={0} value={subscribers || ""} onChange={(e) => setSubscribers(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">Monthly views</span>
          <input type="number" inputMode="numeric" min={0} value={monthlyViews || ""} onChange={(e) => setMonthlyViews(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">Monthly growth rate (%)</span>
          <input type="number" inputMode="decimal" min={-50} max={100} step={0.5} value={growthRate} onChange={(e) => setGrowthRate(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
      </div>

      {/* Results */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ResultCard label="Conservative valuation" value={result.valid ? formatMoney(result.lowValuation) : "—"} />
        <ResultCard label="Expected valuation" value={result.valid ? formatMoney(result.expectedValuation) : "—"} highlight />
        <ResultCard label="Optimistic valuation" value={result.valid ? formatMoney(result.highValuation) : "—"} />
      </div>

      {result.valid && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Revenue multiple</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{result.revenueMultiple.toFixed(1)}×</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">annual revenue</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Annual revenue</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{formatMoney(monthlyRevenue * 12)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">base for valuation</p>
          </div>
        </div>
      )}

      {!result.valid && result.reason && (
        <p className="text-sm text-red-600 dark:text-red-400">{result.reason}</p>
      )}

      <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
        <strong className="text-slate-900 dark:text-slate-100">Formula:</strong>{" "}
        <code className="font-mono">Valuation = annual_revenue × multiple (adjusted for growth + size)</code>
      </div>
    </section>
  );
}

function ResultCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-5 ${highlight ? "bg-gradient-to-br from-brand-600 to-brand-800 text-white" : "border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"}`}>
      <p className={`text-xs uppercase tracking-wide ${highlight ? "text-brand-100" : "text-slate-500 dark:text-slate-400"}`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? "" : "text-slate-900 dark:text-slate-100"}`}>{value}</p>
    </div>
  );
}
