"use client";

import type { OutputFile } from "@/lib/file-tools/types";
import { downloadFile, downloadAll, formatBytes } from "@/lib/file-tools/download";

interface Props {
  /** Output files ready for download. */
  outputs: OutputFile[];
  /** Reset to start over. */
  onReset: () => void;
}

/**
 * DownloadCard — displayed after successful processing.
 *
 * Shows the output file(s) with size info and download buttons.
 * Offers a "Start Over" button to reset the pipeline.
 */
export function DownloadCard({ outputs, onReset }: Props) {
  if (outputs.length === 0) return null;

  const totalSize = outputs.reduce((sum, o) => sum + o.size, 0);

  return (
    <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-500/10 p-6 space-y-4">
      {/* Success header */}
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-green-900 dark:text-green-100">
            Processing complete!
          </p>
          <p className="text-xs text-green-700 dark:text-green-300">
            {outputs.length} file{outputs.length > 1 ? "s" : ""} ready ({formatBytes(totalSize)})
          </p>
        </div>
      </div>

      {/* File list */}
      {outputs.length > 1 && (
        <ul className="space-y-2">
          {outputs.map((output, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2">
              <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{output.name}</span>
              <button
                type="button"
                onClick={() => downloadFile(output)}
                className="shrink-0 ml-2 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => downloadAll(outputs)}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 text-sm font-medium transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {outputs.length > 1 ? "Download All" : "Download"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Start Over
        </button>
      </div>

      {/* Privacy notice */}
      <p className="text-[11px] text-green-700 dark:text-green-400 text-center">
        All processing was done locally. Your files never left your device.
      </p>
    </div>
  );
}
