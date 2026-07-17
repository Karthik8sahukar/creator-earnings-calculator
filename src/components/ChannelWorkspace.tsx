"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ChannelSearch } from "./ChannelSearch";
import { EarningsCalculator } from "./EarningsCalculator";
import { PerformanceCard } from "./PerformanceCard";
import { ProfileCard } from "./ProfileCard";
import { RecentSearches } from "./RecentSearches";
import { TransparencyBanner } from "./TransparencyBanner";
import { VideosGrid } from "./VideosGrid";
import {
  decodeCalculatorState,
  encodeCalculatorState,
  type CalculatorState,
} from "@/lib/calculatorState";
import { analyzePerformance } from "@/lib/performance";
import {
  addRecent,
  loadRecent,
  saveRecent,
} from "@/lib/recentSearches";
import type {
  ChannelDetails,
  PerformanceAnalysis,
  VideoItem,
} from "@/types/youtube";

interface LoadedState {
  channel: ChannelDetails;
  videos: VideoItem[];
  analysis: PerformanceAnalysis;
}

/**
 * The top-level client orchestrator. Owns:
 *   - Selection of a channel
 *   - Data fetching via /api routes
 *   - URL <-> calculator-state sync (shareable links + back/forward)
 *   - Recent searches (localStorage)
 */
export function ChannelWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCalcState = useMemo(
    () => decodeCalculatorState(searchParams ?? new URLSearchParams()),
    // We deliberately compute this only once at mount — subsequent URL
    // updates come from our own writes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    initialCalcState.channelId,
  );
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ready">(
    initialCalcState.channelId ? "loading" : "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<LoadedState | null>(null);
  const [recentToken, setRecentToken] = useState(0);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    async function run(id: string) {
      setStatus("loading");
      setErrorMessage(null);
      try {
        const channelRes = await fetch(
          `/api/channel?channelId=${encodeURIComponent(id)}`,
        );
        if (!channelRes.ok) {
          const body = await channelRes.json().catch(() => ({}));
          throw new Error(body.message ?? "Failed to load channel");
        }
        const channelBody = (await channelRes.json()) as {
          channel: ChannelDetails;
        };
        const channel = channelBody.channel;

        const videosRes = await fetch(
          `/api/videos?playlistId=${encodeURIComponent(channel.uploadsPlaylistId)}&limit=12`,
        );
        if (!videosRes.ok) {
          const body = await videosRes.json().catch(() => ({}));
          throw new Error(body.message ?? "Failed to load videos");
        }
        const videosBody = (await videosRes.json()) as { videos: VideoItem[] };
        const analysis = analyzePerformance(videosBody.videos);

        if (cancelled) return;
        setData({ channel, videos: videosBody.videos, analysis });
        setStatus("ready");

        // Push into recent searches
        try {
          const updated = addRecent(loadRecent(), {
            channelId: channel.channelId,
            title: channel.title,
            handle: channel.handle,
            thumbnail: channel.thumbnail,
          });
          saveRecent(updated);
          setRecentToken((n) => n + 1);
        } catch {
          // ignore storage failures
        }
      } catch (err) {
        if (cancelled) return;
        setErrorMessage((err as Error).message);
        setStatus("error");
      }
    }

    run(selectedId);
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // React to browser back/forward: read the URL again and update the selection.
  useEffect(() => {
    const stateFromUrl = decodeCalculatorState(
      searchParams ?? new URLSearchParams(),
    );
    if (stateFromUrl.channelId !== selectedId) {
      setSelectedId(stateFromUrl.channelId);
      if (!stateFromUrl.channelId) {
        setStatus("idle");
        setData(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function onCalcStateChange(next: CalculatorState) {
    // Sync to the URL without a full-page reload. Browsers dedupe
    // identical URLs so this is cheap.
    const params = encodeCalculatorState(next);
    const q = params.toString();
    const href = q ? `/?${q}` : "/";
    router.replace(href, { scroll: false });
  }

  const showRecent = status === "idle";

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto w-full space-y-4">
        <ChannelSearch
          onSelect={(id) => setSelectedId(id)}
          autoFocus={!selectedId}
        />
        {showRecent && (
          <RecentSearches
            refreshToken={recentToken}
            onSelect={(id) => setSelectedId(id)}
          />
        )}
      </div>

      {status === "idle" && (
        <p className="text-center text-sm text-slate-500">
          Start typing a channel name, @handle, URL, or channel ID above.
        </p>
      )}

      {status === "loading" && <ChannelSkeleton />}

      {status === "error" && (
        <div
          role="alert"
          aria-live="assertive"
          className="mx-auto max-w-2xl rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <p className="font-medium">Couldn&apos;t load channel</p>
          <p className="mt-1">{errorMessage}</p>
        </div>
      )}

      {status === "ready" && data && (
        <div className="space-y-8">
          <ProfileCard channel={data.channel} />
          <TransparencyBanner />
          <PerformanceCard analysis={data.analysis} />
          <EarningsCalculator
            analysis={data.analysis}
            channelId={data.channel.channelId}
            initialState={{
              ...initialCalcState,
              channelId: data.channel.channelId,
            }}
            onStateChange={onCalcStateChange}
          />
          <section aria-labelledby="videos-title" className="space-y-4">
            <h2
              id="videos-title"
              className="text-lg font-semibold text-slate-900"
            >
              Recent videos
            </h2>
            <VideosGrid videos={data.videos} />
          </section>
        </div>
      )}
    </div>
  );
}

function ChannelSkeleton() {
  return (
    <div className="space-y-6" aria-live="polite" aria-busy="true">
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
