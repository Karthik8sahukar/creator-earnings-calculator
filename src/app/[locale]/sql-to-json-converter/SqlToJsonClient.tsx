"use client";

import { useMemo, useState } from "react";
import { parseSqlInsert, SAMPLE_SQL } from "@/lib/developer";
import { CopyButton, DownloadButton, PrivacyBadge, ToolError } from "@/components/developer";

export function SqlToJsonClient() {
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return parseSqlInsert(input);
  }, [input]);

  const json = result?.data ? JSON.stringify(result.data, null, 2) : "";

  return (
    <section className="space-y-6">
      <PrivacyBadge />
      <div className="card p-6 sm:p-8 space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          This tool converts SQL INSERT data only. It does not execute SQL or accept database credentials.
        </div>
        <label htmlFor="sql-input" className="label">SQL INSERT Statement</label>
        <textarea id="sql-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="INSERT INTO table (col1, col2) VALUES (...);" rows={6} className="input font-mono text-xs resize-y" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setInput(SAMPLE_SQL)} className="btn-secondary text-xs">Sample</button>
          <button type="button" onClick={() => setInput("")} disabled={!input} className="btn-secondary text-xs">Clear</button>
        </div>
      </div>

      <ToolError message={result?.error || null} />

      {result && !result.error && result.rowCount > 0 && (
        <div className="card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">JSON Output</h2>
            <div className="flex gap-2">
              <CopyButton text={json} label="Copy" />
              <DownloadButton content={json} filename="data.json" label="Download .json" />
            </div>
          </div>
          <span className="chip">{result.rowCount} row{result.rowCount !== 1 ? "s" : ""}</span>
          <pre className="input font-mono text-xs bg-slate-50 dark:bg-slate-900/50 whitespace-pre-wrap overflow-auto max-h-96">{json}</pre>
        </div>
      )}
    </section>
  );
}
