"use client";

import { useCallback, useState } from "react";
import { PdfToolPage } from "@/components/file-tools";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import type { OutputFile } from "@/lib/file-tools/types";

const tool = getPdfToolBySlug("add-watermark")!;

/**
 * Add Watermark — client component.
 *
 * Adds a diagonal text watermark to every page of the uploaded PDF.
 * Users can customize the watermark text (defaults to "DRAFT").
 */
export function AddWatermarkClient() {
  const [watermarkText, setWatermarkText] = useState("DRAFT");

  const handleProcess = useCallback(async (files: File[]): Promise<OutputFile[]> => {
    const { PDFDocument, rgb, degrees, StandardFonts } = await import("pdf-lib");

    const bytes = await files[0].arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const pages = pdf.getPages();
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    const text = watermarkText.trim() || "DRAFT";

    for (const page of pages) {
      const { width, height } = page.getSize();
      const fontSize = Math.min(width, height) * 0.12;
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      // Center the watermark on the page, rotated 45 degrees
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: (height - textHeight) / 2,
        size: fontSize,
        font,
        color: rgb(0.75, 0.75, 0.75),
        rotate: degrees(45),
        opacity: 0.3,
      });
    }

    const outputBytes = await pdf.save();
    const blob = new Blob([outputBytes], { type: "application/pdf" });

    return [{
      name: "watermarked.pdf",
      blob,
      type: "application/pdf",
      size: blob.size,
    }];
  }, [watermarkText]);

  return (
    <PdfToolPage
      tool={tool}
      onProcess={handleProcess}
      processLabel="Add Watermark"
    >
      <div className="max-w-sm mx-auto space-y-2">
        <label
          htmlFor="watermark-text"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Watermark Text
        </label>
        <input
          id="watermark-text"
          type="text"
          value={watermarkText}
          onChange={(e) => setWatermarkText(e.target.value)}
          placeholder="DRAFT"
          maxLength={50}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enter custom watermark text (max 50 characters).
        </p>
      </div>
    </PdfToolPage>
  );
}
