"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  LinkedInIcon,
  LinkIcon,
  ShareIcon,
  WhatsAppIcon,
  XLogoIcon,
} from "../icons";
import { track } from "@/lib/analytics";
import {
  buildLinkedInShareUrl,
  buildWhatsAppShareUrl,
  buildXShareUrl,
} from "@/lib/share";

interface Props {
  url: string;
  title: string;
}

type CopyState = "idle" | "copied" | "error";

/**
 * Blog-article share row. Mirrors the shape of `ShareSection` on the
 * channel page but scoped to the blog voice.
 */
export function ShareButtons({ url, title }: Props) {
  const t = useTranslations("blog.article.share");
  const tCommon = useTranslations("common.actions");
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
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
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
      track({ name: "share.link_copied", target: "blog_article" });
    } catch {
      setCopyState("error");
    }
  }, [url]);

  const onNativeShare = useCallback(async () => {
    try {
      await (navigator as Navigator).share({ title, url });
      track({ name: "share.native_shared" });
    } catch {
      /* aborted or unsupported */
    }
  }, [title, url]);

  const trackSocial = useCallback(
    (target: "x" | "linkedin" | "whatsapp") => {
      track({ name: "share.social_opened", target });
    },
    [],
  );

  const xUrl = buildXShareUrl({ url, text: title });
  const linkedInUrl = buildLinkedInShareUrl({ url });
  const whatsAppUrl = buildWhatsAppShareUrl({ url, text: title });
  const newTabLabel = tCommon("openInNewTab");

  return (
    <section aria-labelledby="share-title" className="not-prose">
      <h2 id="share-title" className="sr-only">
        {t("title")}
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        {supportsWebShare && (
          <button
            type="button"
            onClick={onNativeShare}
            aria-label={t("shareVia", { title })}
            className="btn-secondary text-sm"
          >
            <ShareIcon width={16} height={16} aria-hidden />
            {t("share")}
          </button>
        )}
        <button
          type="button"
          onClick={onCopy}
          aria-describedby="share-status"
          className="btn-secondary text-sm"
        >
          <LinkIcon width={16} height={16} aria-hidden />
          {copyState === "copied" ? t("linkCopied") : t("copyLink")}
        </button>
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackSocial("x")}
          aria-label={t("shareOnSocial", {
            network: "X",
            newTab: newTabLabel,
          })}
          className="btn-secondary text-sm"
        >
          <XLogoIcon />
          <span className="sr-only sm:not-sr-only">X</span>
        </a>
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackSocial("linkedin")}
          aria-label={t("shareOnSocial", {
            network: "LinkedIn",
            newTab: newTabLabel,
          })}
          className="btn-secondary text-sm"
        >
          <LinkedInIcon />
          <span className="sr-only sm:not-sr-only">LinkedIn</span>
        </a>
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackSocial("whatsapp")}
          aria-label={t("shareOnSocial", {
            network: "WhatsApp",
            newTab: newTabLabel,
          })}
          className="btn-secondary text-sm"
        >
          <WhatsAppIcon />
          <span className="sr-only sm:not-sr-only">WhatsApp</span>
        </a>
      </div>
      <p
        id="share-status"
        role="status"
        aria-live="polite"
        className="mt-2 text-xs text-slate-500 dark:text-slate-500 min-h-[1em]"
      >
        {copyState === "copied" && t("linkCopiedStatus")}
        {copyState === "error" && t("copyError")}
      </p>
    </section>
  );
}
