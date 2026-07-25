"use client";

import { useCallback, useState } from "react";

interface Props {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = "Copy", className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard || !text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* silent */ }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      className={`btn-secondary text-xs ${className}`}
      aria-label={copied ? "Copied" : label}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
