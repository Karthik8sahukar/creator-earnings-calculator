"use client";

import { useCallback, useState } from "react";
import { generateUuids, formatUuid, validateUuid } from "@/lib/developer";
import { CopyButton, DownloadButton, PrivacyBadge } from "@/components/developer";

const QUANTITIES = [1, 5, 10, 25, 50, 100];

export function UuidGeneratorClient() {
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [uuids, setUuids] = useState<string[]>([]);
  const [validateInput, setValidateInput] = useState("");

  const generate = useCallback(() => {
    setUuids(generateUuids(count));
  }, [count]);

  const formatted = uuids.map((u) => formatUuid(u, uppercase, hyphens));
  const allText = formatted.join("\n");
  const validation = validateInput.trim() ? validateUuid(validateInput) : null;

  return (
    <section className="space-y-6">
      <PrivacyBadge />
      <div className="card p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="label">Quantity</label>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="input w-auto" aria-label="Quantity">
            {QUANTITIES.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} className="rounded" /> Uppercase
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} className="rounded" /> Hyphens
          </label>
        </div>
        <button type="button" onClick={generate} className="btn-primary text-xs">Generate UUIDs</button>
      </div>

      {formatted.length > 0 && (
        <div className="card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Generated UUIDs</h2>
            <div className="flex gap-2">
              <CopyButton text={allText} label="Copy All" />
              <DownloadButton content={allText} filename="uuids.txt" mimeType="text/plain" />
            </div>
          </div>
          <ul className="space-y-1 max-h-72 overflow-auto">
            {formatted.map((u, i) => (
              <li key={i} className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <code className="font-mono text-xs text-slate-900 dark:text-slate-100 truncate">{u}</code>
                <CopyButton text={u} label="Copy" />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">UUID Validator</h2>
        <input type="text" value={validateInput} onChange={(e) => setValidateInput(e.target.value)} placeholder="Paste a UUID to validate..." className="input font-mono text-xs" />
        {validation && (
          <p className={`text-xs font-medium ${validation.valid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {validation.valid ? `✓ Valid UUID v${validation.version}` : "✗ Invalid UUID"}
          </p>
        )}
      </div>
    </section>
  );
}
