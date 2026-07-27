"use client";

import { useMemo, useState } from "react";
import { validateJson, SAMPLE_JSON } from "@/lib/developer";

export function JsonValidatorClient() {
  const [input, setInput] = useState("");

  const validation = useMemo(() => {
    if (!input.trim()) return null;
    return validateJson(input);
  }, [input]);

  return (
    <section className="space-y-6">
      <div className="card p-6 sm:p-8 space-y-4">
        <label htmlFor="json-validate-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Input JSON
        </label>
        <textarea
          id="json-validate-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your JSON here to validate..."
          rows={10}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 font-mono text-xs text-slate-900 dark:text-slate-100 resize-y min-h-[180px] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          aria-describedby="validate-result"
          spellCheck={false}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setInput(SAMPLE_JSON)}
            className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Load Example
          </button>
          <button
            type="button"
            onClick={() => setInput("")}
            className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Validation Result */}
        <div id="validate-result" aria-live="polite" aria-atomic="true">
          {validation && (
            <div className={`rounded-xl p-4 ${validation.valid ? "bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-800"}`}>
              {validation.valid ? (
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 text-lg">✓</span>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Valid JSON</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400 text-lg">✗</span>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Invalid JSON</p>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono pl-6">
                    {validation.error}
                  </p>
                  {validation.line && (
                    <p className="text-xs text-red-500 dark:text-red-400 pl-6">
                      Line {validation.line}, Column {validation.column}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {!validation && input.trim().length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste or type JSON above. Validation happens automatically as you type.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
