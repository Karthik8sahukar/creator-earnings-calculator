/**
 * Shared download utilities for the file-processing pipeline.
 *
 * Handles single-file and multi-file downloads, ZIP packaging,
 * and browser download triggers.
 */

import type { OutputFile } from "./types";

/**
 * Trigger a browser download for a single file.
 */
export function downloadFile(output: OutputFile): void {
  const url = URL.createObjectURL(output.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = output.name;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  // Clean up after a brief delay to ensure download starts
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}

/**
 * Download all output files. If there's only one file, downloads directly.
 * If there are multiple files, downloads each one sequentially.
 */
export function downloadAll(outputs: OutputFile[]): void {
  if (outputs.length === 0) return;

  if (outputs.length === 1) {
    downloadFile(outputs[0]);
    return;
  }

  // Sequential download with delay to avoid browser blocking
  outputs.forEach((output, index) => {
    setTimeout(() => downloadFile(output), index * 200);
  });
}

/**
 * Create a suggested output filename based on the tool and input files.
 */
export function suggestOutputName(
  toolSlug: string,
  inputFiles: File[],
  extension = "pdf",
): string {
  if (inputFiles.length === 1) {
    const baseName = inputFiles[0].name.replace(/\.[^.]+$/, "");
    return `${baseName}-${toolSlug}.${extension}`;
  }
  return `${toolSlug}-output.${extension}`;
}

/**
 * Get file size as a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
