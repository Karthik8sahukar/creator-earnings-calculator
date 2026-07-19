import { getTranslations } from "next-intl/server";

/**
 * Channel Analyzer — non-blocking loading skeleton.
 *
 * Rendered inside a `<Suspense>` boundary around the server-side
 * analysis subtree, so the hero + input remain interactive while
 * the API round-trip is in flight. The skeleton mirrors the final
 * layout — hero card, performance grid, top-videos grid, AI summary,
 * related tools — so the visual jump between "loading" and "ready"
 * is minimal (see the site's `.skeleton` shimmer class in
 * `globals.css`).
 *
 * Server component. `aria-live="polite"` + `aria-busy="true"` tell
 * assistive tech a load is in progress; the sr-only status message
 * is translated so screen readers get a real sentence in every locale.
 */
export async function ChannelAnalyzerLoadingSkeleton() {
  const t = await getTranslations("tools.channelAnalyzer.loading");
  return (
    <div
      className="space-y-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{t("sr")}</span>

      {/* Channel card skeleton */}
      <div className="card overflow-hidden" aria-hidden>
        <div className="skeleton h-32 sm:h-44" />
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 -mt-14 sm:-mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="skeleton h-28 w-28 sm:h-32 sm:w-32 rounded-full" />
            <div className="flex-1 space-y-3 w-full">
              <div className="skeleton h-6 w-1/3" />
              <div className="skeleton h-3 w-1/4" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Performance grid skeleton */}
      <div className="space-y-3" aria-hidden>
        <div className="skeleton h-4 w-1/3" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Top-videos skeleton */}
      <div className="space-y-3" aria-hidden>
        <div className="skeleton h-4 w-1/4" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="card overflow-hidden flex flex-col"
            >
              <div className="skeleton aspect-video w-full" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI summary skeleton */}
      <div className="card p-6 sm:p-8 space-y-3" aria-hidden>
        <div className="skeleton h-5 w-1/3" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-4/5" />
      </div>
    </div>
  );
}
