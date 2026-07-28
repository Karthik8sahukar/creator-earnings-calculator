"use client";

import { useCallback, useState } from "react";

interface Props {
  /** Page title. */
  title: string;
  /** Short description. */
  description: string;
  /** Left textarea label. */
  leftLabel?: string;
  /** Right textarea label. */
  rightLabel?: string;
  /** Left placeholder. */
  leftPlaceholder?: string;
  /** Right placeholder. */
  rightPlaceholder?: string;
  /** Example content for left input (used by "Use Example" button). */
  exampleLeft?: string;
  /** Example content for right input. */
  exampleRight?: string;
  /** Primary action button text. */
  primaryButton?: string;
  /** Process function: takes left and right inputs, returns result. */
  onProcess: (left: string, right: string) => string;
  /** Category badge text. */
  badge?: string;
  /** FAQ items. */
  faq?: Array<{ q: string; a: string }>;
}

/**
 * MultiInputWorkspace — Shared engine for tools that compare two texts.
 *
 * Used by: Diff Checker, Text Compare, Regex Tester.
 *
 * Provides:
 * - Side-by-side textareas (stacked on mobile)
 * - "Use Example" button
 * - Process button
 * - Output area with Copy
 * - FAQ section
 */
export function MultiInputWorkspace({
  title,
  description,
  leftLabel = "Original",
  rightLabel = "Modified",
  leftPlaceholder = "Enter text...",
  rightPlaceholder = "Enter text...",
  exampleLeft,
  exampleRight,
  primaryButton = "Compare",
  onProcess,
  badge = "Developer Tool",
  faq,
}: Props) {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const handleProcess = useCallback(() => {
    if (!left.trim() && !right.trim()) return;
    try {
      setOutput(onProcess(left, right));
    } catch (err) {
      setOutput(err instanceof Error ? `Error: ${err.message}` : "Processing failed.");
    }
  }, [left, right, onProcess]);

  const handleUseExample = useCallback(() => {
    if (exampleLeft) setLeft(exampleLeft);
    if (exampleRight) setRight(exampleRight);
    setOutput("");
  }, [exampleLeft, exampleRight]);

  const handleCopy = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [output]);

  const hasExample = Boolean(exampleLeft || exampleRight);
  const canProcess = left.trim().length > 0 || right.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-600 dark:text-accent-400">
          {badge}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300">{description}</p>
      </header>

      {/* Side-by-side inputs */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="multi-left" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {leftLabel}
          </label>
          <textarea
            id="multi-left"
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder={leftPlaceholder}
            spellCheck={false}
            className="w-full h-52 lg:h-64 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="multi-right" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {rightLabel}
          </label>
          <textarea
            id="multi-right"
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder={rightPlaceholder}
            spellCheck={false}
            className="w-full h-52 lg:h-64 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasExample && !left && !right && (
          <button
            type="button"
            onClick={handleUseExample}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Use Example
          </button>
        )}
        <button
          type="button"
          onClick={handleProcess}
          disabled={!canProcess}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2.5 text-sm font-semibold transition-colors"
        >
          {primaryButton}
        </button>
      </div>

      {/* Output */}
      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Result</p>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="w-full max-h-80 overflow-auto rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 font-mono text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}

      {/* Privacy */}
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        All processing happens locally in your browser.
      </p>

      {/* FAQ */}
      {faq && faq.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Frequently Asked Questions</h2>
          <dl className="space-y-3">
            {faq.map((item) => (
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
