"use client";

/** Shared type for history entries across all Decision Tools. */
export type HistoryColor = "green" | "red" | "blue" | "neutral";

export interface HistoryItem {
  label: string;
  color?: HistoryColor;
}

interface Props {
  entries: HistoryItem[];
  onClear: () => void;
  title?: string;
}

const COLOR_MAP: Record<HistoryColor, string> = {
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

/**
 * Scrollable history panel showing recent results as colored badges.
 */
export function HistoryPanel({ entries, onClear, title = "History" }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="card p-6 sm:p-8 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {entries.map((entry, i) => (
          <span
            key={i}
            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${
              COLOR_MAP[entry.color ?? "neutral"]
            }`}
          >
            {entry.label}
          </span>
        ))}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {entries.length} result{entries.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
