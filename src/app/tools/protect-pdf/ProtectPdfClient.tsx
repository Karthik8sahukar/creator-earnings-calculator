"use client";

import { useCallback, useState } from "react";
import { PdfToolPage } from "@/components/file-tools";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import type { OutputFile } from "@/lib/file-tools/types";

const tool = getPdfToolBySlug("protect-pdf")!;

/**
 * Protect PDF — client component.
 *
 * Encrypts the uploaded PDF with a user-provided password.
 * Uses pdf-lib's built-in encryption support.
 */
export function ProtectPdfClient() {
  const [password, setPassword] = useState("");

  const handleProcess = useCallback(async (files: File[]): Promise<OutputFile[]> => {
    if (!password.trim()) {
      throw new Error("Please enter a password to protect your PDF.");
    }

    const { PDFDocument } = await import("pdf-lib");

    const bytes = await files[0].arrayBuffer();
    const pdf = await PDFDocument.load(bytes);

    const outputBytes = await pdf.save({
      userPassword: password.trim(),
      ownerPassword: password.trim(),
    });

    const blob = new Blob([outputBytes], { type: "application/pdf" });

    return [{
      name: "protected.pdf",
      blob,
      type: "application/pdf",
      size: blob.size,
    }];
  }, [password]);

  return (
    <PdfToolPage
      tool={tool}
      onProcess={handleProcess}
      processLabel="Protect PDF"
    >
      <div className="max-w-sm mx-auto space-y-2">
        <label
          htmlFor="protect-password"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Password
        </label>
        <input
          id="protect-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter a strong password"
          autoComplete="new-password"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          This password will be required to open the PDF. Choose something memorable.
        </p>
      </div>
    </PdfToolPage>
  );
}
