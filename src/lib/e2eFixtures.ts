import "server-only";

import { YouTubeApiError } from "./errors";
import type {
  ChannelDetails,
  ChannelSearchResult,
  VideoItem,
} from "@/types/youtube";

/**
 * Deterministic YouTube-API fixture set used by E2E tests only.
 *
 * `isE2EMockModeActive()` is guarded by TWO independent signals so this
 * mock CANNOT be turned on accidentally in a real deployment:
 *
 *   1. `E2E_MOCK_MODE` must be exactly `"1"`.
 *   2. `VERCEL` must not be `"1"`.
 *
 * Vercel always sets `VERCEL=1` at runtime, so even a rogue env var
 * cannot activate the mock in a Vercel deployment. For any other
 * platform we recommend not shipping the mock env var to production;
 * the runtime `mockActivated` warning below also surfaces if it is.
 */

const CHANNELS: Record<string, ChannelDetails> = {
  UCAAAAAAAAAAAAAAAAAAAAAA: {
    channelId: "UCAAAAAAAAAAAAAAAAAAAAAA",
    title: "Alpha Test Channel",
    handle: "@alpha",
    description:
      "A public YouTube channel used for automated end-to-end tests.",
    thumbnail: "https://yt3.googleusercontent.com/alpha.jpg",
    bannerUrl: null,
    subscriberCount: 123_000,
    hiddenSubscriberCount: false,
    viewCount: 4_567_890,
    videoCount: 42,
    publishedAt: "2019-01-15T00:00:00Z",
    country: "US",
    uploadsPlaylistId: "UUAAAAAAAAAAAAAAAAAAAAAA",
    channelUrl: "https://www.youtube.com/@alpha",
    customUrl: "@alpha",
  },
  UCBBBBBBBBBBBBBBBBBBBBBB: {
    channelId: "UCBBBBBBBBBBBBBBBBBBBBBB",
    title: "Bravo Channel (no videos)",
    handle: "@bravo",
    description: "A test channel with no recent uploads.",
    thumbnail: "https://yt3.googleusercontent.com/bravo.jpg",
    bannerUrl: null,
    subscriberCount: 5_000,
    hiddenSubscriberCount: false,
    viewCount: 12_345,
    videoCount: 0,
    publishedAt: "2020-06-01T00:00:00Z",
    country: "GB",
    uploadsPlaylistId: "UUBBBBBBBBBBBBBBBBBBBBBB",
    channelUrl: "https://www.youtube.com/@bravo",
    customUrl: "@bravo",
  },
  UCCCCCCCCCCCCCCCCCCCCCCC: {
    channelId: "UCCCCCCCCCCCCCCCCCCCCCCC",
    title: "Charlie Channel (hidden subs)",
    handle: "@charlie",
    description: "A test channel that hides its subscriber count.",
    thumbnail: "https://yt3.googleusercontent.com/charlie.jpg",
    bannerUrl: null,
    subscriberCount: null,
    hiddenSubscriberCount: true,
    viewCount: 987_654,
    videoCount: 12,
    publishedAt: "2018-03-11T00:00:00Z",
    country: null,
    uploadsPlaylistId: "UUCCCCCCCCCCCCCCCCCCCCCC",
    channelUrl: "https://www.youtube.com/@charlie",
    customUrl: "@charlie",
  },
};

const VIDEOS: Record<string, VideoItem[]> = {
  UUAAAAAAAAAAAAAAAAAAAAAA: [
    makeVideo("A1", "How to test end to end", 12_345, 60 * 12),
    makeVideo("A2", "Alpha weekly recap", 45_678, 60 * 18),
    makeVideo("A3", "Alpha Q&A", 6_789, 30),
    makeVideo("A4", "Alpha Q&A 2", 8_912, 45),
    makeVideo("A5", "Alpha long-form deep dive", 90_000, 60 * 25),
  ],
  UUCCCCCCCCCCCCCCCCCCCCCC: [
    makeVideo("C1", "Charlie says hi", 1234, 45),
    makeVideo("C2", "Charlie explains", 5678, 60 * 5),
  ],
  UUBBBBBBBBBBBBBBBBBBBBBB: [], // no videos
};

function makeVideo(
  id: string,
  title: string,
  views: number,
  durationSeconds: number,
): VideoItem {
  const isShort = durationSeconds <= 60;
  return {
    videoId: id,
    title,
    description: `${title} — description`,
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    publishedAt: "2026-06-15T12:00:00Z",
    viewCount: views,
    likeCount: Math.floor(views * 0.05),
    commentCount: Math.floor(views * 0.005),
    durationSeconds,
    durationLabel: formatDuration(durationSeconds),
    isShort,
    url: isShort
      ? `https://www.youtube.com/shorts/${id}`
      : `https://www.youtube.com/watch?v=${id}`,
  };
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `0:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}

// ---------- Public API used by youtube.ts under mock mode ----------

export function isE2EMockModeActive(): boolean {
  return (
    process.env.E2E_MOCK_MODE === "1" &&
    process.env.VERCEL !== "1"
  );
}

// Announce once — makes it obvious in server logs that the mock is active.
let announced = false;
export function announceE2EMockIfActive(): void {
  if (announced || !isE2EMockModeActive()) return;
  announced = true;
  console.warn(
    "[e2e-mock] YouTube API mock mode is ACTIVE. No real API calls will be made.",
  );
}

export async function mockedSearchChannels(
  rawQuery: string,
): Promise<ChannelSearchResult[]> {
  // Normalize: strip leading @ and lowercase for fixture matching
  const q = rawQuery.trim().toLowerCase().replace(/^@/, "");
  if (q === "" || q === "empty") return [];
  if (q === "quota") {
    throw new YouTubeApiError(
      429,
      "QUOTA_EXCEEDED",
      "The daily YouTube API quota has been exceeded. Please try again later.",
    );
  }
  if (q === "unavailable") {
    throw new YouTubeApiError(
      502,
      "UPSTREAM_UNAVAILABLE",
      "The YouTube API is currently unavailable. Please try again shortly.",
    );
  }
  return Object.values(CHANNELS).map((c) => ({
    channelId: c.channelId,
    title: c.title,
    handle: c.handle,
    description: c.description,
    thumbnail: c.thumbnail,
    subscriberCount: c.hiddenSubscriberCount ? null : c.subscriberCount,
    hiddenSubscriberCount: c.hiddenSubscriberCount,
  }));
}

export async function mockedGetChannelById(
  channelId: string,
): Promise<ChannelDetails | null> {
  if (channelId === "UCQQQQQQQQQQQQQQQQQQQQQQ") {
    throw new YouTubeApiError(
      429,
      "QUOTA_EXCEEDED",
      "The daily YouTube API quota has been exceeded. Please try again later.",
    );
  }
  if (channelId === "UCUUUUUUUUUUUUUUUUUUUUUU") {
    throw new YouTubeApiError(
      502,
      "UPSTREAM_UNAVAILABLE",
      "The YouTube API is currently unavailable. Please try again shortly.",
    );
  }
  return CHANNELS[channelId] ?? null;
}

export async function mockedGetRecentVideos(
  uploadsPlaylistId: string,
  limit = 12,
): Promise<VideoItem[]> {
  const list = VIDEOS[uploadsPlaylistId] ?? [];
  return list.slice(0, limit);
}
