"use client";

interface Props {
  value: string;
  label?: string;
  maxHeight?: string;
}

/** Read-only code output panel with monospace font. */
export function CodeOutput({ value, label, maxHeight = "max-h-96" }: Props) {
  return (
    <div className="space-y-1">
      {label && <p className="label">{label}</p>}
      <pre className={`input font-mono text-xs whitespace-pre-wrap break-all overflow-y-auto ${maxHeight} min-h-[80px] bg-slate-50 dark:bg-slate-900/50`}>
        {value || <span className="text-slate-400 dark:text-slate-500 italic">Output will appear here</span>}
      </pre>
    </div>
  );
}
