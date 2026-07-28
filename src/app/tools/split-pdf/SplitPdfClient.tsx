"use client";

import { useCallback } from "react";
import { PdfToolPage } from "@/components/file-tools";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import type { OutputFile } from "@/lib/file-tools/types";

const tool = getPdfToolBySlug("split-pdf")!;

/**
 * Split PDF — client component.
 *
 * Extracts every page from the uploaded PDF into individual single-page PDFs.
 * Uses pdf-lib for client-side processing.
 */
export function SplitPdfClient() {
  const handleProcess = useCallback(async (files: File[]): Promise<OutputFile[]> => {
    const { PDFDocument } = await import("pdf-lib");

    const bytes = await files[0].arrayBuffer();
    const sourcePdf = await PDFDocument.load(bytes);
    const pageCount = sourcePdf.getPageCount();

    const outputs: OutputFile[] = [];

    for (let i = 0; i < pageCount; i++) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
      newPdf.addPage(copiedPage);

      const outputBytes = await newPdf.save();
      const blob = new Blob([outputBytes], { type: "application/pdf" });

      outputs.push({
        name: `page-${i + 1}.pdf`,
        blob,
        type: "application/pdf",
        size: blob.size,
      });
    }

    return outputs;
  }, []);

  return (
    <PdfToolPage
      tool={tool}
      onProcess={handleProcess}
      processLabel="Split PDF"
    />
  );
}
