"use client";

import { useEffect, useState } from "react";
import { ChannelSearch } from "./ChannelSearch";
import { EarningsCalculator } from "./EarningsCalculator";
import { PerformanceCard } from "./PerformanceCard";
import { ProfileCard } from "./ProfileCard";
import { TransparencyBanner } from "./TransparencyBanner";
import { VideosGrid } from "./VideosGrid";
import { analyzePerformance } from "@/lib/performance";
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

export function ChannelWorkspace() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ready">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<LoadedState | null>(null);

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
          throw new Error(body.message ?? `Failed to load channel`);
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

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto w-full">
        <ChannelSearch
          onSelect={(id) => setSelectedId(id)}
          autoFocus={!selectedId}
        />
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
            defaultCountry={data.channel.country ?? undefined}
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
    <div className="space-y-6" aria-hidden>
      <div className="card p-6 sm:p-8">
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
      <div className="card p-6">
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
