"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActionButtons, HistoryPanel } from "@/components/decision";
import type { HistoryItem } from "@/components/decision";
import { randomInt, prefersReducedMotion } from "@/lib/decision";

const DICE_PRESETS = [4, 6, 8, 10, 12, 20] as const;
const ROLL_DURATION = 750; // ms
const TICK_INTERVAL = 60; // ms between number changes during roll

export function DiceRollerClient() {
  const [numDice, setNumDice] = useState(1);
  const [sides, setSides] = useState(6);
  const [results, setResults] = useState<number[]>([]);
  const [displayValues, setDisplayValues] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const [settled, setSettled] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up interval on unmount
  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); }, []);

  const roll = useCallback(() => {
    if (rolling) return;
    const isReduced = prefersReducedMotion();
    setRolling(true);
    setSettled(false);

    // Generate final results immediately
    const finalRolls: number[] = [];
    for (let i = 0; i < numDice; i++) finalRolls.push(randomInt(1, sides));

    if (isReduced) {
      // Skip animation
      setResults(finalRolls);
      setDisplayValues(finalRolls);
      setRolling(false);
      setSettled(true);
      const total = finalRolls.reduce((a, b) => a + b, 0);
      const label = numDice === 1 ? `${finalRolls[0]}` : `${finalRolls.join("+")} = ${total}`;
      const item: HistoryItem = { label, color: "blue" };
      setHistory(h => [item, ...h].slice(0, 50));
      return;
    }

    // Animated roll: rapidly cycle random numbers
    setDisplayValues(Array.from({ length: numDice }, () => randomInt(1, sides)));

    tickRef.current = setInterval(() => {
      setDisplayValues(Array.from({ length: numDice }, () => randomInt(1, sides)));
    }, TICK_INTERVAL);

    // After duration, settle on final values
    setTimeout(() => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      setDisplayValues(finalRolls);
      setResults(finalRolls);
      setRolling(false);

      // Small delay for the "bounce" to finish before marking settled
      setTimeout(() => setSettled(true), 200);

      const total = finalRolls.reduce((a, b) => a + b, 0);
      const label = numDice === 1 ? `${finalRolls[0]}` : `${finalRolls.join("+")} = ${total}`;
      const item: HistoryItem = { label, color: "blue" };
      setHistory(h => [item, ...h].slice(0, 50));
    }, ROLL_DURATION);
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
          {/* Dice display — shows during and after roll */}
          {(rolling || displayValues.length > 0) && (
            <div className="flex flex-wrap gap-3 justify-center">
              {displayValues.map((val, i) => (
                <div
                  key={i}
                  className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold shadow-sm transition-all duration-200 ${
                    rolling
                      ? "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 animate-[dice-roll_0.15s_ease-in-out_infinite]"
                      : settled
                        ? "border-brand-400 bg-white dark:bg-slate-900 dark:border-brand-600 text-brand-700 dark:text-brand-300 scale-100"
                        : "border-brand-400 bg-white dark:bg-slate-900 dark:border-brand-600 text-brand-700 dark:text-brand-300 animate-[dice-bounce_0.3s_ease-out]"
                  }`}
                >
                  {val}
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          {!rolling && results.length > 1 && (
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Total: {total}</p>
          )}

          <ActionButtons onAction={roll} actionLabel={rolling ? "Rolling\u2026" : `Roll ${numDice}d${sides}`} actionDisabled={rolling} />
        </div>
      </div>
      <HistoryPanel entries={history} onClear={() => setHistory([])} />

      {/* CSS keyframes for dice animation — injected once */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dice-roll {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-3deg) scale(1.02); }
          50% { transform: rotate(2deg) scale(0.98); }
          75% { transform: rotate(-1deg) scale(1.01); }
        }
        @keyframes dice-bounce {
          0% { transform: scale(1.15) rotate(4deg); }
          40% { transform: scale(0.95) rotate(-2deg); }
          70% { transform: scale(1.03) rotate(1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes dice-roll { 0%, 100% { transform: none; } }
          @keyframes dice-bounce { 0%, 100% { transform: none; } }
        }
      `}} />
    </section>
  );
}
