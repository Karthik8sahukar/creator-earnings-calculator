import { ChannelAnalyzerLoadingSkeleton } from "@/components/tools/channel-analyzer";

/**
 * Route-level loading UI for the Channel Analyzer.
 *
 * Displayed on first navigation from another route while the server
 * component tree of `page.tsx` is streaming. Once the shell is on
 * screen, in-page query changes reuse the `<Suspense>` boundary
 * inside `page.tsx` (which renders the same skeleton) rather than
 * this file.
 *
 * We deliberately reuse the same skeleton component so both loading
 * states look identical — no layout shift when transitioning
 * between them.
 */
export default function ChannelAnalyzerRouteLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="space-y-4">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-9 w-2/3 rounded-lg" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-14 w-full rounded-2xl" />
      </div>
      <ChannelAnalyzerLoadingSkeleton />
    </div>
  );
}
