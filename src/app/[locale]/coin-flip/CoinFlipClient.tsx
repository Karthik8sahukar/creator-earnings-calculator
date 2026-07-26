"use client";

import { useCallback, useState } from "react";
import { ActionButtons } from "@/components/decision";
import type { HistoryItem } from "@/components/decision";
import { randomPick, prefersReducedMotion } from "@/lib/decision";

type CoinResult = "Heads" | "Tails";

export function CoinFlipClient() {
  const [result, setResult] = useState<CoinResult | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [flipCount, setFlipCount] = useState(1);
  const [results, setResults] = useState<CoinResult[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const flip = useCallback(() => {
    if (flipping) return;
    setFlipping(true);
    const outcomes: CoinResult[] = [];
    for (let i = 0; i < flipCount; i++) {
      outcomes.push(randomPick(["Heads", "Tails"] as const));
    }
    const delay = prefersReducedMotion() ? 0 : 600;
    setTimeout(() => {
      setFlipping(false);
      setResults(outcomes);
      setResult(outcomes[0]);
      const newEntries: HistoryItem[] = outcomes.map(o => ({ label: o, color: o === "Heads" ? "green" : "red" }));
      setHistory(h => [...newEntries, ...h].slice(0, 50));
    }, delay);
  }, [flipping, flipCount]);


  const headsCount = history.filter(h => h.label === "Heads").length;
  const tailsCount = history.filter(h => h.label === "Tails").length;

  return (
    <section className="space-y-6">
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="label">Number of flips</span>
            <input type="number" inputMode="numeric" min={1} max={100} value={flipCount} onChange={e => setFlipCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} className="input mt-1 w-24" />
          </label>
          <div className="flex gap-2">
            {[1, 2, 5, 10].map(n => (
              <button key={n} type="button" onClick={() => setFlipCount(n)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${flipCount === n ? "bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>{n}×</button>
            ))}
          </div>
        </div>

        {/* Coin animation */}
        <div className="flex flex-col items-center gap-4">
          <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center text-2xl font-bold transition-transform ${flipping ? "animate-[flip_0.6s_ease-in-out]" : ""} ${result === "Heads" ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200" : result === "Tails" ? "border-slate-400 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" : "border-slate-300 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-900"}`}>
            {flipping ? "..." : result ?? "?"}
          </div>
          <ActionButtons onAction={flip} actionLabel={flipping ? "Flipping\u2026" : `Flip${flipCount > 1 ? ` (${flipCount}×)` : ""}`} actionDisabled={flipping} />
        </div>

        {/* Multi-flip results */}
        {results.length > 1 && !flipping && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Results ({results.length} flips):</p>
            <div className="flex flex-wrap gap-1.5">
              {results.map((r, i) => (
                <span key={i} className={`rounded px-2 py-0.5 text-xs font-medium ${r === "Heads" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"}`}>{r}</span>
              ))}
            </div>
            <p className="text-xs text-slate-500">Heads: {results.filter(r => r === "Heads").length} | Tails: {results.filter(r => r === "Tails").length}</p>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="card p-6 sm:p-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">History</h2>
            <button type="button" onClick={() => setHistory([])} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Clear</button>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-amber-700 dark:text-amber-400 font-medium">Heads: {headsCount}</span>
            <span className="text-slate-600 dark:text-slate-400 font-medium">Tails: {tailsCount}</span>
            <span className="text-slate-500">{history.length} total</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${history.length ? (headsCount / history.length) * 100 : 50}%` }} />
          </div>
        </div>
      )}
    </section>
  );
}
