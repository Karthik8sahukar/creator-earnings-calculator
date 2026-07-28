"use client";

import { useMemo, useState } from "react";
import { calculateEngagementRate } from "@/lib/calculators";

export function EngagementCalcClient() {
  const [likes, setLikes] = useState<number>(0);
  const [comments, setComments] = useState<number>(0);
  const [shares, setShares] = useState<number>(0);
  const [views, setViews] = useState<number>(0);

  const result = useMemo(
    () => calculateEngagementRate({ likes, comments, shares, views }),
    [likes, comments, shares, views],
  );

  const qualityColor = {
    low: "text-red-600 dark:text-red-400",
    average: "text-yellow-600 dark:text-yellow-400",
    good: "text-emerald-600 dark:text-emerald-400",
    excellent: "text-brand-600 dark:text-brand-300",
  };

  return (
    <section className="card p-6 sm:p-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="label">Likes</span>
          <input type="number" inputMode="numeric" min={0} value={likes || ""} onChange={(e) => setLikes(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">Comments</span>
          <input type="number" inputMode="numeric" min={0} value={comments || ""} onChange={(e) => setComments(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">Shares</span>
          <input type="number" inputMode="numeric" min={0} value={shares || ""} onChange={(e) => setShares(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">Views</span>
          <input type="number" inputMode="numeric" min={0} value={views || ""} onChange={(e) => setViews(Number(e.target.value) || 0)} className="input mt-1" />
        </label>
      </div>

      {/* Result */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-5">
          <p className="text-xs uppercase tracking-wide text-brand-100">Engagement Rate</p>
          {result.valid ? (
            <p className="mt-1 text-3xl font-bold" aria-live="polite">
              {result.engagementRate.toFixed(2)}%
            </p>
          ) : (
            <p className="mt-1 text-sm text-brand-100" aria-live="polite">{result.reason}</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Quality</p>
          {result.valid ? (
            <p className={`mt-1 text-2xl font-bold capitalize ${qualityColor[result.quality]}`} aria-live="polite">
              {result.quality}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">—</p>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
        <strong className="text-slate-900 dark:text-slate-100">Formula:</strong>{" "}
        <code className="font-mono">Engagement Rate = (likes + comments + shares) ÷ views × 100</code>
      </div>
    </section>
  );
}
