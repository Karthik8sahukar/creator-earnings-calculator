import "server-only";

import { serverEnv, youtube } from "./config";
import { parseIsoDuration, formatDuration } from "./format";
import { parseChannelQuery } from "./parseQuery";
import type {
  ChannelDetails,
  ChannelSearchResult,
  VideoItem,
} from "@/types/youtube";

/**
 * Server-only YouTube Data API v3 wrapper.
 *
 * All API calls are made from the server. The API key is never sent to the
 * browser. No scraping — only official endpoints.
 */

export class YouTubeApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "YouTubeApiError";
    this.status = status;
    this.code = code;
  }
}

function assertKey(): string {
  const key = serverEnv.youtubeApiKey;
  if (!key) {
    throw new YouTubeApiError(
      500,
      "MISSING_API_KEY",
      "YOUTUBE_API_KEY is not configured on the server.",
    );
  }
  return key;
}

async function ytFetch<T>(
  path: string,
  params: Record<string, string | number | undefined>,
): Promise<T> {
  const key = assertKey();
  const url = new URL(`${youtube.apiBase}/${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  }
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), {
    // Short cache — helps during dev and reduces quota use for hot channels.
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    let details = "";
    try {
      const body = (await res.json()) as {
        error?: { message?: string; errors?: { reason?: string }[] };
      };
      details = body.error?.message ?? "";
      const reason = body.error?.errors?.[0]?.reason;
      throw new YouTubeApiError(
        res.status,
        reason ?? "YT_ERROR",
        details || `YouTube API request failed (${res.status})`,
      );
    } catch (e) {
      if (e instanceof YouTubeApiError) throw e;
      throw new YouTubeApiError(
        res.status,
        "YT_ERROR",
        `YouTube API request failed (${res.status})`,
      );
    }
  }

  return (await res.json()) as T;
}

// ---------- Raw response shapes ----------

interface YtThumbnail {
  url: string;
  width: number;
  height: number;
}

interface YtThumbnailSet {
  default?: YtThumbnail;
  medium?: YtThumbnail;
  high?: YtThumbnail;
  standard?: YtThumbnail;
  maxres?: YtThumbnail;
}

interface YtSearchItem {
  id: { kind: string; channelId?: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    thumbnails: YtThumbnailSet;
    publishedAt: string;
  };
}

interface YtSearchResponse {
  items: YtSearchItem[];
}

interface YtChannelItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    publishedAt: string;
    country?: string;
    thumbnails: YtThumbnailSet;
  };
  statistics: {
    viewCount?: string;
    subscriberCount?: string;
    hiddenSubscriberCount?: boolean;
    videoCount?: string;
  };
  contentDetails: {
    relatedPlaylists: {
      uploads: string;
    };
  };
  brandingSettings?: {
    image?: {
      bannerExternalUrl?: string;
    };
  };
}

interface YtChannelResponse {
  items: YtChannelItem[];
}

interface YtPlaylistItem {
  contentDetails: {
    videoId: string;
    videoPublishedAt?: string;
  };
}

interface YtPlaylistItemsResponse {
  items: YtPlaylistItem[];
}

interface YtVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: YtThumbnailSet;
  };
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

interface YtVideosResponse {
  items: YtVideoItem[];
}

// ---------- Helpers ----------

function pickThumb(thumbs?: YtThumbnailSet): string {
  return (
    thumbs?.high?.url ??
    thumbs?.medium?.url ??
    thumbs?.default?.url ??
    thumbs?.standard?.url ??
    thumbs?.maxres?.url ??
    ""
  );
}

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function extractHandle(customUrl?: string | null): string | null {
  if (!customUrl) return null;
  const s = customUrl.trim();
  if (!s) return null;
  return s.startsWith("@") ? s : `@${s}`;
}

function channelUrl(channelId: string, handle: string | null): string {
  if (handle) {
    return `${youtube.handleUrlPrefix}${handle.replace(/^@/, "")}`;
  }
  return `${youtube.channelUrlPrefix}${channelId}`;
}

// ---------- Public API ----------

/**
 * Smart search:
 *   - Recognizes raw channel ids and returns just that channel.
 *   - Recognizes @handles / channel URLs and resolves them via search.
 *   - Otherwise runs a free-text `type=channel` search.
 */
export async function searchChannels(
  rawQuery: string,
): Promise<ChannelSearchResult[]> {
  const parsed = parseChannelQuery(rawQuery);

  if (parsed.kind === "channelId") {
    const details = await getChannelById(parsed.value);
    if (!details) return [];
    return [
      {
        channelId: details.channelId,
        title: details.title,
        handle: details.handle,
        description: details.description,
        thumbnail: details.thumbnail,
        subscriberCount: details.hiddenSubscriberCount
          ? null
          : details.subscriberCount,
        hiddenSubscriberCount: details.hiddenSubscriberCount,
      },
    ];
  }

  // Handle & name both fall back to `search` API
  const q = parsed.kind === "handle" ? `@${parsed.value}` : parsed.value;
  if (!q.trim()) return [];

  const search = await ytFetch<YtSearchResponse>("search", {
    part: "snippet",
    type: "channel",
    q,
    maxResults: youtube.searchMaxResults,
  });

  const ids = search.items
    .map((it) => it.id.channelId)
    .filter((v): v is string => Boolean(v));
  if (ids.length === 0) return [];

  // Enrich with statistics
  const enriched = await ytFetch<YtChannelResponse>("channels", {
    part: "snippet,statistics",
    id: ids.join(","),
    maxResults: ids.length,
  });

  return enriched.items.map((c) => ({
    channelId: c.id,
    title: c.snippet.title,
    handle: extractHandle(c.snippet.customUrl),
    description: c.snippet.description,
    thumbnail: pickThumb(c.snippet.thumbnails),
    subscriberCount: c.statistics.hiddenSubscriberCount
      ? null
      : toNumber(c.statistics.subscriberCount),
    hiddenSubscriberCount: Boolean(c.statistics.hiddenSubscriberCount),
  }));
}

export async function getChannelById(
  channelId: string,
): Promise<ChannelDetails | null> {
  const res = await ytFetch<YtChannelResponse>("channels", {
    part: "snippet,statistics,contentDetails,brandingSettings",
    id: channelId,
    maxResults: 1,
  });

  const c = res.items[0];
  if (!c) return null;

  const handle = extractHandle(c.snippet.customUrl);
  return {
    channelId: c.id,
    title: c.snippet.title,
    handle,
    description: c.snippet.description,
    thumbnail: pickThumb(c.snippet.thumbnails),
    bannerUrl: c.brandingSettings?.image?.bannerExternalUrl ?? null,
    subscriberCount: c.statistics.hiddenSubscriberCount
      ? null
      : toNumber(c.statistics.subscriberCount),
    hiddenSubscriberCount: Boolean(c.statistics.hiddenSubscriberCount),
    viewCount: toNumber(c.statistics.viewCount),
    videoCount: toNumber(c.statistics.videoCount),
    publishedAt: c.snippet.publishedAt,
    country: c.snippet.country ?? null,
    uploadsPlaylistId: c.contentDetails.relatedPlaylists.uploads,
    channelUrl: channelUrl(c.id, handle),
    customUrl: c.snippet.customUrl ?? null,
  };
}

export async function getRecentVideos(
  uploadsPlaylistId: string,
  limit: number = youtube.recentVideosCount,
): Promise<VideoItem[]> {
  const playlist = await ytFetch<YtPlaylistItemsResponse>("playlistItems", {
    part: "contentDetails",
    playlistId: uploadsPlaylistId,
    maxResults: Math.min(Math.max(limit, 1), 50),
  });

  const videoIds = playlist.items
    .map((it) => it.contentDetails.videoId)
    .filter(Boolean);
  if (videoIds.length === 0) return [];

  const videos = await ytFetch<YtVideosResponse>("videos", {
    part: "snippet,contentDetails,statistics",
    id: videoIds.join(","),
    maxResults: videoIds.length,
  });

  const byId = new Map(videos.items.map((v) => [v.id, v]));

  return videoIds
    .map((id) => byId.get(id))
    .filter((v): v is YtVideoItem => Boolean(v))
    .map((v) => {
      const durationSeconds = parseIsoDuration(v.contentDetails.duration);
      const isShort = durationSeconds > 0 && durationSeconds <= 60;
      return {
        videoId: v.id,
        title: v.snippet.title,
        description: v.snippet.description,
        thumbnail: pickThumb(v.snippet.thumbnails),
        publishedAt: v.snippet.publishedAt,
        viewCount: toNumber(v.statistics.viewCount),
        likeCount: toNumber(v.statistics.likeCount),
        commentCount: toNumber(v.statistics.commentCount),
        durationSeconds,
        durationLabel: formatDuration(durationSeconds),
        isShort,
        url: isShort
          ? `${youtube.shortsUrlPrefix}${v.id}`
          : `${youtube.watchUrlPrefix}${v.id}`,
      };
    });
}
