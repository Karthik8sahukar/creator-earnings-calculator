"use client";

import { useCallback, useState } from "react";

interface Props {
  /** Page title. */
  title: string;
  /** Short description. */
  description: string;
  /** Input textarea label. */
  inputLabel?: string;
  /** Input placeholder. */
  inputPlaceholder?: string;
  /** Output textarea label. */
  outputLabel?: string;
  /** Process function. */
  onProcess: (input: string) => string;
  /** Whether to auto-process on every keystroke. */
  autoProcess?: boolean;
  /** Process button label. */
  processLabel?: string;
  /** Additional options between input and button. */
  children?: React.ReactNode;
  /** FAQ items. */
  faq?: Array<{ q: string; a: string }>;
}

/**
 * TextWorkspace — Shared engine for text transformation tools.
 *
 * Used by: Lorem Ipsum, Case Converter, Remove Duplicates,
 * Text Compare, Slug Generator.
 *
 * Simpler than CodeWorkspace (single textarea with live output).
 * Auto-process by default for instant feedback.
 */
export function TextWorkspace({
  title,
  description,
  inputLabel = "Input",
  inputPlaceholder = "Enter text...",
  outputLabel = "Output",
  onProcess,
  autoProcess = true,
  processLabel = "Convert",
  children,
  faq,
}: Props) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      if (autoProcess && value.trim()) {
        try {
          setOutput(onProcess(value));
        } catch {
          setOutput("");
        }
      } else if (!value.trim()) {
        setOutput("");
      }
    },
    [autoProcess, onProcess],
  );

  const handleProcess = useCallback(() => {
    if (input.trim()) {
      try {
        setOutput(onProcess(input));
      } catch {
        setOutput("");
      }
    }
  }, [input, onProcess]);

  const handleCopy = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [output]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          Text Tool
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300">{description}</p>
      </header>

      {/* Options */}
      {children}

      {/* Input */}
      <div className="space-y-2">
        <label htmlFor="text-input" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {inputLabel}
        </label>
        <textarea
          id="text-input"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={inputPlaceholder}
          className="w-full h-40 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
        />
      </div>

      {/* Process button (when not auto) */}
      {!autoProcess && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleProcess}
            disabled={!input.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-8 py-3 text-sm font-semibold transition-colors"
          >
            {processLabel}
          </button>
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="text-output" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {outputLabel}
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea
            id="text-output"
            value={output}
            readOnly
            className="w-full h-40 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 resize-y"
          />
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
