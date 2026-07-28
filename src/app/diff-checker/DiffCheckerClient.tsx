"use client";

import { useCallback, useState } from "react";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("diff-checker")!;

const EXAMPLE_LEFT = `BeHumler provides free online tools.
The old version uses one combined input.
This line will be removed.`;

const EXAMPLE_RIGHT = `BeHumler provides fast, free online tools.
The new version uses two separate inputs.
This line was added.`;

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
}

function computeDiff(left: string, right: string): DiffLine[] {
  const linesA = left.split("\n");
  const linesB = right.split("\n");
  const result: DiffLine[] = [];
  const maxLen = Math.max(linesA.length, linesB.length);

  for (let i = 0; i < maxLen; i++) {
    const a = linesA[i] ?? "";
    const b = linesB[i] ?? "";
    if (a === b) {
      result.push({ type: "unchanged", text: a });
    } else {
      if (a) result.push({ type: "removed", text: a });
      if (b) result.push({ type: "added", text: b });
    }
  }

  return result;
}

export function DiffCheckerClient() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [diffResult, setDiffResult] = useState<DiffLine[] | null>(null);
  const [copied, setCopied] = useState(false);

  const canCompare = left.trim().length > 0 || right.trim().length > 0;

  const handleCompare = useCallback(() => {
    setDiffResult(computeDiff(left, right));
  }, [left, right]);

  const handleUseExample = useCallback(() => {
    setLeft(EXAMPLE_LEFT);
    setRight(EXAMPLE_RIGHT);
    setDiffResult(null);
  }, []);

  const handleClear = useCallback(() => {
    setLeft("");
    setRight("");
    setDiffResult(null);
  }, []);

  const handleCopy = useCallback(() => {
    if (!diffResult) return;
    const text = diffResult
      .map((l) => {
        if (l.type === "added") return `+ ${l.text}`;
        if (l.type === "removed") return `- ${l.text}`;
        return `  ${l.text}`;
      })
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [diffResult]);

  const additions = diffResult?.filter((l) => l.type === "added").length ?? 0;
  const deletions = diffResult?.filter((l) => l.type === "removed").length ?? 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-600 dark:text-accent-400">
          Developer Tool
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {tool.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300">{tool.longDescription}</p>
      </header>

      {/* Editors — side by side on desktop, stacked on mobile */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="diff-left" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Original Text
          </label>
          <textarea
            id="diff-left"
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder="Enter original text..."
            spellCheck={false}
            className="w-full min-h-[280px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y transition-shadow"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="diff-right" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Modified Text
          </label>
          <textarea
            id="diff-right"
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder="Enter modified text..."
            spellCheck={false}
            className="w-full min-h-[280px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y transition-shadow"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!left && !right && (
          <button
            type="button"
            onClick={handleUseExample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Use Example
          </button>
        )}
        <button
          type="button"
          onClick={handleCompare}
          disabled={!canCompare}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Compare
        </button>
      </div>

      {/* Results */}
      <section aria-label="Comparison results">
        {diffResult === null ? (
          /* Empty state */
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Paste two texts and click Compare.
            </p>
          </div>
        ) : (
          /* Diff output */
          <div className="space-y-3">
            {/* Summary + actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden />
                  {additions} added
                </span>
                <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden />
                  {deletions} removed
                </span>
                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden />
                  {diffResult.filter((l) => l.type === "unchanged").length} unchanged
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline focus:outline-none focus-visible:underline"
                  aria-live="polite"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:underline focus:outline-none focus-visible:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Diff lines */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <pre className="max-h-96 overflow-auto p-0 m-0 text-sm font-mono" role="region" aria-label="Diff output">
                {diffResult.map((line, i) => (
                  <div
                    key={i}
                    className={`px-4 py-1 border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${
                      line.type === "added"
                        ? "bg-green-50 dark:bg-green-500/10 text-green-900 dark:text-green-200"
                        : line.type === "removed"
                          ? "bg-red-50 dark:bg-red-500/10 text-red-900 dark:text-red-200"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="inline-block w-5 text-xs opacity-60 select-none" aria-hidden>
                      {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
                    </span>
                    <span className="whitespace-pre">{line.text || "\u00A0"}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        )}
      </section>

      {/* Privacy */}
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        All processing happens locally in your browser. Nothing is sent to any server.
      </p>

      {/* FAQ */}
      {tool.faq.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Frequently Asked Questions</h2>
          <dl className="space-y-3">
            {tool.faq.map((item) => (
              <div key={item.q} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                <dt className="font-medium text-slate-900 dark:text-slate-100">{item.q}</dt>
                <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
