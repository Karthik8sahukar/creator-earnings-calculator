"use client";

import { useCallback, useRef, useState } from "react";
import type { ValidationRule } from "@/lib/file-tools/types";
import { getAcceptString } from "@/lib/file-tools/validation";

interface Props {
  /** Validation rules controlling accepted types. */
  validation: ValidationRule;
  /** Called with the selected files. */
  onFiles: (files: File[]) => void;
  /** Whether the dropzone is disabled. */
  disabled?: boolean;
  /** Additional class for styling. */
  className?: string;
  /** Children to render inside the dropzone. */
  children?: React.ReactNode;
}

/**
 * FileDropzone — A reusable drag-and-drop file upload area.
 *
 * Supports:
 * - Drag & drop
 * - Click to browse
 * - Keyboard accessible (Enter/Space)
 * - Multiple files (based on validation.maxFiles)
 * - Mobile-friendly
 * - Visual drag-over state
 */
export function FileDropzone({
  validation,
  onFiles,
  disabled = false,
  className = "",
  children,
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        onFiles(droppedFiles);
      }
    },
    [disabled, onFiles],
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !disabled) {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files ?? []);
      if (selectedFiles.length > 0) {
        onFiles(selectedFiles);
      }
      // Reset input so re-selecting the same file works
      e.target.value = "";
    },
    [onFiles],
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Upload files. Accepted formats: ${validation.acceptedFormats.join(", ")}`}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed
        p-8 sm:p-12 transition-all duration-200 cursor-pointer
        ${isDragOver
          ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 scale-[1.01]"
          : "border-slate-300 dark:border-slate-700 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {children ?? (
        <DefaultContent
          formats={validation.acceptedFormats}
          maxFiles={validation.maxFiles}
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept={getAcceptString(validation)}
        multiple={validation.maxFiles > 1}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />
    </div>
  );
}

function DefaultContent({
  formats,
  maxFiles,
}: {
  formats: string[];
  maxFiles: number;
}) {
  return (
    <div className="text-center space-y-3">
      <div className="mx-auto w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand-600 dark:text-brand-400"
          aria-hidden
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Drag & drop files here, or <span className="text-brand-600 dark:text-brand-400">browse</span>
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {formats.join(", ")} {maxFiles > 1 ? `(up to ${maxFiles} files)` : ""}
        </p>
      </div>
    </div>
  );
}
