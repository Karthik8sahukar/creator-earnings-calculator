"use client";

import { useCallback } from "react";
import { CodeWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("qr-generator")!;

function generateQr(input: string): string {
  if (!input.trim()) return "Enter text or a URL to generate a QR code.";
  if (input.length > 2000) return "Error: Input too long. QR codes support up to ~2000 characters.";

  // QR code generation requires a dedicated library (e.g., 'qrcode').
  // This placeholder validates input and will be replaced with actual
  // QR rendering in a future update.
  return [
    "QR Code Generation — Coming Soon",
    "",
    `Input: ${input.substring(0, 100)}${input.length > 100 ? "..." : ""}`,
    `Length: ${input.length} characters`,
    `Type: ${input.startsWith("http") ? "URL" : "Plain text"}`,
    "",
    "Full QR code rendering with PNG/SVG download will be available",
    "in a future update using a browser-local QR library.",
  ].join("\n");
}

export function QrGeneratorClient() {
  const handleProcess = useCallback((input: string): string => {
    return generateQr(input);
  }, []);

  return (
    <CodeWorkspace
      title={tool.title}
      description={tool.longDescription}
      onProcess={handleProcess}
      processLabel="Generate"
      faq={tool.faq}
    />
  );
}
