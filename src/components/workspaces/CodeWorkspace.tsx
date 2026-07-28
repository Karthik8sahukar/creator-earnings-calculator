"use client";

import { useCallback, useState } from "react";

interface Props {
  /** Page title shown in header. */
  title: string;
  /** Short description under title. */
  description: string;
  /** Input textarea label. */
  inputLabel?: string;
  /** Input placeholder text. */
  inputPlaceholder?: string;
  /** Output textarea label. */
  outputLabel?: string;
  /** Process button label. */
  processLabel?: string;
  /** Process function: takes input string, returns output string. */
  onProcess: (input: string) => string | Promise<string>;
  /** Whether to auto-process on input change (vs. manual button). */
  autoProcess?: boolean;
  /** Input language hint for monospace styling. */
  inputLang?: string;
  /** Output language hint. */
  outputLang?: string;
  /** Additional options UI rendered between input and output. */
  children?: React.ReactNode;
  /** Category badge text. */
  badge?: string;
  /** FAQ items. */
  faq?: Array<{ q: string; a: string }>;
  /** Example input text. When provided, shows a "Use Example" button. */
  exampleInput?: string;
}

/**
 * CodeWorkspace — Shared engine for code/data transformation tools.
 *
 * Used by: HTML Formatter, XML Formatter, YAML Formatter, Diff Checker,
 * Hash Generator, Markdown Preview, etc.
 *
 * Provides:
 * - Split-pane input/output layout
 * - Copy to clipboard
 * - Process button (or auto-process)
 * - Error display
 * - Mobile-responsive (stacked on small screens)
 */
export function CodeWorkspace({
  title,
  description,
  inputLabel = "Input",
  inputPlaceholder = "Paste or type here...",
  outputLabel = "Output",
  processLabel = "Format",
  onProcess,
  autoProcess = false,
  children,
  badge = "Developer Tool",
  faq,
  exampleInput,
}: Props) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const process = useCallback(async () => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const result = await onProcess(input);
      setOutput(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed.");
      setOutput("");
    }
  }, [input, onProcess]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      if (autoProcess) {
        try {
          const result = onProcess(value);
          if (typeof result === "string") {
            setOutput(result);
            setError(null);
          } else {
            result.then((r) => { setOutput(r); setError(null); }).catch((e) => { setError(e.message); setOutput(""); });
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Processing failed.");
          setOutput("");
        }
      }
    },
    [autoProcess, onProcess],
  );

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
        <p className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-600 dark:text-accent-400">
          {badge}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300">{description}</p>
      </header>

      {/* Options */}
      {children}

      {/* Editor area */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="code-input" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {inputLabel}
            </label>
            {exampleInput && !input && (
              <button
                type="button"
                onClick={() => handleInputChange(exampleInput)}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                Use Example
              </button>
            )}
          </div>
          <textarea
            id="code-input"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={inputPlaceholder}
            spellCheck={false}
            className="w-full h-64 lg:h-80 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="code-output" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {outputLabel}
            </label>
            {output && (
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <textarea
            id="code-output"
            value={error ? `Error: ${error}` : output}
            readOnly
            className={`w-full h-64 lg:h-80 rounded-lg border px-4 py-3 font-mono text-sm resize-y ${
              error
                ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            }`}
          />
        </div>
      </div>

      {/* Process button (when not auto-processing) */}
      {!autoProcess && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={process}
            disabled={!input.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 text-sm font-semibold transition-colors"
          >
            {processLabel}
          </button>
        </div>
      )}

      {/* Privacy */}
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        All processing happens locally in your browser. Nothing is sent to any server.
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
