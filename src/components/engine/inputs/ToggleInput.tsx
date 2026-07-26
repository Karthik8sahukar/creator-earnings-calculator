"use client";

import { useId } from "react";

interface Props {
  /** Toggle label text. */
  label: string;
  /** Current state. */
  checked: boolean;
  /** Change handler. */
  onChange: (checked: boolean) => void;
  /** Help text shown beside or below the toggle. */
  hint?: string;
  /** Disable the toggle. */
  disabled?: boolean;
  /** Additional className for the container. */
  className?: string;
}

/**
 * ToggleInput — On/off switch with label and accessible labeling.
 *
 * Usage:
 *   <ToggleInput label="Sort keys" checked={sortKeys} onChange={setSortKeys} />
 */
export function ToggleInput({
  label,
  checked,
  onChange,
  hint,
  disabled,
  className = "",
}: Props) {
  const id = useId();

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <div className="space-y-0.5">
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
          {label}
        </label>
        {hint && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        )}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? "bg-brand-600" : "bg-slate-200 dark:bg-slate-700"
        }`}
      >
        <span
          aria-hidden
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
