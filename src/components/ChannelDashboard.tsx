"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { EarningsCalculator } from "./EarningsCalculator";
import { ShareSection } from "./ShareSection";
import {
  encodeCalculatorState,
  type CalculatorState,
} from "@/lib/calculatorState";
import { publicConfig } from "@/lib/config";
import {
  addRecent,
  loadRecent,
  saveRecent,
} from "@/lib/recentSearches";
import type {
  ChannelDetails,
  PerformanceAnalysis,
} from "@/types/youtube";

interface Props {
  channel: ChannelDetails;
  analysis: PerformanceAnalysis;
  /**
   * Calculator state as decoded from the incoming URL. Only fields the
   * URL actually provided are present here — anything absent lets the
   * `EarningsCalculator` fall back to its analysis-derived defaults
   * (auto-estimated monthly views, sensible content type, etc.).
   */
  initialCalculatorState: Partial<CalculatorState>;
}

/**
 * Client-side controller for the channel dashboard page.
 *
 * The heavy fetches and static parts (profile, transparency, performance,
 * videos) already ran on the server. This component owns only what has
 * to be interactive:
 *   - the earnings calculator state
 *   - the URL <-> state sync
 *   - the "recent searches" localStorage record
 */
export function ChannelDashboard({
  channel,
  analysis,
  initialCalculatorState,
}: Props) {
  const router = useRouter();
  const pathname = `/channel/${channel.channelId}`;

  // Pass the URL partial straight through — the calculator layers it
  // on top of its analysis-derived defaults. We only force the channel
  // id from the route so the URL can never override it.
  const initialCalculatorSeed = useMemo<Partial<CalculatorState>>(
    () => ({
      ...initialCalculatorState,
      channelId: channel.channelId,
    }),
    [channel.channelId, initialCalculatorState],
  );

  const [urlBase, setUrlBase] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrlBase(window.location.origin);
    }
  }, []);

  // Record the visit in the "recent channels" localStorage list.
  useEffect(() => {
    try {
      const updated = addRecent(loadRecent(), {
        channelId: channel.channelId,
        title: channel.title,
        handle: channel.handle,
        thumbnail: channel.thumbnail,
      });
      saveRecent(updated);
    } catch {
      // Storage may be disabled — silent no-op.
    }
  }, [channel.channelId, channel.title, channel.handle, channel.thumbnail]);

  const onStateChange = useCallback(
    (next: CalculatorState) => {
      const params = encodeCalculatorState(next);
      const q = params.toString();
      const href = q ? `${pathname}?${q}` : pathname;
      router.replace(href, { scroll: false });
    },
    [router, pathname],
  );

  // The share section uses the canonical channel URL (never the
  // exact calculator state) — see docs on defaultChannelShareText.
  const canonicalUrl = `${urlBase || publicConfig.siteUrl}${pathname}`;

  return (
    <div className="space-y-8">
      <EarningsCalculator
        analysis={analysis}
        channelId={channel.channelId}
        initialState={initialCalculatorSeed}
        onStateChange={onStateChange}
        shareOrigin={urlBase}
        sharePathname={pathname}
      />
      <ShareSection url={canonicalUrl} channelTitle={channel.title} />
    </div>
  );
}
