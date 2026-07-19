import { getTranslations } from "next-intl/server";

import { TransparencyBanner } from "@/components/TransparencyBanner";
import {
  AISummary,
  ChannelCard,
  PerformanceGrid,
  TopVideos,
} from "@/components/tools/channel-analyzer";
import { analyzeChannel } from "@/lib/channelAnalyzer";

interface Props {
  locale: string;
  query: string;
}

/**
 * Server-only results subtree of the Channel Analyzer page.
 *
 * Extracted from `page.tsx` so we can wrap it in a `<Suspense>`
 * boundary — this is what makes the loading skeleton non-blocking:
 *
 *   • The hero + input stays interactive
 *   • The API round-trip (getChannelById → getRecentVideos) suspends
 *     inside this component
 *   • On resolution, only this subtree re-renders — no page-level
 *     reflow
 *
 * All data-fetching happens through `analyzeChannel`, which never
 * throws and always returns a structured result — so this component
 * either renders the six analysis cards, an empty state, or a
 * fallback-reason message. It never crashes the page.
 */
export async function ChannelAnalyzerResults({ locale, query }: Props) {
  const t = await getTranslations({
    locale,
    namespace: "tools.channelAnalyzer.results",
  });

  const result = await analyzeChannel(query);

  // ── Empty (no query yet) ─────────────────────────────────────────
  //
  // Rendered when the user hasn't submitted anything — the input is
  // still the primary focus. We DON'T show an error banner here;
  // this is the natural landing state.
  //
  if (result.status === "empty") {
    return (
      <section
        aria-labelledby="channel-analyzer-empty-title"
        className="card p-8 sm:p-12 text-center space-y-3"
      >
        <h2
          id="channel-analyzer-empty-title"
          className="text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          {t("emptyTitle")}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          {t("emptyBody")}
        </p>
        <ul className="mx-auto flex flex-wrap justify-center gap-2 pt-2 text-xs">
          {(["url", "handle", "id", "name"] as const).map((k) => (
            <li key={k}>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-slate-700 dark:text-slate-300">
                {t(`emptyExamples.${k}`)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // ── Error / fallback ─────────────────────────────────────────────
  //
  // Every failure mode ("not-found", "quota-exceeded", ...) maps to
  // a specific translated message. The user can still see the input
  // above and re-submit — the page itself never dies.
  //
  if (result.status !== "ok" || !result.analysis) {
    const reason = result.fallbackReason ?? "unknown-error";
    return (
      <section
        role="alert"
        aria-labelledby="channel-analyzer-error-title"
        className="card p-6 sm:p-8 space-y-2 border-rose-200 dark:border-rose-900/50"
      >
        <h2
          id="channel-analyzer-error-title"
          className="text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          {t(`errors.${reason}.title`)}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t(`errors.${reason}.body`)}
        </p>
        {result.input.raw && (
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {t("errors.echoInput", { input: result.input.raw })}
          </p>
        )}
      </section>
    );
  }

  // ── Success ──────────────────────────────────────────────────────
  const { channel, topVideos, revenue, engagement, growth } = result.analysis;

  return (
    <div className="space-y-8">
      <ChannelCard channel={channel} />

      <TransparencyBanner />

      <PerformanceGrid
        revenue={revenue}
        engagement={engagement}
        growth={growth}
      />

      {topVideos.length > 0 ? (
        <TopVideos videos={topVideos} limit={6} />
      ) : (
        <section
          aria-labelledby="channel-analyzer-no-videos-title"
          className="card p-6 sm:p-8 space-y-2"
        >
          <h2
            id="channel-analyzer-no-videos-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {t("noVideosTitle")}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t("noVideosBody")}
          </p>
        </section>
      )}

      <AISummary />
    </div>
  );
}
