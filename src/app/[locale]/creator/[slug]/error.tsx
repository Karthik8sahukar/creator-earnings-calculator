"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Link } from "@/i18n/navigation";

/**
 * Error boundary for `/creator/[slug]`. In practice this is rarely
 * reached — `getCreatorProfile()` catches every `YouTubeApiError`
 * and renders a fallback page instead of throwing. This boundary
 * only kicks in for truly unexpected failures (bad slug lookup,
 * component render error, etc.).
 */
export default function CreatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    console.error("creator-page:error", { digest: error.digest });
  }, [error]);

  return (
    <div className="text-center py-24">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
        {t("creator.error.title")}
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-md mx-auto">
        {t("creator.error.body")}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          {t("common.actions.tryAgain")}
        </button>
        <Link href="/creators" className="btn-secondary">
          {t("creator.error.browseAll")}
        </Link>
      </div>
    </div>
  );
}
