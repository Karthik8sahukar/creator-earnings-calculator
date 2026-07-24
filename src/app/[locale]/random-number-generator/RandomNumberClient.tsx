"use client";

import { useCallback, useState } from "react";
import { ResultCard, ActionButtons, HistoryPanel } from "@/components/decision";
import { randomInt, prefersReducedMotion } from "@/lib/decision";

export function RandomNumberClient() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(1);
  const [results, setResults] = useState<number[]>([]);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<{ label: string; color?: "blue" | "neutral" }[]>([]);

  const generate = useCallback(() => {
    if (generating || min > max) return;
    setGenerating(true);
    const delay = prefersReducedMotion() ? 0 : 200;
    setTimeout(() => {
      const nums: number[] = [];
      for (let i = 0; i < count; i++) nums.push(randomInt(min, max));
      setResults(nums);
      setGenerating(false);
      const label = count === 1 ? `${nums[0]}` : nums.join(", ");
      setHistory(h => [{ label, color: "blue" as const }, ...h].slice(0, 50));
    }, delay);
  }, [generating, min, max, count]);

  return (
    <section className="space-y-6">
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="label">Minimum</span>
            <input type="number" inputMode="numeric" value={min} onChange={e => setMin(Number(e.target.value) || 0)} className="input mt-1" />
          </label>
          <label className="block">
            <span className="label">Maximum</span>
            <input type="number" inputMode="numeric" value={max} onChange={e => setMax(Number(e.target.value) || 0)} className="input mt-1" />
          </label>
          <label className="block">
            <span className="label">Count</span>
            <input type="number" inputMode="numeric" min={1} max={100} value={count} onChange={e => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} className="input mt-1" />
          </label>
        </div>

        {min > max && <p className="text-sm text-red-600 dark:text-red-400">Minimum must be less than or equal to maximum.</p>}

        <div className="flex flex-wrap gap-2">
          {[[1, 10], [1, 100], [1, 1000], [0, 1]].map(([a, b]) => (
            <button key={`${a}-${b}`} type="button" onClick={() => { setMin(a); setMax(b); }} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${min === a && max === b ? "bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>{a}–{b}</button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          {results.length > 0 && !generating && (
            <div className="flex flex-wrap gap-3 justify-center">
              {results.map((num, i) => (
                <ResultCard key={i} label={count > 1 ? `#${i + 1}` : "Result"} value={String(num)} variant={i === 0 ? "primary" : "neutral"} />
              ))}
            </div>
          )}
          <ActionButtons onAction={generate} actionLabel={generating ? "Generating\u2026" : "Generate"} actionDisabled={generating || min > max} />
        </div>
      </div>
      <HistoryPanel entries={history} onClear={() => setHistory([])} />
    </section>
  );
}
