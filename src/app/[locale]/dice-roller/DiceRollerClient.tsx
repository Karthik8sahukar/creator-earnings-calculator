"use client";

import { useCallback, useState } from "react";
import { ActionButtons, HistoryPanel } from "@/components/decision";
import { randomInt, prefersReducedMotion } from "@/lib/decision";

const DICE_PRESETS = [4, 6, 8, 10, 12, 20] as const;

export function DiceRollerClient() {
  const [numDice, setNumDice] = useState(1);
  const [sides, setSides] = useState(6);
  const [results, setResults] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<{ label: string; color?: "blue" | "neutral" }[]>([]);

  const roll = useCallback(() => {
    if (rolling) return;
    setRolling(true);
    const delay = prefersReducedMotion() ? 0 : 400;
    setTimeout(() => {
      const rolls: number[] = [];
      for (let i = 0; i < numDice; i++) rolls.push(randomInt(1, sides));
      setResults(rolls);
      setRolling(false);
      const total = rolls.reduce((a, b) => a + b, 0);
      const label = numDice === 1 ? `${rolls[0]}` : `${rolls.join("+")} = ${total}`;
      setHistory(h => [{ label, color: "blue" as const }, ...h].slice(0, 50));
    }, delay);
  }, [rolling, numDice, sides]);

  const total = results.reduce((a, b) => a + b, 0);

  return (
    <section className="space-y-6">
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="label">Number of dice</span>
            <input type="number" inputMode="numeric" min={1} max={10} value={numDice} onChange={e => setNumDice(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} className="input mt-1 w-20" />
          </label>
          <label className="block">
            <span className="label">Sides per die</span>
            <input type="number" inputMode="numeric" min={2} max={100} value={sides} onChange={e => setSides(Math.max(2, Math.min(100, Number(e.target.value) || 6)))} className="input mt-1 w-20" />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {DICE_PRESETS.map(s => (
            <button key={s} type="button" onClick={() => setSides(s)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${sides === s ? "bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>d{s}</button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Dice display */}
          {results.length > 0 && !rolling && (
            <div className="flex flex-wrap gap-3 justify-center">
              {results.map((val, i) => (
                <div key={i} className="w-16 h-16 rounded-xl border-2 border-brand-300 bg-white dark:bg-slate-900 dark:border-brand-700 flex items-center justify-center text-2xl font-bold text-brand-700 dark:text-brand-300 shadow-sm">
                  {val}
                </div>
              ))}
            </div>
          )}
          {results.length > 1 && !rolling && (
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Total: {total}</p>
          )}
          {rolling && (
            <div className="flex gap-3">
              {Array.from({ length: numDice }).map((_, i) => (
                <div key={i} className="w-16 h-16 rounded-xl border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-2xl animate-pulse text-slate-400">?</div>
              ))}
            </div>
          )}
          <ActionButtons onAction={roll} actionLabel={rolling ? "Rolling\u2026" : `Roll ${numDice}d${sides}`} actionDisabled={rolling} />
        </div>
      </div>
      <HistoryPanel entries={history} onClear={() => setHistory([])} />
    </section>
  );
}
