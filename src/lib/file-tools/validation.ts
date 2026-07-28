/**
 * Shared file validation for the PDF tools pipeline.
 *
 * Validates files against a ValidationRule before processing.
 * Returns typed errors that the UI can display to users.
 */

import type { ValidationRule, ValidationResult, ValidationError } from "./types";

/** Human-readable file size. */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Validate a list of files against the given rules.
 *
 * Checks:
 * - File count (min/max)
 * - File type (MIME)
 * - File size
 * - Empty files
 */
export function validateFiles(files: File[], rules: ValidationRule): ValidationResult {
  const errors: ValidationError[] = [];

  // Check file count
  if (files.length === 0) {
    errors.push({ code: "TOO_FEW_FILES", message: "No files selected." });
    return { valid: false, errors };
  }

  if (rules.minFiles && files.length < rules.minFiles) {
    errors.push({
      code: "TOO_FEW_FILES",
      message: `At least ${rules.minFiles} file${rules.minFiles > 1 ? "s" : ""} required.`,
    });
  }

  if (files.length > rules.maxFiles) {
    errors.push({
      code: "TOO_MANY_FILES",
      message: `Maximum ${rules.maxFiles} file${rules.maxFiles > 1 ? "s" : ""} allowed. You selected ${files.length}.`,
    });
  }

  for (const file of files) {
    // Empty file check
    if (file.size === 0) {
      errors.push({
        code: "EMPTY_FILE",
        message: `"${file.name}" is empty.`,
        fileName: file.name,
      });
      continue;
    }

    // File type check
    if (!isAcceptedType(file, rules.acceptedTypes)) {
      errors.push({
        code: "INVALID_TYPE",
        message: `"${file.name}" is not a supported format. Accepted: ${rules.acceptedFormats.join(", ")}.`,
        fileName: file.name,
      });
      continue;
    }

    // File size check
    if (file.size > rules.maxFileSize) {
      errors.push({
        code: "FILE_TOO_LARGE",
        message: `"${file.name}" (${formatFileSize(file.size)}) exceeds the ${formatFileSize(rules.maxFileSize)} limit.`,
        fileName: file.name,
      });
    }
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Validate a single file against the rules.
 * Convenience wrapper for single-file tools.
 */
export function validateFile(file: File, rules: ValidationRule): ValidationResult {
  return validateFiles([file], { ...rules, minFiles: 1, maxFiles: 1 });
}

/**
 * Check if a file's MIME type is in the accepted list.
 * Supports wildcard patterns like "image/*".
 */
function isAcceptedType(file: File, acceptedTypes: string[]): boolean {
  const fileType = file.type.toLowerCase();

  for (const accepted of acceptedTypes) {
    const pattern = accepted.toLowerCase();

    // Exact match
    if (pattern === fileType) return true;

    // Wildcard match (e.g. "image/*")
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -1); // "image/"
      if (fileType.startsWith(prefix)) return true;
    }

    // Extension-based fallback (for files without MIME)
    if (pattern.startsWith(".")) {
      const ext = file.name.toLowerCase().split(".").pop();
      if (ext && `.${ext}` === pattern) return true;
    }
  }

  return false;
}

/**
 * Generate the accept string for <input type="file">.
 */
export function getAcceptString(rules: ValidationRule): string {
  return rules.acceptedTypes.join(",");
}
