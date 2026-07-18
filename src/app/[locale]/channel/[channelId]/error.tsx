"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Link } from "@/i18n/navigation";

export default function ChannelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    console.error("channel-page:error", { digest: error.digest });
  }, [error]);

  return (
    <div className="text-center py-24">
      <h1 className="text-3xl font-bold text-slate-900">
        {t("channelPage.errorTitle")}
      </h1>
      <p className="mt-2 text-slate-600 max-w-md mx-auto">
        {t("channelPage.errorBody")}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          {t("common.actions.tryAgain")}
        </button>
        <Link href="/" className="btn-secondary">
          {t("common.actions.backToSearch")}
        </Link>
      </div>
    </div>
  );
}
