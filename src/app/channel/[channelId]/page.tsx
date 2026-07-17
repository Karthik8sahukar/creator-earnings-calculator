import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChannelDashboard } from "@/components/ChannelDashboard";
import { PerformanceCard } from "@/components/PerformanceCard";
import { ProfileCard } from "@/components/ProfileCard";
import { TransparencyBanner } from "@/components/TransparencyBanner";
import { VideosGrid } from "@/components/VideosGrid";
import { decodeCalculatorState } from "@/lib/calculatorState";
import { publicConfig } from "@/lib/config";
import { analyzePerformance } from "@/lib/performance";
import { channelIdSchema } from "@/lib/schemas";
import {
  YouTubeApiError,
  getChannelById,
  getRecentVideos,
} from "@/lib/youtube";
import type { VideoItem } from "@/types/youtube";

export const runtime = "nodejs";
// Channels are dynamic per-id; static generation isn't a fit here.
export const dynamic = "force-dynamic";

interface RouteParams {
  channelId: string;
}

interface RouteSearchParams {
  [key: string]: string | string[] | undefined;
}

interface PageProps {
  params: Promise<RouteParams>;
  searchParams: Promise<RouteSearchParams>;
}

/**
 * Resolve a channel by id. Runs on the server so the YouTube API key
 * never leaves the process. Returns `null` for a channel that doesn't
 * exist, and re-throws upstream `YouTubeApiError`s so the segment
 * `error.tsx` can render a safe fallback.
 */
async function resolveChannel(rawId: string) {
  const parsed = channelIdSchema.safeParse({ channelId: rawId });
  if (!parsed.success) return null;
  return getChannelById(parsed.data.channelId);
}

/**
 * Generate dynamic metadata for a valid channel. For invalid or missing
 * channels we return safe generic metadata — never claim earnings are
 * official and never present the channel creator as endorsing the app.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { channelId } = await params;

  let channel: Awaited<ReturnType<typeof resolveChannel>> = null;
  try {
    channel = await resolveChannel(channelId);
  } catch {
    // Upstream failure — fall through to generic metadata.
  }

  if (!channel) {
    return {
      title: "Channel not found",
      description:
        "This YouTube channel could not be found. Search for another channel to view its public statistics and an independent creator earnings estimate.",
      alternates: { canonical: "/" },
      robots: { index: false, follow: true },
    };
  }

  const title = `Estimated Earnings for ${channel.title} | ${publicConfig.siteName}`;
  const description = `View public YouTube channel statistics and independent earning estimates for ${channel.title}.`;
  const canonicalPath = `/channel/${channel.channelId}`;
  const ogImage = channel.thumbnail || undefined;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      url: `${publicConfig.siteUrl}${canonicalPath}`,
      title,
      description,
      siteName: publicConfig.siteName,
      images: ogImage ? [{ url: ogImage, alt: channel.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ChannelPage({
  params,
  searchParams,
}: PageProps) {
  const { channelId } = await params;
  const search = await searchParams;

  let channel: Awaited<ReturnType<typeof resolveChannel>> = null;
  try {
    channel = await resolveChannel(channelId);
  } catch (err) {
    if (err instanceof YouTubeApiError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  if (!channel) notFound();

  // Load recent uploads. Do this in parallel-friendly fashion but tolerate
  // failure — the profile card should still render if the videos call
  // hits quota or a transient upstream error.
  let videos: VideoItem[] = [];
  try {
    videos = await getRecentVideos(channel.uploadsPlaylistId);
  } catch (err) {
    // Log server-side and continue. This is intentionally forgiving
    // because a missing video list should not blank the entire page.
    console.error("channel-page:getRecentVideos failed", {
      channelId: channel.channelId,
      code:
        err instanceof YouTubeApiError ? err.code : "UNEXPECTED",
    });
  }

  const analysis = analyzePerformance(videos);
  const initialCalculatorState = decodeCalculatorState(search);

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700 focus:text-brand-700">
          ← Back to search
        </Link>
      </nav>

      <ProfileCard channel={channel} />
      <TransparencyBanner />
      <PerformanceCard analysis={analysis} />

      <ChannelDashboard
        channel={channel}
        analysis={analysis}
        initialCalculatorState={initialCalculatorState}
      />

      <section aria-labelledby="videos-title" className="space-y-4">
        <h2
          id="videos-title"
          className="text-lg font-semibold text-slate-900"
        >
          Recent videos
        </h2>
        {videos.length > 0 ? (
          <VideosGrid videos={videos} />
        ) : (
          <p className="text-sm text-slate-500">
            No public videos are available for this channel right now.
          </p>
        )}
      </section>
    </div>
  );
}
