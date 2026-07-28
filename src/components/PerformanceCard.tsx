import { useT } from "@/lib/t";

import { ChartIcon, EyeIcon, FilmIcon, SparklesIcon } from "./icons";
import { formatCompact, formatNumber } from "@/lib/format";
import type { PerformanceAnalysis } from "@/types/youtube";

export function PerformanceCard({ analysis }: { analysis: PerformanceAnalysis }) {
  const t = useT("performance");

  const rows: [string, string, string?][] = [
    [
      t("rows.averageRecent"),
      formatCompact(analysis.averageRecentViews),
      formatNumber(analysis.averageRecentViews),
    ],
    [
      t("rows.medianRecent"),
      formatCompact(analysis.medianRecentViews),
      formatNumber(analysis.medianRecentViews),
    ],
    [t("rows.uploads30"), `${analysis.uploadsLast30Days}`],
    [t("rows.uploads90"), `${analysis.uploadsLast90Days}`],
    [
      t("rows.recentObserved"),
      formatCompact(analysis.recentObservedViews),
      formatNumber(analysis.recentObservedViews),
    ],
    [t("rows.sampleSize"), t("rows.sampleSizeValue", { count: analysis.sampleSize })],
  ];

  return (
    <section aria-labelledby="perf-title" className="card p-6 sm:p-8">
      <header className="flex items-center gap-2 mb-4">
        <ChartIcon className="text-brand-600" />
        <h2 id="perf-title" className="text-lg font-semibold text-slate-900">
          {t("title")}
        </h2>
      </header>
      <p className="text-sm text-slate-500 mb-6">
        {t("sampleNote", { count: analysis.sampleSize })}
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Estimate
          label={t("estimateLow")}
          value={formatCompact(analysis.monthlyViewEstimate.low)}
          tone="low"
        />
        <Estimate
          label={t("estimateExpected")}
          value={formatCompact(analysis.monthlyViewEstimate.expected)}
          tone="expected"
          highlight
        />
        <Estimate
          label={t("estimateHigh")}
          value={formatCompact(analysis.monthlyViewEstimate.high)}
          tone="high"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <dl className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-white">
          {rows.map(([label, value, title]) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-2.5 text-sm"
              title={title}
            >
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-semibold text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
        <ContentMix
          shorts={analysis.shortsPercentage}
          longForm={analysis.longFormPercentage}
        />
      </div>
    </section>
  );
}

function Estimate({
  label,
  value,
  tone,
  highlight,
}: {
  label: string;
  value: string;
  tone: "low" | "expected" | "high";
  highlight?: boolean;
}) {
  const toneClass =
    tone === "low"
      ? "from-slate-100 to-slate-50 text-slate-700"
      : tone === "high"
        ? "from-accent-400/20 to-white text-slate-700"
        : "from-brand-500 to-brand-600 text-white";
  return (
    <div
      className={`rounded-xl bg-gradient-to-br p-4 border ${
        highlight ? "border-brand-600" : "border-slate-100"
      } ${toneClass}`}
    >
      <p
        className={`text-xs uppercase tracking-wide ${
          highlight ? "text-brand-100" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold flex items-center gap-2">
        <EyeIcon width={18} height={18} />
        {value}
      </p>
    </div>
  );
}

function ContentMix({
  shorts,
  longForm,
}: {
  shorts: number;
  longForm: number;
}) {
  const t = useT("performance");
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <SparklesIcon width={16} height={16} className="text-brand-600" />
        <p className="text-sm font-medium">{t("contentMix")}</p>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full bg-brand-500"
          style={{ width: `${longForm}%` }}
          aria-hidden
        />
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <li className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-500" />
          <span className="text-slate-500">{t("longForm")}</span>
          <span className="ml-auto font-semibold text-slate-900">{longForm}%</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="text-slate-500 inline-flex items-center gap-1">
            <FilmIcon width={12} height={12} />
            {t("shorts")}
          </span>
          <span className="ml-auto font-semibold text-slate-900">{shorts}%</span>
        </li>
      </ul>
    </div>
  );
}
