"use client";

import { useCallback, useRef, useState } from "react";
import {
  getFilteredItems,
  TD_CATEGORIES,
  TD_DIFFICULTIES,
  shuffle,
} from "@/lib/decision";
import type { TDItem, TDMode, TDDifficulty, TDCategory } from "@/lib/decision";

export function TruthOrDareClient() {
  const [mode, setMode] = useState<TDMode>("random");
  const [difficulty, setDifficulty] = useState<TDDifficulty | undefined>(undefined);
  const [category, setCategory] = useState<TDCategory | undefined>(undefined);
  const [current, setCurrent] = useState<TDItem | null>(null);
  const [history, setHistory] = useState<TDItem[]>([]);
  const [favorites, setFavorites] = useState<TDItem[]>([]);
  const [copied, setCopied] = useState(false);

  const lastIdRef = useRef<string | null>(null);

  const generate = useCallback(() => {
    const items = getFilteredItems(mode, difficulty, category);
    if (items.length === 0) return;

    // Avoid immediate repeats
    const filtered = items.length > 1 ? items.filter((i) => i.id !== lastIdRef.current) : items;
    const shuffled = shuffle(filtered);
    const picked = shuffled[0];

    lastIdRef.current = picked.id;
    setCurrent(picked);
    setHistory((prev) => [picked, ...prev].slice(0, 50));
  }, [mode, difficulty, category]);

  const handlePrevious = useCallback(() => {
    if (history.length < 2) return;
    const prev = history[1];
    setCurrent(prev);
  }, [history]);

  const handleFavorite = useCallback(() => {
    if (!current) return;
    setFavorites((prev) => {
      if (prev.some((f) => f.id === current.id)) {
        return prev.filter((f) => f.id !== current.id);
      }
      return [current, ...prev];
    });
  }, [current]);

  const handleCopy = useCallback(async () => {
    if (!current || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(current.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* silent */ }
  }, [current]);

  const handleShare = useCallback(async () => {
    if (!current) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: `${current.type === "truth" ? "Truth" : "Dare"}: ${current.text}` });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  }, [current, handleCopy]);

  const isFavorited = current ? favorites.some((f) => f.id === current.id) : false;
  const availableCount = getFilteredItems(mode, difficulty, category).length;

  return (
    <section className="space-y-6">
      {/* Controls */}
      <div className="card p-6 sm:p-8 space-y-5">
        {/* Mode selector */}
        <div className="space-y-2">
          <p className="label">Mode</p>
          <div className="flex flex-wrap gap-2">
            {(["truth", "dare", "random"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                  mode === m
                    ? "bg-brand-600 text-white dark:bg-brand-500 dark:text-slate-950"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-2">
          <p className="label">Difficulty</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDifficulty(undefined)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                !difficulty
                  ? "bg-brand-600 text-white dark:bg-brand-500 dark:text-slate-950"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              All
            </button>
            {TD_DIFFICULTIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDifficulty(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  difficulty === value
                    ? "bg-brand-600 text-white dark:bg-brand-500 dark:text-slate-950"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <p className="label">Category</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory(undefined)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                !category
                  ? "bg-brand-600 text-white dark:bg-brand-500 dark:text-slate-950"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              All
            </button>
            {TD_CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  category === value
                    ? "bg-brand-600 text-white dark:bg-brand-500 dark:text-slate-950"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">{availableCount} questions available</p>
      </div>

      {/* Result card */}
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="min-h-[180px] flex items-center justify-center">
          {!current ? (
            <div className="text-center space-y-2">
              <p className="text-5xl">🎲</p>
              <p className="text-lg font-medium text-slate-400 dark:text-slate-500">
                Click Generate to start playing
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Choose your mode and difficulty above
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4 animate-fade-in" key={current.id}>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                current.type === "truth"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
              }`}>
                {current.type}
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 max-w-lg mx-auto leading-relaxed">
                {current.text}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                Difficulty: {current.difficulty}
              </p>
            </div>
          )}
        </div>

        {/* Generate button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={generate}
            disabled={availableCount === 0}
            className="px-8 py-4 rounded-xl bg-brand-600 text-white font-bold text-lg shadow-md hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
          >
            Generate
          </button>
        </div>

        {/* Secondary actions */}
        {current && (
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={generate} className="btn-secondary text-xs">
              Shuffle
            </button>
            <button type="button" onClick={handlePrevious} disabled={history.length < 2} className="btn-secondary text-xs">
              Previous
            </button>
            <button type="button" onClick={handleFavorite} className={`btn-secondary text-xs ${isFavorited ? "ring-2 ring-amber-400" : ""}`}>
              {isFavorited ? "★ Favorited" : "☆ Favorite"}
            </button>
            <button type="button" onClick={handleCopy} className="btn-secondary text-xs">
              {copied ? "Copied!" : "Copy"}
            </button>
            <button type="button" onClick={handleShare} className="btn-secondary text-xs">
              Share
            </button>
          </div>
        )}
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="card p-6 sm:p-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Favorites ({favorites.length})</h2>
            <button type="button" onClick={() => setFavorites([])} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              Clear All
            </button>
          </div>
          <ul className="space-y-2">
            {favorites.map((item) => (
              <li key={item.id} className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  item.type === "truth" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                }`}>
                  {item.type}
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-300">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Educational section */}
      <div className="card p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          How to Play Truth or Dare
        </h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-3">
          <p>
            Select your mode (Truth, Dare, or Random), choose a difficulty and category, then click Generate. The game avoids repeating the same question twice in a row.
          </p>
          <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">Tips for Great Games</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Start with Easy difficulty to warm up the group</li>
            <li>Use the Kids or Family category for all-ages fun</li>
            <li>Switch to Party or Couples for adult gatherings</li>
            <li>Favorite the best questions to replay later</li>
            <li>Use Share to send dares via messaging apps</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
