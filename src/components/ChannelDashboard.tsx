"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/link";
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
  initialCalculatorState: Partial<CalculatorState>;
}

/**
 * Client-side controller for the channel dashboard page.
 *
 * Uses `useRouter` from `@/i18n/navigation` so calculator-state URL
 * updates preserve the active locale prefix (`/en/channel/...`
 * stays on `/en`, not falling through to `/channel/...`).
 */
export function ChannelDashboard({
  channel,
  analysis,
  initialCalculatorState,
}: Props) {
  const router = useRouter();

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

  const pathnameForShare = `/channel/${channel.channelId}`;

  const onStateChange = useCallback(
    (next: CalculatorState) => {
      const params = encodeCalculatorState(next);
      const q = params.toString();
      const href = q
        ? `/channel/${channel.channelId}?${q}`
        : `/channel/${channel.channelId}`;
      router.replace(href, { scroll: false });
    },
    [router, channel.channelId],
  );

  // The share URL uses the full origin so it can be pasted anywhere.
  // We build it manually because the ShareSection needs an absolute URL.
  const canonicalUrl = `${urlBase || publicConfig.siteUrl}${pathnameForShare}`;

  return (
    <div className="space-y-8">
      <EarningsCalculator
        analysis={analysis}
        channelId={channel.channelId}
        initialState={initialCalculatorSeed}
        onStateChange={onStateChange}
        shareOrigin={urlBase}
        sharePathname={pathnameForShare}
      />
      <ShareSection url={canonicalUrl} channelTitle={channel.title} />
    </div>
  );
}
