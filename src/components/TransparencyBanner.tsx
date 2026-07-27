import { useT } from "@/lib/t";

import { InfoIcon } from "./icons";

export function TransparencyBanner() {
  const t = useT("transparency");
  return (
    <div
      role="note"
      aria-label={t("aria")}
      className="rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600 flex gap-3"
    >
      <InfoIcon className="mt-0.5 shrink-0 text-brand-600" />
      <p className="leading-relaxed">
        <span className="font-medium text-slate-800">{t("prefix")}</span>{" "}
        {t("body")}
      </p>
    </div>
  );
}
