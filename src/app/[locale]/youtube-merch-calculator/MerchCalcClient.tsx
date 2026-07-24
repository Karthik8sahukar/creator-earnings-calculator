"use client";

import { useMemo, useState } from "react";
import { calculateMerchRevenue } from "@/lib/calculators";
import { useFormatMoney } from "@/components/currency";
import { formatNumber } from "@/lib/format";

export function MerchCalcClient() {
  const [monthlyViews, setMonthlyViews] = useState<number>(500000);
  const [conversionRate, setConversionRate] = useState<number>(1);
  const [aov, setAov] = useState<number>(35);
  const [profitMargin, setProfitMargin] = useState<number>(40);
  const { formatMoney } = useFormatMoney();

  const result = useMemo(
    () => calculateMerchRevenue({ monthlyViews, conversionRate, averageOrderValue: aov, profitMargin }),
    [monthlyViews, conversionRate, aov, profitMargin],
  );

  return (
    <section className="card p-6 sm:p-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="label">Monthly views</span>
          <input type="number" inputMode="numeric" min={0} value={monthlyViews || ""} onChange={(e) => setMonthlyViews(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">Conversion rate (%)</span>
          <input type="number" inputMode="decimal" min={0} max={100} step={0.1} value={conversionRate || ""} onChange={(e) => setConversionRate(Number(e.target.value) || 0)} className="input mt-1" />
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Typical: 0.5–2%</span>
        </label>
        <label className="block">
          <span className="label">Avg. order value (USD)</span>
          <input type="number" inputMode="decimal" min={0} step={1} value={aov || ""} onChange={(e) => setAov(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">Profit margin (%)</span>
          <input type="number" inputMode="decimal" min={0} max={100} step={1} value={profitMargin || ""} onChange={(e) => setProfitMargin(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
      </div>

      {/* Results */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ResultCard label="Monthly revenue" value={result.valid ? formatMoney(result.monthlyRevenue) : "—"} />
        <ResultCard label="Monthly profit" value={result.valid ? formatMoney(result.monthlyProfit) : "—"} highlight />
        <ResultCard label="Yearly profit" value={result.valid ? formatMoney(result.yearlyProfit) : "—"} />
        <ResultCard label="Est. orders / mo" value={result.valid ? formatNumber(result.estimatedOrders) : "—"} />
      </div>

      {!result.valid && result.reason && (
        <p className="text-sm text-red-600 dark:text-red-400">{result.reason}</p>
      )}

      <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
        <strong className="text-slate-900 dark:text-slate-100">Formula:</strong>{" "}
        <code className="font-mono">Profit = views × conversion% × AOV × margin%</code>
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
