"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Link } from "@/i18n/navigation";

/**
 * Route-level error boundary for the Channel Analyzer.
 *
 * `analyzeChannel` is designed never to throw, so this boundary is a
 * defense-in-depth safety net for unrelated failures (component
 * render errors, downstream `<Script>` mishaps, etc.). Rendering an
 * inline "try again" panel is friendlier than the site-wide error
 * page — the user's context (they just typed a URL) is preserved.
 */
export default function ChannelAnalyzerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("tools.channelAnalyzer.routeError");
  const tCommon = useTranslations("common.actions");

  useEffect(() => {
    // Digest is a stable server-side ID; safe to log.
    console.error("channel-analyzer:route-error", { digest: error.digest });
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
        {t("title")}
      </h1>
      <p className="text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
        {t("body")}
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <button type="button" onClick={reset} className="btn-primary">
          {tCommon("tryAgain")}
        </button>
        <Link href="/tools/channel-analyzer" className="btn-secondary">
          {t("startOver")}
        </Link>
      </div>
    </div>
  );
}
