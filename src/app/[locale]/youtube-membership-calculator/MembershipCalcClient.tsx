"use client";

import { useMemo, useState } from "react";
import { calculateMembershipRevenue } from "@/lib/calculators";
import { formatCurrency, formatNumber } from "@/lib/format";

export function MembershipCalcClient() {
  const [subscribers, setSubscribers] = useState<number>(100000);
  const [membershipRate, setMembershipRate] = useState<number>(1.5);
  const [avgPrice, setAvgPrice] = useState<number>(4.99);

  const result = useMemo(
    () => calculateMembershipRevenue({ subscribers, membershipRate, averagePrice: avgPrice, tiers: [] }),
    [subscribers, membershipRate, avgPrice],
  );

  return (
    <section className="card p-6 sm:p-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="label">Total subscribers</span>
          <input type="number" inputMode="numeric" min={0} value={subscribers || ""} onChange={(e) => setSubscribers(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">Membership conversion (%)</span>
          <input type="number" inputMode="decimal" min={0} max={100} step={0.1} value={membershipRate || ""} onChange={(e) => setMembershipRate(Number(e.target.value) || 0)} className="input mt-1" />
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Typical: 0.5–3%</span>
        </label>
        <label className="block">
          <span className="label">Avg. monthly price (USD)</span>
          <input type="number" inputMode="decimal" min={0} step={0.01} value={avgPrice || ""} onChange={(e) => setAvgPrice(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
      </div>

      {/* Results */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ResultCard label="Gross monthly" value={result.valid ? formatCurrency(result.monthlyRevenue, "USD") : "—"} />
        <ResultCard label="After YouTube's 30% cut" value={result.valid ? formatCurrency(result.revenueAfterYouTubeCut, "USD") : "—"} highlight />
        <ResultCard label="Yearly (net)" value={result.valid ? formatCurrency(result.revenueAfterYouTubeCut * 12, "USD") : "—"} />
        <ResultCard label="Est. members" value={result.valid ? formatNumber(result.estimatedMembers) : "—"} />
      </div>

      {!result.valid && result.reason && (
        <p className="text-sm text-red-600 dark:text-red-400">{result.reason}</p>
      )}

      <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
        <strong className="text-slate-900 dark:text-slate-100">Formula:</strong>{" "}
        <code className="font-mono">Net Revenue = subscribers × conversion% × price × 0.7</code>
        <br />
        <span className="text-xs">YouTube retains ~30% of membership revenue.</span>
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
