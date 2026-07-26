"use client";

import { useCallback, useState } from "react";
import { generateUuids } from "@/lib/developer";

const MAX_QUANTITY = 100;

export function UuidGeneratorClient() {
  const [quantity, setQuantity] = useState(5);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleGenerate = useCallback(() => {
    const count = Math.min(Math.max(1, quantity), MAX_QUANTITY);
    setUuids(generateUuids(count));
    setCopied(null);
    setCopiedAll(false);
  }, [quantity]);

  const copyOne = useCallback(async (uuid: string) => {
    try {
      await navigator.clipboard.writeText(uuid);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = uuid;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(uuid);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const copyAll = useCallback(async () => {
    const text = uuids.join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }, [uuids]);

  return (
    <section className="space-y-6">
      <div className="card p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="uuid-qty"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Quantity
            </label>
            <input
              id="uuid-qty"
              type="number"
              min={1}
              max={MAX_QUANTITY}
              value={quantity}
              onChange={(e) => setQuantity(
                Math.min(MAX_QUANTITY, Math.max(1, parseInt(e.target.value) || 1))
              )}
              className="w-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Generate
          </button>
          {uuids.length > 0 && (
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Regenerate
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          UUID v4 • Cryptographically secure • Max {MAX_QUANTITY} per batch
        </p>
      </div>

      {uuids.length > 0 && (
        <div className="card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Generated UUIDs ({uuids.length})
            </h2>
            <button
              type="button"
              onClick={copyAll}
              className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                copiedAll
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
              aria-label={copiedAll ? "All copied" : "Copy all UUIDs"}
            >
              {copiedAll ? "All Copied!" : "Copy All"}
            </button>
          </div>

          <ul className="space-y-1" aria-live="polite">
            {uuids.map((uuid) => (
              <li
                key={uuid}
                className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2 group"
              >
                <code className="font-mono text-xs text-slate-900 dark:text-slate-100 select-all">
                  {uuid}
                </code>
                <button
                  type="button"
                  onClick={() => copyOne(uuid)}
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
                    copied === uuid
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "opacity-0 group-hover:opacity-100 bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                  aria-label={`Copy ${uuid}`}
                >
                  {copied === uuid ? "✓" : "Copy"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
