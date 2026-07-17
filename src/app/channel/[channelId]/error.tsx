"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Segment error boundary for /channel/[channelId].
 *
 * Rendered when the server component throws — for example when the
 * YouTube API is over quota or the upstream is unavailable. We show
 * a safe generic message and never surface stack traces or raw
 * upstream details to the user.
 */
export default function ChannelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the server (client console in dev). Structured logger
    // integration handles server-side capture.
    console.error("channel-page:error", { digest: error.digest });
  }, [error]);

  return (
    <div className="text-center py-24">
      <h1 className="text-3xl font-bold text-slate-900">
        Couldn&apos;t load channel
      </h1>
      <p className="mt-2 text-slate-600 max-w-md mx-auto">
        Something went wrong while loading this channel. This can happen
        when the YouTube API is temporarily unavailable or rate-limited.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Back to search
        </Link>
      </div>
    </div>
  );
}
