import { InfoIcon } from "./icons";

export function TransparencyBanner() {
  return (
    <div
      role="note"
      aria-label="Data transparency notice"
      className="rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600 flex gap-3"
    >
      <InfoIcon className="mt-0.5 shrink-0 text-brand-600" />
      <p className="leading-relaxed">
        <span className="font-medium text-slate-800">Transparency:</span>{" "}
        Public channel statistics are retrieved using the YouTube Data API.
        Revenue estimates are independently calculated and are not provided or
        verified by YouTube or Google.
      </p>
    </div>
  );
}
