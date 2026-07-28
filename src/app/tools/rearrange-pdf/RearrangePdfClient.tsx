"use client";

import { useCallback } from "react";
import { PdfToolPage } from "@/components/file-tools";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import type { OutputFile } from "@/lib/file-tools/types";

const tool = getPdfToolBySlug("rearrange-pdf")!;

/**
 * Rearrange PDF — client component.
 *
 * Copies pages in uploaded order. Full drag-reorder via PdfPageGrid is Phase 2.
 * For now the pipeline's FileList reorderable prop is used for file-level reorder;
 * page-level reorder will use a thumbnail grid in a future iteration.
 */
export function RearrangePdfClient() {
  const handleProcess = useCallback(async (files: File[]): Promise<OutputFile[]> => {
    const { PDFDocument } = await import("pdf-lib");

    const bytes = await files[0].arrayBuffer();
    const sourcePdf = await PDFDocument.load(bytes);
    const pageCount = sourcePdf.getPageCount();

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());

    for (let i = 0; i < pageCount; i++) {
      newPdf.addPage(copiedPages[i]);
    }

    const outputBytes = await newPdf.save();
    const blob = new Blob([outputBytes], { type: "application/pdf" });

    return [{
      name: "rearranged.pdf",
      blob,
      type: "application/pdf",
      size: blob.size,
    }];
  }, []);

  return (
    <PdfToolPage
      tool={tool}
      onProcess={handleProcess}
      processLabel="Save Rearranged PDF"
      reorderable
    />
  );
}
