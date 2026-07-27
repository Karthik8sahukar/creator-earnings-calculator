"use client";

import { useT } from "@/lib/t";
import { useCallback, useEffect, useRef, useState } from "react";

import { track } from "@/lib/analytics";

interface Props {
  url: string;
  label?: string;
}

export function CopyShareLink({ url, label }: Props) {
  const t = useT("copyShare");
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
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
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

  const buttonLabel = label ?? t("label");

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onCopy}
        className="btn-secondary text-xs sm:text-sm"
        aria-describedby="share-link-status"
      >
        {state === "copied" ? t("copied") : buttonLabel}
      </button>
      <span
        id="share-link-status"
        role="status"
        aria-live="polite"
        className="text-xs text-slate-500 min-w-0 truncate"
      >
        {state === "copied" && t("copiedStatus")}
        {state === "error" && t("error")}
      </span>
    </div>
  );
}
