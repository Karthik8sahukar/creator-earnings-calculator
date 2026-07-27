"use client";

import { useCallback, useState } from "react";

interface Props {
  /** The URL to share. Defaults to the current page URL. */
  url?: string;
  /** Title for the share dialog. */
  title?: string;
  /** Description text for the share dialog. */
  text?: string;
  /** Additional className. */
  className?: string;
}

/**
 * ShareButton — reusable share component.
 *
 * Strategy:
 *   1. If native Web Share API is available (mobile), use it.
 *   2. Otherwise, copy the URL to clipboard.
 *   3. Show feedback (checkmark or "Copied!") for 2 seconds.
 *
 * Accessible: has aria-label, shows status via aria-live region.
 */
export function ShareButton({ url, title, text, className = "" }: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const handleShare = useCallback(async () => {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

    // Try native Web Share API first (primarily mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: title ?? document.title,
          text: text ?? "",
          url: shareUrl,
        });
        setStatus("shared");
        setTimeout(() => setStatus("idle"), 2000);
        return;
      } catch (err) {
        // User cancelled or API unavailable — fall through to clipboard
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("copied");
    } catch {
      // execCommand fallback for older browsers
      try {
        const input = document.createElement("input");
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        setStatus("copied");
      } catch {
        setStatus("error");
      }
    }

    setTimeout(() => setStatus("idle"), 2000);
  }, [url, title, text]);

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={status === "copied" ? "Link copied" : status === "shared" ? "Shared" : "Share this tool"}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 ${className}`}
    >
      {status === "copied" ? (
        <>
          <CheckIcon />
          <span>Copied!</span>
        </>
      ) : status === "shared" ? (
        <>
          <CheckIcon />
          <span>Shared</span>
        </>
      ) : (
        <>
          <ShareIcon />
          <span>Share</span>
        </>
      )}
      <span className="sr-only" aria-live="polite">
        {status === "copied" ? "Link copied to clipboard" : ""}
      </span>
    </button>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
