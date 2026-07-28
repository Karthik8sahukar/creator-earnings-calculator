"use client";

import { useCallback } from "react";
import { PdfToolPage } from "@/components/file-tools";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import type { OutputFile } from "@/lib/file-tools/types";

const tool = getPdfToolBySlug("merge-pdf")!;

/**
 * Merge PDF — client component.
 *
 * Uses the shared PdfToolPage shell with a custom onProcess handler.
 * The actual PDF merging is done client-side using pdf-lib.
 */
export function MergePdfClient() {
  const handleProcess = useCallback(async (files: File[]): Promise<OutputFile[]> => {
    // Dynamic import to keep the initial bundle small
    const { PDFDocument } = await import("pdf-lib");

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      for (const page of pages) {
        mergedPdf.addPage(page);
      }
    }

    const outputBytes = await mergedPdf.save();
    const blob = new Blob([outputBytes], { type: "application/pdf" });

    return [{
      name: "merged.pdf",
      blob,
      type: "application/pdf",
      size: blob.size,
    }];
  }, []);

  return (
    <PdfToolPage
      tool={tool}
      onProcess={handleProcess}
      processLabel="Merge PDFs"
      reorderable
    />
  );
}
