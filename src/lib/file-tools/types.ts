/**
 * Shared types for the file-processing pipeline.
 *
 * Every PDF tool uses the same upload → validate → preview → process → download
 * pipeline. These types enforce consistency across all tools.
 */

// ─── File State Machine ─────────────────────────────────────────────

export type FileStatus =
  | "idle"
  | "uploading"
  | "validating"
  | "ready"
  | "processing"
  | "complete"
  | "error";

export interface FileEntry {
  /** Unique identifier for this file in the pipeline. */
  id: string;
  /** Original File object from the browser. */
  file: File;
  /** Current pipeline status. */
  status: FileStatus;
  /** Human-readable name. */
  name: string;
  /** File size in bytes. */
  size: number;
  /** MIME type. */
  type: string;
  /** Upload progress (0-100). */
  uploadProgress: number;
  /** Processing progress (0-100). */
  processProgress: number;
  /** Error message if status === 'error'. */
  error?: string;
  /** Object URL for preview (revoked on cleanup). */
  previewUrl?: string;
  /** Page count for PDFs. */
  pageCount?: number;
  /** Thumbnail URLs for individual pages. */
  pageThumbnails?: string[];
}

// ─── Validation ─────────────────────────────────────────────────────

export interface ValidationRule {
  /** Accepted MIME types. */
  acceptedTypes: string[];
  /** Human-readable format names for UI display. */
  acceptedFormats: string[];
  /** Maximum file size in bytes. */
  maxFileSize: number;
  /** Maximum number of files allowed. */
  maxFiles: number;
  /** Maximum total pages across all files (for PDF tools). */
  maxPages?: number;
  /** Minimum number of files required. */
  minFiles?: number;
}

export interface ValidationError {
  code:
    | "INVALID_TYPE"
    | "FILE_TOO_LARGE"
    | "TOO_MANY_FILES"
    | "TOO_FEW_FILES"
    | "EMPTY_FILE"
    | "CORRUPT_FILE"
    | "TOO_MANY_PAGES"
    | "UNSUPPORTED_FORMAT"
    | "PASSWORD_PROTECTED";
  message: string;
  /** The file that caused the error, if applicable. */
  fileName?: string;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: ValidationError[] };

// ─── Processing ─────────────────────────────────────────────────────

export interface ProcessingOptions {
  /** Tool-specific configuration (varies per tool). */
  [key: string]: unknown;
}

export interface ProcessingResult {
  /** Whether processing succeeded. */
  success: boolean;
  /** Output file(s) as Blob(s). */
  outputFiles?: OutputFile[];
  /** Error message on failure. */
  error?: string;
}

export interface OutputFile {
  /** Suggested file name. */
  name: string;
  /** File content as Blob. */
  blob: Blob;
  /** MIME type. */
  type: string;
  /** File size in bytes. */
  size: number;
}

// ─── Tool Definition ────────────────────────────────────────────────

export interface PdfToolDef {
  /** URL slug (e.g. "merge-pdf"). */
  slug: string;
  /** Display title. */
  title: string;
  /** Short description for cards. */
  description: string;
  /** Long description for the tool page hero. */
  longDescription: string;
  /** Route path (e.g. "/tools/merge-pdf"). */
  href: string;
  /** Category icon identifier. */
  icon: string;
  /** Validation rules for this tool. */
  validation: ValidationRule;
  /** Related tool slugs. */
  relatedTools: string[];
  /** SEO keywords. */
  keywords: string[];
  /** FAQ items. */
  faq: Array<{ q: string; a: string }>;
}

// ─── Pipeline Hook State ────────────────────────────────────────────

export interface PipelineState {
  /** Current files in the pipeline. */
  files: FileEntry[];
  /** Overall pipeline status. */
  status: FileStatus;
  /** Output files ready for download. */
  output: OutputFile[];
  /** Global error message. */
  error?: string;
}

export type PipelineAction =
  | { type: "ADD_FILES"; files: File[] }
  | { type: "REMOVE_FILE"; id: string }
  | { type: "REORDER_FILES"; fromIndex: number; toIndex: number }
  | { type: "SET_FILE_STATUS"; id: string; status: FileStatus; error?: string }
  | { type: "SET_FILE_PROGRESS"; id: string; progress: number }
  | { type: "SET_FILE_PAGE_COUNT"; id: string; pageCount: number }
  | { type: "SET_STATUS"; status: FileStatus; error?: string }
  | { type: "SET_OUTPUT"; output: OutputFile[] }
  | { type: "RESET" };
