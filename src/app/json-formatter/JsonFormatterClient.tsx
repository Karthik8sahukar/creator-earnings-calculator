"use client";

import { useMemo, useState } from "react";
import { formatJson, minifyJson, validateJson, countJsonStats, SAMPLE_JSON } from "@/lib/developer";
import type { IndentType } from "@/lib/developer";
import { CopyButton, DownloadButton, PrivacyBadge, ToolError } from "@/components/developer";

export function JsonFormatterClient() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<IndentType>("2");
  const [sortKeys, setSortKeys] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => (input ? countJsonStats(input) : null), [input]);
  const validation = useMemo(() => (input ? validateJson(input) : null), [input]);

  const handleBeautify = () => {
    setError(null);
    try { setOutput(formatJson(input, indent, sortKeys)); } catch (e) { setError(e instanceof Error ? e.message : "Invalid JSON"); setOutput(""); }
  };
  const handleMinify = () => {
    setError(null);
    try { setOutput(minifyJson(input)); } catch (e) { setError(e instanceof Error ? e.message : "Invalid JSON"); setOutput(""); }
  };

  return (
    <section className="space-y-6">
      <PrivacyBadge />
      <div className="card p-6 sm:p-8 space-y-4">
        <label htmlFor="json-input" className="label">Input JSON</label>
        <textarea id="json-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste your JSON here..." rows={8} className="input font-mono text-xs resize-y min-h-[140px]" />
        <div className="flex flex-wrap items-center gap-3">
          <select value={indent} onChange={(e) => setIndent(e.target.value as IndentType)} className="input w-auto" aria-label="Indentation">
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} className="rounded" /> Sort keys
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleBeautify} disabled={!input} className="btn-primary text-xs">Beautify</button>
          <button type="button" onClick={handleMinify} disabled={!input} className="btn-secondary text-xs">Minify</button>
          <button type="button" onClick={() => setInput(SAMPLE_JSON)} className="btn-secondary text-xs">Sample</button>
          <button type="button" onClick={() => { setInput(""); setOutput(""); setError(null); }} className="btn-secondary text-xs">Clear</button>
        </div>
        {validation && (
          <p className={`text-xs font-medium ${validation.valid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {validation.valid ? "✓ Valid JSON" : `✗ ${validation.error}${validation.line ? ` (line ${validation.line}, col ${validation.column})` : ""}`}
          </p>
        )}
        {stats && stats.objects + stats.arrays > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {stats.objects} objects, {stats.arrays} arrays, {stats.keys} keys, {stats.strings} strings, {stats.numbers} numbers
          </p>
        )}
      </div>
      <ToolError message={error} />
      {output && (
        <div className="card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Output</h2>
            <div className="flex gap-2">
              <CopyButton text={output} label="Copy" />
              <DownloadButton content={output} filename="formatted.json" mimeType="application/json" />
            </div>
          </div>
          <pre className="input font-mono text-xs bg-slate-50 dark:bg-slate-900/50 whitespace-pre-wrap overflow-auto max-h-96">{output}</pre>
          <p className="text-xs text-slate-500 dark:text-slate-400">{output.length.toLocaleString()} characters</p>
        </div>
      )}
    </section>
  );
}
