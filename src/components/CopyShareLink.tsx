"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { track } from "@/lib/analytics";

interface Props {
  /** Absolute URL to copy. */
  url: string;
  /** Visible label. Defaults to "Copy share link". */
  label?: string;
}

/**
 * Accessible copy-to-clipboard button that surfaces success/failure state
 * via an ARIA live region. Uses the async Clipboard API where available
 * and falls back to a hidden textarea + `execCommand("copy")` for
 * environments where clipboard access is restricted.
 */
export function CopyShareLink({ url, label = "Copy share link" }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCopy = useCallback(async () => {
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for environments without the async clipboard.
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        // execCommand is deprecated but still widely supported as a fallback.
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!ok) throw new Error("copy-failed");
      }
      setState("copied");
      track({ name: "share.link_copied", target: "calculator" });
    } catch {
      setState("error");
    }
  }, [url]);

  useEffect(() => {
    if (state === "idle") return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState("idle"), 2500);
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [state]);

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onCopy}
        className="btn-secondary text-xs sm:text-sm"
        aria-describedby="share-link-status"
      >
        {state === "copied" ? "Link copied ✓" : label}
      </button>
      <span
        id="share-link-status"
        role="status"
        aria-live="polite"
        className="text-xs text-slate-500 min-w-0 truncate"
      >
        {state === "copied" && "Link copied to your clipboard."}
        {state === "error" && "Couldn't copy — you can copy the URL from the address bar."}
      </span>
    </div>
  );
}
