"use client";

import { useT } from "@/lib/t";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { useRouter } from "next/link";
import { ChannelSearch } from "./ChannelSearch";
import { RecentSearches } from "./RecentSearches";
import {
  decodeCalculatorState,
  encodeCalculatorState,
} from "@/lib/calculatorState";

/**
 * Homepage workspace.
 *
 * Behaviour is unchanged from the pre-i18n version. Diffs:
 *   • `useRouter` comes from `@/i18n/navigation` so navigation
 *     preserves the active locale prefix.
 *   • The workspace hint at the bottom is translated.
 *   • The legacy `?cid=UC...` migration and the "select channel" flow
 *     both push to `/channel/[id]` — the i18n router prepends the
 *     locale automatically.
 */
export function ChannelWorkspace() {
  const t = useT("home");
  const router = useRouter();
  const searchParams = useSearchParams();

  const legacyChannelId = useMemo(() => {
    const state = decodeCalculatorState(
      searchParams ?? new URLSearchParams(),
    );
    return state.channelId ?? null;
  }, [searchParams]);

  // Migrate legacy `/?cid=UC...` deep links to the new channel URL.
  useEffect(() => {
    if (!legacyChannelId) return;
    const state = decodeCalculatorState(
      searchParams ?? new URLSearchParams(),
    );
    const query = encodeCalculatorState({ ...state, channelId: null });
    const q = query.toString();
    router.replace(
      q ? `/channel/${legacyChannelId}?${q}` : `/channel/${legacyChannelId}`,
    );
  }, [legacyChannelId, router, searchParams]);

  function selectChannel(channelId: string) {
    router.push(`/channel/${channelId}`);
  }

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto w-full space-y-4">
        <ChannelSearch onSelect={selectChannel} autoFocus />
        <RecentSearches onSelect={selectChannel} />
      </div>

      <p className="text-center text-sm text-slate-500">
        {t("workspaceHint")}
      </p>
    </div>
  );
}
