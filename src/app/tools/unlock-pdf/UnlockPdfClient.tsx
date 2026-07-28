"use client";

import { useCallback, useState } from "react";
import { PdfToolPage } from "@/components/file-tools";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import type { OutputFile } from "@/lib/file-tools/types";

const tool = getPdfToolBySlug("unlock-pdf")!;

/**
 * Unlock PDF — client component.
 *
 * Loads an encrypted PDF with the user-provided password, then saves
 * it without encryption. The user must know the password — this tool
 * does not bypass security.
 */
export function UnlockPdfClient() {
  const [password, setPassword] = useState("");

  const handleProcess = useCallback(async (files: File[]): Promise<OutputFile[]> => {
    if (!password.trim()) {
      throw new Error("Please enter the PDF password to unlock it.");
    }

    const { PDFDocument } = await import("pdf-lib");

    const bytes = await files[0].arrayBuffer();

    // Load with the provided password
    let pdf;
    try {
      pdf = await PDFDocument.load(bytes, {
        password: password.trim(),
      });
    } catch {
      throw new Error("Incorrect password or unsupported encryption. Please check your password and try again.");
    }

    // Save without encryption
    const outputBytes = await pdf.save();
    const blob = new Blob([outputBytes], { type: "application/pdf" });

    return [{
      name: "unlocked.pdf",
      blob,
      type: "application/pdf",
      size: blob.size,
    }];
  }, [password]);

  return (
    <PdfToolPage
      tool={tool}
      onProcess={handleProcess}
      processLabel="Unlock PDF"
    >
      <div className="max-w-sm mx-auto space-y-2">
        <label
          htmlFor="unlock-password"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          PDF Password
        </label>
        <input
          id="unlock-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter the PDF password"
          autoComplete="current-password"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          You must know the correct password. This tool cannot bypass encryption.
        </p>
      </div>
    </PdfToolPage>
  );
}
