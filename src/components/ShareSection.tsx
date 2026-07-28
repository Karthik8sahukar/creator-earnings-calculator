"use client";

import { useT } from "@/lib/t";
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
  url: string;
  channelTitle: string;
}

type CopyState = "idle" | "copied" | "error";

export function ShareSection({ url, channelTitle }: Props) {
  const t = useT("share");
  const tCommon = useT("common.actions");
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
      /* aborted or unsupported */
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
  const linkedInUrl = useMemo(() => buildLinkedInShareUrl({ url }), [url]);
  const whatsAppUrl = useMemo(
    () => buildWhatsAppShareUrl({ url, text: shareText }),
    [url, shareText],
  );

  const newTabLabel = tCommon("openInNewTab");

  return (
    <section
      aria-labelledby="share-title"
      data-testid="share-section"
      className="card p-5 sm:p-6"
    >
      <header className="flex items-center gap-2 mb-3">
        <ShareIcon className="text-brand-600" />
        <h2 id="share-title" className="text-base font-semibold text-slate-900">
          {t("sectionTitle")}
        </h2>
      </header>
      <p className="text-sm text-slate-500 mb-4">{t("description")}</p>

      <div className="flex flex-wrap items-center gap-2">
        {supportsWebShare && (
          <button
            type="button"
            onClick={onNativeShare}
            className="btn-primary text-sm"
            aria-label={t("shareVia", { title: channelTitle })}
          >
            <ShareIcon width={16} height={16} aria-hidden />
            {t("share")}
          </button>
        )}

        <button
          type="button"
          onClick={onCopy}
          className="btn-secondary text-sm"
          aria-describedby="share-copy-status"
          aria-label={t("copyLinkAria", { title: channelTitle })}
          data-testid="share-copy-link"
        >
          <LinkIcon width={16} height={16} aria-hidden />
          {copyState === "copied" ? t("linkCopied") : t("copyLink")}
        </button>

        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackSocial("x")}
          className="btn-secondary text-sm"
          aria-label={t("shareOnSocialAria", {
            title: channelTitle,
            network: "X",
            newTab: newTabLabel,
          })}
          data-testid="share-x"
        >
          <XLogoIcon />
          {t("shareOnX")}
        </a>

        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackSocial("linkedin")}
          className="btn-secondary text-sm"
          aria-label={t("shareOnSocialAria", {
            title: channelTitle,
            network: "LinkedIn",
            newTab: newTabLabel,
          })}
          data-testid="share-linkedin"
        >
          <LinkedInIcon />
          {t("shareOnLinkedIn")}
        </a>

        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackSocial("whatsapp")}
          className="btn-secondary text-sm"
          aria-label={t("shareOnSocialAria", {
            title: channelTitle,
            network: "WhatsApp",
            newTab: newTabLabel,
          })}
          data-testid="share-whatsapp"
        >
          <WhatsAppIcon />
          {t("shareOnWhatsApp")}
        </a>
      </div>

      <p
        id="share-copy-status"
        role="status"
        aria-live="polite"
        className="mt-3 text-xs text-slate-500 min-h-[1em]"
      >
        {copyState === "copied" && t("linkCopiedStatus")}
        {copyState === "error" && t("copyError")}
      </p>
    </section>
  );
}
