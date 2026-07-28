"use client";

import { useCallback } from "react";
import { PdfToolPage } from "@/components/file-tools";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import type { OutputFile } from "@/lib/file-tools/types";

const tool = getPdfToolBySlug("add-page-numbers")!;

/**
 * Add Page Numbers — client component.
 *
 * Adds page numbers at the bottom-center of each page in the uploaded PDF.
 * Uses Helvetica font for reliable rendering.
 */
export function AddPageNumbersClient() {
  const handleProcess = useCallback(async (files: File[]): Promise<OutputFile[]> => {
    const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

    const bytes = await files[0].arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const pages = pdf.getPages();
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    const fontSize = 11;
    const bottomMargin = 30;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width } = page.getSize();
      const text = `${i + 1}`;
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: bottomMargin,
        size: fontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    const outputBytes = await pdf.save();
    const blob = new Blob([outputBytes], { type: "application/pdf" });

    return [{
      name: "numbered.pdf",
      blob,
      type: "application/pdf",
      size: blob.size,
    }];
  }, []);

  return (
    <PdfToolPage
      tool={tool}
      onProcess={handleProcess}
      processLabel="Add Page Numbers"
    />
  );
}
