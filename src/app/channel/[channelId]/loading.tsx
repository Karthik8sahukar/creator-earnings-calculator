/**
 * Segment-level loading UI for /channel/[channelId].
 *
 * Rendered while the server component fetches channel data. We show
 * skeleton blocks that roughly match the final layout to minimise CLS.
 */
export default function ChannelLoading() {
  return (
    <div className="space-y-8" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading channel…</span>
      <div className="card p-6 sm:p-8" aria-hidden>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="skeleton h-28 w-28 rounded-full" />
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
      <div className="card p-6" aria-hidden>
        <div className="skeleton h-4 w-1/4 mb-4" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
