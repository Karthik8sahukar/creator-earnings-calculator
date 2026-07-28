"use client";

import { useMemo, useState } from "react";
import { parseCsv, detectDelimiter, SAMPLE_CSV } from "@/lib/developer";
import type { Delimiter } from "@/lib/developer";
import { CopyButton, DownloadButton, PrivacyBadge, ToolError } from "@/components/developer";

const DELIMITERS: { value: Delimiter | "auto"; label: string }[] = [
  { value: "auto", label: "Auto-detect" }, { value: ",", label: "Comma" },
  { value: ";", label: "Semicolon" }, { value: "\t", label: "Tab" }, { value: "|", label: "Pipe" },
];

export function CsvToJsonClient() {
  const [input, setInput] = useState("");
  const [delimiter, setDelimiter] = useState<Delimiter | "auto">("auto");
  const [hasHeader, setHasHeader] = useState(true);
  const [typeInference, setTypeInference] = useState(true);
  const [nested, setNested] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    const del = delimiter === "auto" ? detectDelimiter(input) : delimiter;
    return parseCsv(input, { delimiter: del, hasHeader, typeInference, nested });
  }, [input, delimiter, hasHeader, typeInference, nested]);

  const json = result?.data ? JSON.stringify(result.data, null, 2) : "";
  const previewRows = result?.data.slice(0, 5) || [];

  return (
    <section className="space-y-6">
      <PrivacyBadge />
      <div className="card p-6 sm:p-8 space-y-4">
        <label htmlFor="csv-input" className="label">CSV Data</label>
        <textarea id="csv-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="name,email,age&#10;Alice,alice@example.com,28" rows={6} className="input font-mono text-xs resize-y" />
        <div className="flex flex-wrap gap-3 items-center">
          <label className="label text-xs">Delimiter:
            <select value={delimiter} onChange={(e) => setDelimiter(e.target.value as Delimiter | "auto")} className="input ml-2 w-auto text-xs">
              {DELIMITERS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className="rounded" /> Header row</label>
          <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={typeInference} onChange={(e) => setTypeInference(e.target.checked)} className="rounded" /> Type inference</label>
          <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={nested} onChange={(e) => setNested(e.target.checked)} className="rounded" /> Nested keys (dot notation)</label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setInput(SAMPLE_CSV)} className="btn-secondary text-xs">Sample</button>
          <button type="button" onClick={() => setInput("")} disabled={!input} className="btn-secondary text-xs">Clear</button>
        </div>
      </div>

      <ToolError message={result?.error || null} />

      {result && !result.error && result.rowCount > 0 && (
        <>
          {previewRows.length > 0 && (
            <div className="card p-6 sm:p-8 space-y-4 overflow-x-auto">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Preview (first {previewRows.length} rows)</h2>
              <table className="w-full text-xs"><thead><tr className="text-left text-slate-500">{result.headers.map((h) => <th key={h} className="pb-2 pr-3 font-mono">{h}</th>)}</tr></thead>
                <tbody>{previewRows.map((row, i) => <tr key={i} className="border-t border-slate-100 dark:border-slate-800">{result.headers.map((h) => <td key={h} className="py-1 pr-3 font-mono">{String(row[h] ?? "")}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
          <div className="card p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">JSON Output</h2>
              <div className="flex gap-2">
                <CopyButton text={json} label="Copy" />
                <DownloadButton content={json} filename="data.json" label="Download .json" />
              </div>
            </div>
            <div className="flex gap-2"><span className="chip">{result.rowCount} rows</span><span className="chip">{result.columnCount} columns</span></div>
            <pre className="input font-mono text-xs bg-slate-50 dark:bg-slate-900/50 whitespace-pre-wrap overflow-auto max-h-96">{json}</pre>
          </div>
        </>
      )}
    </section>
  );
}
