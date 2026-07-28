"use client";

import type { FileEntry } from "@/lib/file-tools/types";
import { formatFileSize } from "@/lib/file-tools/validation";

interface Props {
  /** Files currently in the pipeline. */
  files: FileEntry[];
  /** Called when a file should be removed. */
  onRemove: (id: string) => void;
  /** Whether files can be reordered. */
  reorderable?: boolean;
  /** Called when files are reordered. */
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

/**
 * FileList — displays files that have been added to the pipeline.
 *
 * Shows file name, size, status indicator, and remove button.
 * Supports drag-to-reorder when reorderable is true.
 */
export function FileList({ files, onRemove, reorderable = false }: Props) {
  if (files.length === 0) return null;

  return (
    <ul className="space-y-2" role="list" aria-label="Uploaded files">
      {files.map((file, index) => (
        <li
          key={file.id}
          className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3"
          draggable={reorderable}
        >
          {/* Drag handle */}
          {reorderable && (
            <span className="text-slate-400 cursor-grab" aria-hidden>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <circle cx="3" cy="3" r="1.5" />
                <circle cx="9" cy="3" r="1.5" />
                <circle cx="3" cy="9" r="1.5" />
                <circle cx="9" cy="9" r="1.5" />
              </svg>
            </span>
          )}

          {/* File icon */}
          <span className="shrink-0 w-8 h-8 rounded bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600 dark:text-red-400" aria-hidden>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </span>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {reorderable && <span className="text-slate-400 mr-1">{index + 1}.</span>}
              {file.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatFileSize(file.size)}
              {file.pageCount !== undefined && ` \u2022 ${file.pageCount} page${file.pageCount !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Status indicator */}
          {file.status === "processing" && (
            <span className="text-xs text-brand-600 dark:text-brand-400 animate-pulse">
              Processing...
            </span>
          )}
          {file.status === "error" && (
            <span className="text-xs text-red-600 dark:text-red-400">{file.error}</span>
          )}

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            aria-label={`Remove ${file.name}`}
            className="shrink-0 p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
