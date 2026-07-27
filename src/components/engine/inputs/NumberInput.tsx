"use client";

import { useId } from "react";

interface Props {
  /** Input label text. */
  label: string;
  /** Current value. */
  value: number | string;
  /** Change handler. */
  onChange: (value: number) => void;
  /** Minimum allowed value. */
  min?: number;
  /** Maximum allowed value. */
  max?: number;
  /** Step increment. */
  step?: number;
  /** Placeholder text. */
  placeholder?: string;
  /** Help text shown below the input. */
  hint?: string;
  /** Prefix displayed inside the input (e.g. "$"). */
  prefix?: string;
  /** Suffix displayed inside the input (e.g. "views"). */
  suffix?: string;
  /** Disable the input. */
  disabled?: boolean;
  /** Error message (shows red border + message). */
  error?: string;
  /** Additional className for the container. */
  className?: string;
}

/**
 * NumberInput — Standardized numeric input with label, prefix/suffix,
 * validation states, and accessible labeling.
 *
 * Usage:
 *   <NumberInput label="Revenue" prefix="$" value={revenue} onChange={setRevenue} />
 */
export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  hint,
  prefix,
  suffix,
  disabled,
  error,
  className = "",
}: Props) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <div className={`flex items-center rounded-xl border ${error ? "border-red-300 dark:border-red-700" : "border-slate-200 dark:border-slate-700"} bg-white dark:bg-slate-900 transition-colors focus-within:border-brand-500 dark:focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/20`}>
        {prefix && (
          <span className="pl-3 text-sm text-slate-500 dark:text-slate-400 select-none">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && (
          <span className="pr-3 text-sm text-slate-500 dark:text-slate-400 select-none">
            {suffix}
          </span>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
