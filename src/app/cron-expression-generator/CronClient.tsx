"use client";

import { useMemo, useState } from "react";
import { validateCron, humanizeCron, getNextRuns, parseCron, CRON_PRESETS } from "@/lib/developer";
import { CopyButton, PrivacyBadge, ToolError } from "@/components/developer";

export function CronClient() {
  const [expr, setExpr] = useState("0 9 * * 1-5");

  const validation = useMemo(() => validateCron(expr), [expr]);
  const human = useMemo(() => (validation.valid ? humanizeCron(expr) : ""), [expr, validation.valid]);
  const nextRuns = useMemo(() => (validation.valid ? getNextRuns(expr, 5) : []), [expr, validation.valid]);
  const fields = useMemo(() => parseCron(expr), [expr]);

  const updateField = (index: number, value: string) => {
    const parts = expr.trim().split(/\s+/);
    while (parts.length < 5) parts.push("*");
    parts[index] = value;
    setExpr(parts.join(" "));
  };

  const fieldLabels = ["Minute (0-59)", "Hour (0-23)", "Day of Month (1-31)", "Month (1-12)", "Day of Week (0-7)"];
  const fieldValues = fields ? [fields.minute, fields.hour, fields.dayOfMonth, fields.month, fields.dayOfWeek] : ["*", "*", "*", "*", "*"];

  return (
    <section className="space-y-6">
      <PrivacyBadge />
      <div className="card p-6 sm:p-8 space-y-4">
        <label htmlFor="cron-input" className="label">Cron Expression</label>
        <input id="cron-input" type="text" value={expr} onChange={(e) => setExpr(e.target.value)} className="input font-mono text-sm" placeholder="* * * * *" />
        <p className={`text-xs font-medium ${validation.valid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {validation.valid ? "✓ Valid expression" : `✗ ${validation.error}`}
        </p>
        {human && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-700 dark:text-slate-300">{human}</p>
            <CopyButton text={human} label="Copy" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <CopyButton text={expr} label="Copy Expression" />
        </div>
      </div>

      <div className="card p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Presets</h2>
        <div className="flex flex-wrap gap-2">
          {CRON_PRESETS.map((p) => (
            <button key={p.expression} type="button" onClick={() => setExpr(p.expression)} className="btn-secondary text-xs">{p.label}</button>
          ))}
        </div>
      </div>

      <div className="card p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Visual Builder</h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {fieldLabels.map((label, i) => (
            <div key={i}>
              <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{label}</label>
              <input type="text" value={fieldValues[i]} onChange={(e) => updateField(i, e.target.value)} className="input font-mono text-xs" />
            </div>
          ))}
        </div>
      </div>

      {nextRuns.length > 0 && (
        <div className="card p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Next 5 Runs</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
          <ul className="space-y-1">
            {nextRuns.map((d, i) => (
              <li key={i} className="text-sm font-mono text-slate-700 dark:text-slate-300">{d.toLocaleString()}</li>
            ))}
          </ul>
        </div>
      )}
      <ToolError message={!validation.valid && expr.trim() ? validation.error || null : null} />
    </section>
  );
}
