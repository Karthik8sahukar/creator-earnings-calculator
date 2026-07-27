"use client";

import { useId } from "react";

interface Props {
  /** Slider label text. */
  label: string;
  /** Current value. */
  value: number;
  /** Change handler. */
  onChange: (value: number) => void;
  /** Minimum value. */
  min: number;
  /** Maximum value. */
  max: number;
  /** Step increment. Default: 1. */
  step?: number;
  /** Help text shown below the slider. */
  hint?: string;
  /** Format function for the displayed value (e.g. "$1,000"). */
  formatValue?: (value: number) => string;
  /** Show the current value as a badge. Default: true. */
  showValue?: boolean;
  /** Disable the slider. */
  disabled?: boolean;
  /** Additional className for the container. */
  className?: string;
}

/**
 * SliderInput — Range slider with label, formatted value display,
 * and accessible labeling.
 *
 * Usage:
 *   <SliderInput
 *     label="Views"
 *     min={0}
 *     max={1000000}
 *     step={1000}
 *     value={views}
 *     onChange={setViews}
 *     formatValue={(v) => `${(v / 1000).toFixed(0)}K`}
 *   />
 */
export function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  hint,
  formatValue,
  showValue = true,
  disabled,
  className = "",
}: Props) {
  const id = useId();
  const displayed = formatValue ? formatValue(value) : String(value);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {showValue && (
          <span className="rounded-md bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
            {displayed}
          </span>
        )}
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 appearance-none cursor-pointer accent-brand-600 disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-sm"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={displayed}
      />

      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>

      {hint && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  );
}
