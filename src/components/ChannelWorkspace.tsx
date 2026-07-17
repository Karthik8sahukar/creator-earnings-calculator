"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ChannelSearch } from "./ChannelSearch";
import { RecentSearches } from "./RecentSearches";
import {
  decodeCalculatorState,
  encodeCalculatorState,
} from "@/lib/calculatorState";

/**
 * Homepage workspace.
 *
 * Previously this component owned both search and the channel dashboard.
 * The channel dashboard now lives at `/channel/[channelId]`, which is
 * server-rendered with dynamic metadata. This component's job is:
 *   - Show the search input and recent-searches shortcut.
 *   - Navigate to `/channel/{id}?...` when a channel is selected.
 *   - Preserve any legacy `?cid=UC...` share URLs by redirecting to the
 *     new channel page (keeps all query parameters intact so the
 *     shareable calculator state is preserved).
 */
export function ChannelWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const legacyChannelId = useMemo(() => {
    const state = decodeCalculatorState(
      searchParams ?? new URLSearchParams(),
    );
    return state.channelId ?? null;
  }, [searchParams]);

  const [recentToken] = useState(0);

  // Migrate legacy `/?cid=UC...` deep links to the new channel URL.
  useEffect(() => {
    if (!legacyChannelId) return;
    const state = decodeCalculatorState(
      searchParams ?? new URLSearchParams(),
    );
    // Drop `cid` from the query before re-encoding — the id is in the
    // path now, and encodeCalculatorState ignores the `null` sentinel.
    const query = encodeCalculatorState({ ...state, channelId: null });
    const q = query.toString();
    const href = q
      ? `/channel/${legacyChannelId}?${q}`
      : `/channel/${legacyChannelId}`;
    router.replace(href);
  }, [legacyChannelId, router, searchParams]);

  function selectChannel(channelId: string) {
    router.push(`/channel/${channelId}`);
  }

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto w-full space-y-4">
        <ChannelSearch onSelect={selectChannel} autoFocus />
        <RecentSearches refreshToken={recentToken} onSelect={selectChannel} />
      </div>

      <p className="text-center text-sm text-slate-500">
        Start typing a channel name, @handle, URL, or channel ID above.
      </p>
    </div>
  );
}
