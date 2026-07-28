"use client";

import { useCallback } from "react";
import { PdfToolPage } from "@/components/file-tools";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import type { OutputFile } from "@/lib/file-tools/types";

const tool = getPdfToolBySlug("delete-pdf-pages")!;

/**
 * Delete PDF Pages — client component.
 *
 * Removes the last page from the uploaded PDF.
 * Full page selection UI (thumbnail grid with checkboxes) is Phase 2.
 */
export function DeletePdfPagesClient() {
  const handleProcess = useCallback(async (files: File[]): Promise<OutputFile[]> => {
    const { PDFDocument } = await import("pdf-lib");

    const bytes = await files[0].arrayBuffer();
    const sourcePdf = await PDFDocument.load(bytes);
    const pageCount = sourcePdf.getPageCount();

    if (pageCount <= 1) {
      throw new Error("Cannot delete pages from a single-page PDF.");
    }

    // Remove the last page
    sourcePdf.removePage(pageCount - 1);

    const outputBytes = await sourcePdf.save();
    const blob = new Blob([outputBytes], { type: "application/pdf" });

    return [{
      name: "trimmed.pdf",
      blob,
      type: "application/pdf",
      size: blob.size,
    }];
  }, []);

  return (
    <PdfToolPage
      tool={tool}
      onProcess={handleProcess}
      processLabel="Delete Pages"
    />
  );
}
