"use client";

import { usePipeline } from "@/lib/file-tools/pipeline";
import type { PdfToolDef, OutputFile } from "@/lib/file-tools/types";
import { getRelatedPdfTools } from "@/lib/file-tools/registry";
import { FileDropzone } from "./FileDropzone";
import { FileList } from "./FileList";
import { DownloadCard } from "./DownloadCard";
import Link from "next/link";

interface Props {
  /** The tool definition from the registry. */
  tool: PdfToolDef;
  /** The tool-specific options/configuration UI. */
  children?: React.ReactNode;
  /** Called when user clicks "Process". Returns output files. */
  onProcess: (files: File[], options?: Record<string, unknown>) => Promise<OutputFile[]>;
  /** Label for the process button. */
  processLabel?: string;
  /** Whether files should be reorderable. */
  reorderable?: boolean;
}

/**
 * PdfToolPage — The shared page shell for ALL PDF tools.
 *
 * Provides the complete pipeline UI:
 * 1. Hero/description
 * 2. File upload (drag & drop)
 * 3. File list
 * 4. Tool-specific options (via children)
 * 5. Process button
 * 6. Download card (on success)
 * 7. Related tools
 * 8. FAQ
 *
 * Individual tools only need to provide `onProcess` and optionally
 * custom options UI via `children`.
 */
export function PdfToolPage({
  tool,
  children,
  onProcess,
  processLabel = "Process",
  reorderable = false,
}: Props) {
  const { state, addFiles, removeFile, reorderFiles, setProcessing, setComplete, setError, reset, canProcess, validationErrors } = usePipeline({
    validation: tool.validation,
  });

  const handleProcess = async () => {
    if (!canProcess) return;
    setProcessing();
    try {
      const files = state.files.map((f) => f.file);
      const output = await onProcess(files);
      setComplete(output);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed. Please try again.");
    }
  };

  const relatedTools = getRelatedPdfTools(tool.slug);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <header className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-500/10 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-300">
          PDF Tool
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {tool.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
          {tool.longDescription}
        </p>
      </header>

      {/* Upload area */}
      {state.status !== "complete" && (
        <FileDropzone
          validation={tool.validation}
          onFiles={addFiles}
          disabled={state.status === "processing"}
        />
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 p-4" role="alert">
          <ul className="space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i} className="text-sm text-red-700 dark:text-red-300">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* File list */}
      {state.files.length > 0 && state.status !== "complete" && (
        <FileList
          files={state.files}
          onRemove={removeFile}
          reorderable={reorderable}
          onReorder={reorderFiles}
        />
      )}

      {/* Tool-specific options */}
      {state.files.length > 0 && state.status === "ready" && children}

      {/* Process button */}
      {canProcess && state.status !== "complete" && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleProcess}
            disabled={state.status === "processing"}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 text-sm font-semibold transition-colors"
          >
            {state.status === "processing" ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Processing...
              </>
            ) : (
              processLabel
            )}
          </button>
        </div>
      )}

      {/* Error state */}
      {state.error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 p-4 text-center" role="alert">
          <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Download card (success state) */}
      {state.status === "complete" && (
        <DownloadCard outputs={state.output} onReset={reset} />
      )}

      {/* Privacy notice */}
      <div className="text-center">
        <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600" aria-hidden>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          All processing happens locally in your browser. Your files never leave your device.
        </p>
      </div>

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Related Tools</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedTools.map((rt) => (
              <Link
                key={rt.slug}
                href={rt.href}
                className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 hover:-translate-y-0.5 hover:shadow-md transition-all"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  {rt.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {rt.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {tool.faq.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Frequently Asked Questions
          </h2>
          <dl className="space-y-4">
            {tool.faq.map((item) => (
              <div key={item.q} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                <dt className="font-medium text-slate-900 dark:text-slate-100">{item.q}</dt>
                <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
