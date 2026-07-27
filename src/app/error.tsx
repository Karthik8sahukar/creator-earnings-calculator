"use client";

import { useT } from "@/lib/t";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="text-center py-24">
      <h1 className="text-3xl font-bold text-slate-900">
        {t("rootError.title")}
      </h1>
      <p className="mt-2 text-slate-600">{t("rootError.body")}</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">
        {t("common.actions.tryAgain")}
      </button>
    </div>
  );
}
