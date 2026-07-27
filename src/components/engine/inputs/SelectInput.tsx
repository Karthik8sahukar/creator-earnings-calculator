"use client";

import { useId } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  /** Select label text. */
  label: string;
  /** Current value. */
  value: string;
  /** Change handler. */
  onChange: (value: string) => void;
  /** Available options. */
  options: SelectOption[];
  /** Placeholder text (shown as first disabled option). */
  placeholder?: string;
  /** Help text shown below the select. */
  hint?: string;
  /** Disable the select. */
  disabled?: boolean;
  /** Error message. */
  error?: string;
  /** Additional className for the container. */
  className?: string;
}

/**
 * SelectInput — Standardized dropdown select with label,
 * validation states, and accessible labeling.
 *
 * Usage:
 *   <SelectInput
 *     label="Niche"
 *     options={[{ value: "tech", label: "Technology" }]}
 *     value={niche}
 *     onChange={setNiche}
 *   />
 */
export function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder,
  hint,
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

      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-xl border ${error ? "border-red-300 dark:border-red-700" : "border-slate-200 dark:border-slate-700"} bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-brand-500 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 focus:outline-none disabled:opacity-50`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

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
