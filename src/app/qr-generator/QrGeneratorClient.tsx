"use client";

import { useCallback } from "react";
import { CodeWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("qr-generator")!;

function generateQr(input: string): string {
  return `QR Code data: ${input}\n\n(Full QR rendering requires the 'qrcode' library — coming soon)`;
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
