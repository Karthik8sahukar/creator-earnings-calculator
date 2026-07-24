"use client";

import { useMemo, useState } from "react";
import { calculateAdSenseRevenue } from "@/lib/calculators";
import { formatCurrency } from "@/lib/format";

export function AdSenseCalcClient() {
  const [monthlyViews, setMonthlyViews] = useState<number>(500000);
  const [rpm, setRpm] = useState<number>(4);
  const [monetizedPct, setMonetizedPct] = useState<number>(90);

  const result = useMemo(
    () => calculateAdSenseRevenue({ monthlyViews, rpm, monetizedPercentage: monetizedPct }),
    [monthlyViews, rpm, monetizedPct],
  );

  return (
    <section className="card p-6 sm:p-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="label">Monthly views</span>
          <input type="number" inputMode="numeric" min={0} value={monthlyViews || ""} onChange={(e) => setMonthlyViews(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">RPM (USD per 1,000 views)</span>
          <input type="number" inputMode="decimal" min={0} step={0.01} value={rpm || ""} onChange={(e) => setRpm(Number(e.target.value) || 0)} className="input mt-1" />
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">From YouTube Studio</span>
        </label>
        <label className="block">
          <span className="label">Monetized views (%)</span>
          <input type="number" inputMode="numeric" min={0} max={100} step={1} value={monetizedPct || ""} onChange={(e) => setMonetizedPct(Number(e.target.value) || 0)} className="input mt-1" />
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Default: 90% (industry typical)</span>
        </label>
      </div>

      {/* Results */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ResultCard label="Daily" value={result.valid ? formatCurrency(result.dailyRevenue, "USD") : "—"} />
        <ResultCard label="Weekly" value={result.valid ? formatCurrency(result.weeklyRevenue, "USD") : "—"} />
        <ResultCard label="Monthly" value={result.valid ? formatCurrency(result.monthlyRevenue, "USD") : "—"} highlight />
        <ResultCard label="Yearly" value={result.valid ? formatCurrency(result.yearlyRevenue, "USD") : "—"} />
      </div>

      {!result.valid && result.reason && (
        <p className="text-sm text-red-600 dark:text-red-400">{result.reason}</p>
      )}

      <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
        <strong className="text-slate-900 dark:text-slate-100">Formula:</strong>{" "}
        <code className="font-mono">Revenue = (views ÷ 1,000) × RPM × (monetized% ÷ 90)</code>
        {result.valid && (
          <>
            <br />
            <span>
              ({monthlyViews.toLocaleString()} ÷ 1,000) × ${rpm} × ({monetizedPct}% ÷ 90%) = {formatCurrency(result.monthlyRevenue, "USD")}
            </span>
          </>
        )}
      </div>
    </section>
  );
}

function ResultCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "bg-gradient-to-br from-brand-600 to-brand-800 text-white" : "border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"}`}>
      <p className={`text-xs uppercase tracking-wide ${highlight ? "text-brand-100" : "text-slate-500 dark:text-slate-400"}`}>{label}</p>
      <p className={`mt-1 text-xl font-bold ${highlight ? "" : "text-slate-900 dark:text-slate-100"}`}>{value}</p>
    </div>
  );
}
