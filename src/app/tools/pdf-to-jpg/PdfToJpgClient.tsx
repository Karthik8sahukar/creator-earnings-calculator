"use client";

import { useCallback } from "react";
import { PdfToolPage } from "@/components/file-tools";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import type { OutputFile } from "@/lib/file-tools/types";

const tool = getPdfToolBySlug("pdf-to-jpg")!;

/**
 * PDF to JPG — client component.
 *
 * Converts each PDF page to a JPG image. Uses pdf-lib to extract page
 * dimensions and creates placeholder images for now since full canvas
 * rendering of PDF content requires a PDF renderer (e.g., pdfjs-dist).
 *
 * Phase 2 will integrate pdfjs-dist for true pixel-perfect rendering.
 */
export function PdfToJpgClient() {
  const handleProcess = useCallback(async (files: File[]): Promise<OutputFile[]> => {
    const { PDFDocument } = await import("pdf-lib");

    const bytes = await files[0].arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const pageCount = pdf.getPageCount();
    const pages = pdf.getPages();
    const outputs: OutputFile[] = [];

    for (let i = 0; i < pageCount; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // Create a canvas with the page dimensions (scaled for quality)
      const scale = 2; // 2x for higher resolution
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d")!;

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Placeholder text indicating page number
      ctx.fillStyle = "#64748b";
      ctx.font = `${24 * scale}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `Page ${i + 1}`,
        canvas.width / 2,
        canvas.height / 2 - 20 * scale,
      );
      ctx.font = `${14 * scale}px system-ui, sans-serif`;
      ctx.fillText(
        `${Math.round(width)} × ${Math.round(height)} pts`,
        canvas.width / 2,
        canvas.height / 2 + 20 * scale,
      );

      // Convert canvas to JPG blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b!),
          "image/jpeg",
          0.92,
        );
      });

      outputs.push({
        name: `page-${i + 1}.jpg`,
        blob,
        type: "image/jpeg",
        size: blob.size,
      });
    }

    return outputs;
  }, []);

  return (
    <PdfToolPage
      tool={tool}
      onProcess={handleProcess}
      processLabel="Convert to JPG"
    />
  );
}
