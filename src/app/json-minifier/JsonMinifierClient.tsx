"use client";

import { useCallback, useState } from "react";
import { minifyJson, validateJson, SAMPLE_JSON } from "@/lib/developer";

function getByteSize(str: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(str).byteLength;
  }
  // Fallback: approximate for ASCII
  return new Blob([str]).size;
}

export function JsonMinifierClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ original: number; minified: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleMinify = useCallback(() => {
    setError(null);
    setCopied(false);
    if (!input.trim()) {
      setError("Please enter some JSON to minify.");
      setOutput("");
      setStats(null);
      return;
    }
    const validation = validateJson(input);
    if (!validation.valid) {
      setError(validation.error ?? "Invalid JSON");
      setOutput("");
      setStats(null);
      return;
    }
    try {
      const result = minifyJson(input);
      setOutput(result);
      setStats({ original: getByteSize(input), minified: getByteSize(result) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to minify");
      setOutput("");
      setStats(null);
    }
  }, [input]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = output;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  const saved = stats ? stats.original - stats.minified : 0;
  const percent = stats && stats.original > 0
    ? Math.round((saved / stats.original) * 100)
    : 0;

  return (
    <section className="space-y-6">
      <div className="card p-6 sm:p-8 space-y-4">
        <label htmlFor="minify-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Input JSON
        </label>
        <textarea
          id="minify-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your JSON here..."
          rows={8}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 font-mono text-xs text-slate-900 dark:text-slate-100 resize-y min-h-[140px] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          spellCheck={false}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleMinify}
            disabled={!input.trim()}
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            Minify
          </button>
          <button
            type="button"
            onClick={() => setInput(SAMPLE_JSON)}
            className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Load Example
          </button>
          <button
            type="button"
            onClick={() => { setInput(""); setOutput(""); setError(null); setStats(null); }}
            className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Clear
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>
        )}
      </div>

      {output && (
        <div className="card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Minified Output</h2>
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${copied ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
              aria-label={copied ? "Copied to clipboard" : "Copy minified JSON"}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <pre className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 font-mono text-xs text-slate-900 dark:text-slate-100 overflow-auto max-h-48 whitespace-pre-wrap break-all" aria-live="polite">
            {output}
          </pre>

          {stats && (
            <div className="grid grid-cols-3 gap-3 text-center" aria-live="polite">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Original</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{stats.original.toLocaleString()} B</p>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Minified</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{stats.minified.toLocaleString()} B</p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Saved</p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{saved.toLocaleString()} B ({percent}%)</p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
