"use client";

import { useMemo, useState } from "react";
import { calculateAffiliateRevenue } from "@/lib/calculators";
import { formatCurrency, formatNumber } from "@/lib/format";

export function AffiliateCalcClient() {
  const [monthlyViews, setMonthlyViews] = useState<number>(100000);
  const [ctr, setCtr] = useState<number>(3);
  const [conversionRate, setConversionRate] = useState<number>(2);
  const [aov, setAov] = useState<number>(50);
  const [commission, setCommission] = useState<number>(8);

  const result = useMemo(
    () => calculateAffiliateRevenue({ monthlyViews, clickThroughRate: ctr, conversionRate, averageOrderValue: aov, commissionRate: commission }),
    [monthlyViews, ctr, conversionRate, aov, commission],
  );

  return (
    <section className="card p-6 sm:p-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="label">Monthly views</span>
          <input type="number" inputMode="numeric" min={0} value={monthlyViews || ""} onChange={(e) => setMonthlyViews(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">Click-through rate (%)</span>
          <input type="number" inputMode="decimal" min={0} max={100} step={0.1} value={ctr || ""} onChange={(e) => setCtr(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">Conversion rate (%)</span>
          <input type="number" inputMode="decimal" min={0} max={100} step={0.1} value={conversionRate || ""} onChange={(e) => setConversionRate(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">Average order value (USD)</span>
          <input type="number" inputMode="decimal" min={0} step={1} value={aov || ""} onChange={(e) => setAov(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">Commission rate (%)</span>
          <input type="number" inputMode="decimal" min={0} max={100} step={0.5} value={commission || ""} onChange={(e) => setCommission(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
      </div>

      {/* Results */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ResultCard label="Monthly revenue" value={result.valid ? formatCurrency(result.monthlyRevenue, "USD") : "—"} highlight />
        <ResultCard label="Yearly revenue" value={result.valid ? formatCurrency(result.yearlyRevenue, "USD") : "—"} />
        <ResultCard label="Est. clicks / mo" value={result.valid ? formatNumber(result.estimatedClicks) : "—"} />
        <ResultCard label="Est. conversions / mo" value={result.valid ? formatNumber(result.estimatedConversions) : "—"} />
      </div>

      {!result.valid && result.reason && (
        <p className="text-sm text-red-600 dark:text-red-400">{result.reason}</p>
      )}

      <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
        <strong className="text-slate-900 dark:text-slate-100">Formula:</strong>{" "}
        <code className="font-mono">Revenue = views × CTR% × conversion% × AOV × commission%</code>
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
