import { useTranslations } from "next-intl";

import { SparklesIcon } from "@/components/icons";

interface Props {
  /**
   * The generated summary. When present + `isReady` is true, the
   * component renders the text and drops the "coming soon" placeholder.
   *
   * Left un-populated in phase-1 — the parent never passes it. The
   * prop exists so wiring an AI provider later is a single edit
   * to the parent, not a rewrite of this component.
   */
  summary?: string | null;
  /**
   * When true, the parent has produced a summary (or is in a "ready
   * but empty" state — see the empty-summary fallback below). When
   * false or unset, the placeholder message shows.
   */
  isReady?: boolean;
}

/**
 * Channel Analyzer — AI Summary card.
 *
 * Placeholder in phase-1: displays "AI insights coming soon." with a
 * short explanation of what the surface will contain once wired up.
 * The component is API-shaped so future integration is a one-liner:
 *
 *     <AISummary summary={await generateInsights(channel)} isReady />
 *
 * Server component. No JavaScript ships to the client.
 */
export function AISummary({ summary, isReady = false }: Props) {
  const t = useTranslations("tools.channelAnalyzer.aiSummary");
  const hasSummary =
    isReady && typeof summary === "string" && summary.trim().length > 0;

  return (
    <section
      aria-labelledby="channel-analyzer-ai-title"
      className="card p-6 sm:p-8 space-y-3"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          aria-hidden
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
        >
          <SparklesIcon width={18} height={18} />
        </span>
        <h2
          id="channel-analyzer-ai-title"
          className="text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          {t("title")}
        </h2>
        {!hasSummary && (
          <span className="chip-brand ml-auto">{t("badge")}</span>
        )}
      </div>

      {hasSummary ? (
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {summary}
        </p>
      ) : (
        <>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {t("placeholderTitle")}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t("placeholderBody")}
          </p>
        </>
      )}
    </section>
  );
}
