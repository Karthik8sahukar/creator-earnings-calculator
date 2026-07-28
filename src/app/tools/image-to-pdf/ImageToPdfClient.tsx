"use client";

import { useCallback } from "react";
import { PdfToolPage } from "@/components/file-tools";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import type { OutputFile } from "@/lib/file-tools/types";

const tool = getPdfToolBySlug("image-to-pdf")!;

/** A4 dimensions in points (72 DPI). */
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_MARGIN = 40;

/**
 * Image to PDF — client component.
 *
 * Creates a PDF from uploaded images. Each image is placed on a new A4 page,
 * scaled to fit within margins while maintaining aspect ratio.
 */
export function ImageToPdfClient() {
  const handleProcess = useCallback(async (files: File[]): Promise<OutputFile[]> => {
    const { PDFDocument } = await import("pdf-lib");

    const pdf = await PDFDocument.create();

    for (const file of files) {
      const imageBytes = await file.arrayBuffer();

      let image;
      if (file.type === "image/png") {
        image = await pdf.embedPng(imageBytes);
      } else {
        // JPG and WebP both handled as JPEG (WebP converted by browser canvas if needed)
        image = await pdf.embedJpg(imageBytes);
      }

      const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);

      // Scale image to fit within margins, preserving aspect ratio
      const maxWidth = A4_WIDTH - PAGE_MARGIN * 2;
      const maxHeight = A4_HEIGHT - PAGE_MARGIN * 2;
      const imgDims = image.scale(1);

      let drawWidth = imgDims.width;
      let drawHeight = imgDims.height;

      if (drawWidth > maxWidth || drawHeight > maxHeight) {
        const scale = Math.min(maxWidth / drawWidth, maxHeight / drawHeight);
        drawWidth *= scale;
        drawHeight *= scale;
      }

      // Center the image on the page
      const x = (A4_WIDTH - drawWidth) / 2;
      const y = (A4_HEIGHT - drawHeight) / 2;

      page.drawImage(image, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });
    }

    const outputBytes = await pdf.save();
    const blob = new Blob([outputBytes], { type: "application/pdf" });

    return [{
      name: "images.pdf",
      blob,
      type: "application/pdf",
      size: blob.size,
    }];
  }, []);

  return (
    <PdfToolPage
      tool={tool}
      onProcess={handleProcess}
      processLabel="Convert to PDF"
    />
  );
}
