"use client";

import { useCallback, useMemo, useState } from "react";
import { ResultCard, ActionButtons, HistoryPanel } from "@/components/decision";
import type { HistoryItem } from "@/components/decision";
import { randomPick, shuffle, prefersReducedMotion } from "@/lib/decision";

export function RandomNameClient() {
  const [namesInput, setNamesInput] = useState("");
  const [pickCount, setPickCount] = useState(1);
  const [results, setResults] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const names = useMemo(() => namesInput.split(/[\n,]+/).map(n => n.trim()).filter(Boolean), [namesInput]);

  const pick = useCallback(() => {
    if (picking || names.length < 1) return;
    setPicking(true);
    const delay = prefersReducedMotion() ? 0 : 300;
    setTimeout(() => {
      let picks: string[];
      if (pickCount >= names.length) {
        picks = shuffle(names);
      } else {
        const shuffled = shuffle(names);
        picks = shuffled.slice(0, pickCount);
      }
      setResults(picks);
      setPicking(false);
      const label = picks.join(", ");
      const item: HistoryItem = { label, color: "blue" };
      setHistory(h => [item, ...h].slice(0, 50));
    }, delay);
  }, [picking, names, pickCount]);

  return (
    <section className="space-y-6">
      <div className="card p-6 sm:p-8 space-y-6">
        <label className="block">
          <span className="label">Names (one per line or comma-separated)</span>
          <textarea value={namesInput} onChange={e => setNamesInput(e.target.value)} rows={5} className="input mt-1 resize-y min-h-[100px]" placeholder={"Alice\nBob\nCharlie\nDiana\nEve"} />
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">{names.length} name{names.length !== 1 ? "s" : ""} detected</p>

        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="label">Pick how many?</span>
            <input type="number" inputMode="numeric" min={1} max={Math.max(1, names.length)} value={pickCount} onChange={e => setPickCount(Math.max(1, Number(e.target.value) || 1))} className="input mt-1 w-20" />
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 5].map(n => (
              <button key={n} type="button" onClick={() => setPickCount(n)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${pickCount === n ? "bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>{n}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {results.length > 0 && !picking && (
            <div className="flex flex-wrap gap-3 justify-center">
              {results.map((name, i) => (
                <ResultCard key={i} label={results.length > 1 ? `Pick #${i + 1}` : "Winner"} value={name} variant={i === 0 ? "primary" : "neutral"} />
              ))}
            </div>
          )}
          <ActionButtons onAction={pick} actionLabel={picking ? "Picking\u2026" : `Pick${pickCount > 1 ? ` ${pickCount}` : ""}`} actionDisabled={picking || names.length < 1} />
        </div>
      </div>
      <HistoryPanel entries={history} onClear={() => setHistory([])} />
    </section>
  );
}
