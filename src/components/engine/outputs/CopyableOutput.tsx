"use client";

import { useCallback, useState } from "react";

interface Props {
  /** The text content to display and copy. */
  value: string;
  /** Label above the output. */
  label?: string;
  /** Number of visible rows (for multi-line). Default: 3. */
  rows?: number;
  /** Whether to use monospace font. Default: true. */
  mono?: boolean;
  /** Additional className. */
  className?: string;
}

/**
 * CopyableOutput — A read-only output area with a one-click copy button.
 * Ideal for formatted text, generated code, encoded strings, etc.
 *
 * Usage:
 *   <CopyableOutput label="Formatted JSON" value={formatted} rows={10} />
 */
export function CopyableOutput({
  value,
  label,
  rows = 3,
  mono = true,
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / insecure contexts
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [value]);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              copied
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
            aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
          >
            {copied ? (
              <>
                <CheckIcon />
                Copied
              </>
            ) : (
              <>
                <CopyIcon />
                Copy
              </>
            )}
          </button>
        </div>
      )}

      <div className="relative">
        <textarea
          readOnly
          value={value}
          rows={rows}
          className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 resize-none focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${
            mono ? "font-mono text-xs leading-relaxed" : ""
          }`}
          aria-label={label ?? "Output"}
        />

        {!label && (
          <button
            type="button"
            onClick={handleCopy}
            className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
              copied
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "bg-white/90 dark:bg-slate-800/90 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700"
            }`}
            aria-label={copied ? "Copied" : "Copy"}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
