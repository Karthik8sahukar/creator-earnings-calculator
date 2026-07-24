"use client";

import { useCallback, useMemo, useState } from "react";

// ─── Helpers ────────────────────────────────────────────────────────

/** Escape a value for CSV: wrap in quotes if it contains comma, quote, or newline */
function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ─── Component ──────────────────────────────────────────────────────

export function TeamGeneratorClient() {
  const [namesInput, setNamesInput] = useState("");
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState<string[][] | null>(null);
  const [copied, setCopied] = useState(false);

  const names = useMemo(() => {
    return namesInput
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter(Boolean);
  }, [namesInput]);

  // Duplicates are intentionally allowed — the same name appearing twice
  // represents two distinct participants (e.g. "John S." and "John S."
  // from different classes). The count shown reflects total entries.
  const hasDuplicates = useMemo(() => {
    const unique = new Set(names.map((n) => n.toLowerCase()));
    return unique.size < names.length;
  }, [names]);

  const canGenerate = names.length >= 2 && teamCount >= 2 && teamCount <= names.length;

  const generate = useCallback(() => {
    if (!canGenerate) return;

    // Fisher-Yates (Knuth) shuffle — unbiased
    const shuffled = [...names];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Distribute round-robin — guarantees sizes differ by at most 1
    const result: string[][] = Array.from({ length: teamCount }, () => []);
    shuffled.forEach((name, i) => {
      result[i % teamCount].push(name);
    });

    setTeams(result);
    setCopied(false);
  }, [names, teamCount, canGenerate]);

  const copyResults = useCallback(async () => {
    if (!teams) return;
    const text = teams
      .map((team, i) => `Team ${i + 1}:\n${team.map((n) => `  - ${n}`).join("\n")}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS or denied permissions
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [teams]);

  const exportCsv = useCallback(() => {
    if (!teams) return;
    const maxLen = Math.max(...teams.map((t) => t.length));
    const headers = teams.map((_, i) => csvEscape(`Team ${i + 1}`)).join(",");
    const rows: string[] = [headers];
    for (let r = 0; r < maxLen; r++) {
      const row = teams.map((t) => csvEscape(t[r] ?? "")).join(",");
      rows.push(row);
    }
    const csv = rows.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teams.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [teams]);

  return (
    <section className="space-y-6">
      <div className="card p-6 sm:p-8 space-y-6">
        {/* Names input */}
        <label className="block">
          <span className="label">Participants (one per line or comma-separated)</span>
          <textarea
            value={namesInput}
            onChange={(e) => setNamesInput(e.target.value)}
            rows={6}
            className="input mt-1 resize-y min-h-[120px]"
            placeholder={"Alice\nBob\nCharlie\nDiana\nEve\nFrank\nGrace\nHank"}
          />
        </label>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {names.length} participant{names.length !== 1 ? "s" : ""} detected
          </span>
          {hasDuplicates && (
            <span className="text-amber-600 dark:text-amber-400">
              (includes duplicate names — each entry is treated as a separate participant)
            </span>
          )}
        </div>

        {/* Team count */}
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="label">Number of teams</span>
            <input
              type="number"
              inputMode="numeric"
              min={2}
              max={Math.max(2, names.length)}
              value={teamCount}
              onChange={(e) => setTeamCount(Math.max(2, Number(e.target.value) || 2))}
              className="input mt-1 w-24"
            />
          </label>

          {/* Quick presets */}
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTeamCount(n)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  teamCount === n
                    ? "bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Validation messages */}
        {names.length > 0 && names.length < 2 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Add at least 2 participants to generate teams.
          </p>
        )}
        {names.length >= 2 && teamCount > names.length && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Cannot create more teams ({teamCount}) than participants ({names.length}).
          </p>
        )}

        {/* Generate button */}
        <button
          type="button"
          onClick={generate}
          disabled={!canGenerate}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold shadow-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
        >
          Generate Random Teams
        </button>
      </div>

      {/* Results */}
      {teams && (
        <div className="card p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Results
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyResults}
                className="rounded-md px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              >
                {copied ? "Copied \u2713" : "Copy"}
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-md px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={generate}
                className="rounded-md px-3 py-1.5 text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-200 dark:hover:bg-brand-500/20 transition"
              >
                Re-shuffle
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <h3 className="text-sm font-semibold text-brand-700 dark:text-brand-300 mb-2">
                  Team {i + 1}
                  <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                    ({team.length} member{team.length !== 1 ? "s" : ""})
                  </span>
                </h3>
                <ul className="space-y-1">
                  {team.map((name, j) => (
                    <li
                      key={j}
                      className="text-sm text-slate-700 dark:text-slate-300 pl-2 border-l-2 border-brand-200 dark:border-brand-700"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related tools */}
      <div className="card p-6 sm:p-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Related Tools
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 text-sm">
          <li>
            <a href="/yes-no-picker-wheel" className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-200 underline-offset-2 hover:underline">
              Yes/No Picker Wheel
            </a>
            <span className="text-slate-500 dark:text-slate-400"> — Spin for a random decision.</span>
          </li>
          <li>
            <a href="/twitch-bits-calculator" className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-200 underline-offset-2 hover:underline">
              Twitch Bits Calculator
            </a>
            <span className="text-slate-500 dark:text-slate-400"> — Convert Bits to USD.</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
