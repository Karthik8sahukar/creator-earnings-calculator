"use client";

import { useCallback } from "react";

interface Props {
  content: string;
  filename: string;
  mimeType?: string;
  label?: string;
  className?: string;
}

export function DownloadButton({ content, filename, mimeType = "text/plain", label = "Download", className = "" }: Props) {
  const handleDownload = useCallback(() => {
    if (!content) return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, filename, mimeType]);

  return (
    <button type="button" onClick={handleDownload} disabled={!content} className={`btn-secondary text-xs ${className}`}>
      {label}
    </button>
  );
}
