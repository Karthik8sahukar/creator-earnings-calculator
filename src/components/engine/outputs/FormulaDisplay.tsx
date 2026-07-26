"use client";

interface FormulaVariable {
  /** Variable name shown in the formula. */
  name: string;
  /** Current value of the variable. */
  value: string | number;
  /** Optional label explaining what the variable is. */
  label?: string;
}

interface Props {
  /** The formula expression (e.g. "RPM = Revenue / Views × 1000"). */
  formula: string;
  /** Variables used in the calculation with their current values. */
  variables?: FormulaVariable[];
  /** The computed result. */
  result?: string | number;
  /** Result label (e.g. "= $5.00"). */
  resultLabel?: string;
  /** Additional className. */
  className?: string;
}

/**
 * FormulaDisplay — Shows a mathematical formula with substituted values.
 * Helps users understand how a calculation works.
 *
 * Usage:
 *   <FormulaDisplay
 *     formula="RPM = (Revenue ÷ Views) × 1,000"
 *     variables={[
 *       { name: "Revenue", value: "$500", label: "Total earnings" },
 *       { name: "Views", value: "100,000", label: "Total video views" },
 *     ]}
 *     result="$5.00"
 *     resultLabel="Your RPM"
 *   />
 */
export function FormulaDisplay({
  formula,
  variables,
  result,
  resultLabel,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-5 space-y-4 ${className}`}
    >
      {/* Formula expression */}
      <div className="text-center">
        <p className="font-mono text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium">
          {formula}
        </p>
      </div>

      {/* Variable substitution */}
      {variables && variables.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {variables.map((v) => (
            <div
              key={v.name}
              className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-800 px-3 py-2 border border-slate-100 dark:border-slate-700"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {v.label ?? v.name}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                  {v.name}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
                {v.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Result */}
      {result !== undefined && (
        <div className="text-center pt-2 border-t border-slate-200 dark:border-slate-700">
          {resultLabel && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              {resultLabel}
            </p>
          )}
          <p className="text-xl sm:text-2xl font-bold text-brand-700 dark:text-brand-300 font-mono">
            {result}
          </p>
        </div>
      )}
    </div>
  );
}
