"use client";

import { useCallback } from "react";
import { PdfToolPage } from "@/components/file-tools";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import type { OutputFile } from "@/lib/file-tools/types";

const tool = getPdfToolBySlug("rotate-pdf")!;

/**
 * Rotate PDF — client component.
 *
 * Rotates all pages 90 degrees clockwise. A future iteration will allow
 * per-page rotation selection via thumbnails.
 */
export function RotatePdfClient() {
  const handleProcess = useCallback(async (files: File[]): Promise<OutputFile[]> => {
    const { PDFDocument, degrees } = await import("pdf-lib");

    const bytes = await files[0].arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const pages = pdf.getPages();

    for (const page of pages) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees(currentRotation + 90));
    }

    const outputBytes = await pdf.save();
    const blob = new Blob([outputBytes], { type: "application/pdf" });

    return [{
      name: "rotated.pdf",
      blob,
      type: "application/pdf",
      size: blob.size,
    }];
  }, []);

  return (
    <PdfToolPage
      tool={tool}
      onProcess={handleProcess}
      processLabel="Rotate PDF"
    />
  );
}
