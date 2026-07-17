"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  LinkIcon,
  LinkedInIcon,
  ShareIcon,
  WhatsAppIcon,
  XLogoIcon,
} from "./icons";
import { track } from "@/lib/analytics";
import {
  buildLinkedInShareUrl,
  buildWhatsAppShareUrl,
  buildXShareUrl,
  defaultChannelShareText,
} from "@/lib/share";

interface Props {
  /** Absolute URL to share (channel page). */
  url: string;
  /** Human-readable channel name — used in the share text. */
  channelTitle: string;
}

type CopyState = "idle" | "copied" | "error";

/**
 * Social-share card for a channel result.
 *
 * We include:
 *   - Native Web Share API (only rendered when `navigator.share` exists).
 *   - Copy link (with success/failure feedback via an ARIA live region).
 *   - Share to X, LinkedIn, WhatsApp — each opens in a new tab with
 *     `noopener noreferrer`.
 *
 * The default share text is generic; we never include exact estimates
 * or private data in the share message.
 */
export function ShareSection({ url, channelTitle }: Props) {
  const shareText = useMemo(
    () => defaultChannelShareText(channelTitle),
    [channelTitle],
  );

  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [supportsWebShare, setSupportsWebShare] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSupportsWebShare(
      typeof navigator !== "undefined" &&
        typeof (navigator as Navigator).share === "function",
    );
  }, []);

  useEffect(() => {
    if (copyState === "idle") return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 2500);
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [copyState]);

  const onCopy = useCallback(async () => {
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard?.writeText
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
      setCopyState("copied");
      track({ name: "share.link_copied", target: "share_section" });
    } catch {
      setCopyState("error");
    }
  }, [url]);

  const onNativeShare = useCallback(async () => {
    try {
      await (navigator as Navigator).share({
        title: channelTitle,
        text: shareText,
        url,
      });
      track({ name: "share.native_shared" });
    } catch {
      // AbortError (user cancelled) or unsupported — no-op.
    }
  }, [channelTitle, shareText, url]);

  const trackSocial = useCallback(
    (target: "x" | "linkedin" | "whatsapp") => {
      track({ name: "share.social_opened", target });
    },
    [],
  );

  const xUrl = useMemo(
    () => buildXShareUrl({ url, text: shareText }),
    [url, shareText],
  );
  const linkedInUrl = useMemo(
    () => buildLinkedInShareUrl({ url }),
    [url],
  );
  const whatsAppUrl = useMemo(
    () => buildWhatsAppShareUrl({ url, text: shareText }),
    [url, shareText],
  );

  return (
    <section
      aria-labelledby="share-title"
      data-testid="share-section"
      className="card p-5 sm:p-6"
    >
      <header className="flex items-center gap-2 mb-3">
        <ShareIcon className="text-brand-600" />
        <h2 id="share-title" className="text-base font-semibold text-slate-900">
          Share this channel
        </h2>
      </header>
      <p className="text-sm text-slate-500 mb-4">
        Public statistics only — estimates are independent and are not
        provided or verified by the channel owner, YouTube, or Google.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {supportsWebShare && (
          <button
            type="button"
            onClick={onNativeShare}
            className="btn-primary text-sm"
            aria-label={`Share ${channelTitle} via device sharing`}
          >
            <ShareIcon width={16} height={16} aria-hidden />
            Share
          </button>
        )}

        <button
          type="button"
          onClick={onCopy}
          className="btn-secondary text-sm"
          aria-describedby="share-copy-status"
          aria-label={`Copy link to ${channelTitle}`}
          data-testid="share-copy-link"
        >
          <LinkIcon width={16} height={16} aria-hidden />
          {copyState === "copied" ? "Link copied ✓" : "Copy link"}
        </button>

        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackSocial("x")}
          className="btn-secondary text-sm"
          aria-label={`Share ${channelTitle} on X (opens in a new tab)`}
          data-testid="share-x"
        >
          <XLogoIcon />
          Share on X
        </a>

        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackSocial("linkedin")}
          className="btn-secondary text-sm"
          aria-label={`Share ${channelTitle} on LinkedIn (opens in a new tab)`}
          data-testid="share-linkedin"
        >
          <LinkedInIcon />
          Share on LinkedIn
        </a>

        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackSocial("whatsapp")}
          className="btn-secondary text-sm"
          aria-label={`Share ${channelTitle} on WhatsApp (opens in a new tab)`}
          data-testid="share-whatsapp"
        >
          <WhatsAppIcon />
          Share on WhatsApp
        </a>
      </div>

      <p
        id="share-copy-status"
        role="status"
        aria-live="polite"
        className="mt-3 text-xs text-slate-500 min-h-[1em]"
      >
        {copyState === "copied" && "Link copied to your clipboard."}
        {copyState === "error" &&
          "Couldn't copy — you can copy the URL from the address bar."}
      </p>
    </section>
  );
}
