import "server-only";

import { channelCache, searchCache, videosCache } from "./cache";
import { youtube } from "./config";
import {
  announceE2EMockIfActive,
  isE2EMockModeActive,
  mockedGetChannelById,
  mockedGetRecentVideos,
  mockedSearchChannels,
} from "./e2eFixtures";
import { serverEnv } from "./env.server";
import { YouTubeApiError } from "./errors";
import { parseIsoDuration, formatDuration } from "./format";
import {
  markCache,
  markUpstream,
  type UpstreamCategory,
} from "./observability";
import { parseChannelQuery } from "./parseQuery";
import type {
  ChannelDetails,
  ChannelSearchResult,
  VideoItem,
} from "@/types/youtube";

export { YouTubeApiError } from "./errors";

/**
 * Server-only YouTube Data API v3 wrapper.
 *
 * Rules:
 *   - The API key is never sent to the browser.
 *   - No scraping — only official endpoints.
 *   - All upstream requests have an abort-based timeout.
 *   - No sensitive data (URLs containing the key, stack traces, env)
 *     leaks into thrown errors.
 *   - Results are cached in-process to protect the daily quota (see
 *     `lib/cache.ts` and the deployment notes in README).
 */

const UPSTREAM_TIMEOUT_MS = serverEnv.youtubeTimeoutMs;

function assertKey(): string {
  const key = serverEnv.youtubeApiKey;
  if (!key) {
    markUpstream("missing_key");
    throw new YouTubeApiError(
      500,
      "MISSING_API_KEY",
      "The YouTube API is not configured on the server.",
    );
  }
  return key;
}

/** Map our public error codes to observability categories. */
function categoryFor(code: string): UpstreamCategory {
  switch (code) {
    case "QUOTA_EXCEEDED":
      return "quota_exceeded";
    case "UPSTREAM_TIMEOUT":
      return "timeout";
    case "NETWORK_ERROR":
      return "network_error";
    case "NOT_FOUND":
      return "not_found";
    case "INVALID_API_KEY":
      return "invalid_key";
    case "MISSING_API_KEY":
      return "missing_key";
    case "MALFORMED_UPSTREAM":
      return "malformed_response";
    case "FORBIDDEN":
      return "forbidden";
    default:
      return "upstream_error";
  }
}

/**
 * Map a raw upstream reason string to a stable public error code +
 * safe user-facing message. We never surface the raw Google error
 * verbatim to the client — it can contain internal-looking details.
 */
function mapUpstreamError(
  status: number,
  reason: string | undefined,
): { code: string; status: number; message: string } {
  const normalized = (reason ?? "").toLowerCase();
  if (
    status === 400 &&
    (normalized.includes("badrequest") || normalized.includes("keyinvalid"))
  ) {
    return {
      code: "INVALID_API_KEY",
      status: 500,
      message:
        "The YouTube API key is invalid. If you are the operator, check the server configuration.",
    };
  }
  if (status === 401 || status === 403) {
    if (normalized.includes("quota")) {
      return {
        code: "QUOTA_EXCEEDED",
        status: 429,
        message:
          "The daily YouTube API quota has been exceeded. Please try again later.",
      };
    }
    if (
      normalized.includes("forbidden") ||
      normalized.includes("keyinvalid") ||
      normalized.includes("apinotactivated")
    ) {
      return {
        code: "INVALID_API_KEY",
        status: 500,
        message:
          "The YouTube API rejected the request. If you are the operator, check that the key is valid and the API is enabled.",
      };
    }
    return {
      code: "FORBIDDEN",
      status: 502,
      message: "The YouTube API refused the request.",
    };
  }
  if (status === 404) {
    return {
      code: "NOT_FOUND",
      status: 404,
      message: "The requested resource was not found.",
    };
  }
  if (status >= 500) {
    return {
      code: "UPSTREAM_UNAVAILABLE",
      status: 502,
      message:
        "The YouTube API is currently unavailable. Please try again shortly.",
    };
  }
  return {
    code: "UPSTREAM_ERROR",
    status: 502,
    message: "The YouTube API returned an unexpected response.",
  };
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      // Small revalidate hint for platforms that respect it. Our own cache
      // layer is the primary guard.
      next: { revalidate: 300 },
    });
  } catch (err) {
    // The fetch failed at the network level. This includes timeouts.
    // Do NOT include the request URL — it contains the API key.
    if ((err as { name?: string }).name === "AbortError") {
      markUpstream("timeout");
      throw new YouTubeApiError(
        504,
        "UPSTREAM_TIMEOUT",
        "The YouTube API took too long to respond.",
      );
    }
    markUpstream("network_error");
    throw new YouTubeApiError(
      502,
      "NETWORK_ERROR",
      "Could not reach the YouTube API. Please try again shortly.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    let reason: string | undefined;
    try {
      const body = (await res.json()) as {
        error?: { errors?: { reason?: string }[] };
      };
      reason = body.error?.errors?.[0]?.reason;
    } catch {
      // ignore — we already have a status code
    }
    const mapped = mapUpstreamError(res.status, reason);
    markUpstream(categoryFor(mapped.code));
    throw new YouTubeApiError(mapped.status, mapped.code, mapped.message);
  }

  try {
    const parsed = (await res.json()) as T;
    markUpstream("success");
    return parsed;
  } catch {
    markUpstream("malformed_response");
    throw new YouTubeApiError(
      502,
      "MALFORMED_UPSTREAM",
      "The YouTube API returned a malformed response.",
    );
  }
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
  statistics?: {
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
  statistics?: {
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

// ---------- Mappers (exported for tests) ----------

export function mapChannel(c: YtChannelItem): ChannelDetails {
  const handle = extractHandle(c.snippet.customUrl);
  const stats = c.statistics ?? {};
  return {
    channelId: c.id,
    title: c.snippet.title,
    handle,
    description: c.snippet.description,
    thumbnail: pickThumb(c.snippet.thumbnails),
    bannerUrl: c.brandingSettings?.image?.bannerExternalUrl ?? null,
    subscriberCount: stats.hiddenSubscriberCount
      ? null
      : toNumber(stats.subscriberCount),
    hiddenSubscriberCount: Boolean(stats.hiddenSubscriberCount),
    viewCount: toNumber(stats.viewCount),
    videoCount: toNumber(stats.videoCount),
    publishedAt: c.snippet.publishedAt,
    country: c.snippet.country ?? null,
    uploadsPlaylistId: c.contentDetails.relatedPlaylists.uploads,
    channelUrl: channelUrl(c.id, handle),
    customUrl: c.snippet.customUrl ?? null,
  };
}

export function mapChannelSearchResult(
  c: YtChannelItem,
): ChannelSearchResult {
  const stats = c.statistics ?? {};
  return {
    channelId: c.id,
    title: c.snippet.title,
    handle: extractHandle(c.snippet.customUrl),
    description: c.snippet.description,
    thumbnail: pickThumb(c.snippet.thumbnails),
    subscriberCount: stats.hiddenSubscriberCount
      ? null
      : toNumber(stats.subscriberCount),
    hiddenSubscriberCount: Boolean(stats.hiddenSubscriberCount),
  };
}

export function mapVideo(v: YtVideoItem): VideoItem {
  const durationSeconds = parseIsoDuration(v.contentDetails.duration);
  const isShort = durationSeconds > 0 && durationSeconds <= 60;
  const stats = v.statistics ?? {};
  return {
    videoId: v.id,
    title: v.snippet.title,
    description: v.snippet.description,
    thumbnail: pickThumb(v.snippet.thumbnails),
    publishedAt: v.snippet.publishedAt,
    viewCount: toNumber(stats.viewCount),
    likeCount: toNumber(stats.likeCount),
    commentCount: toNumber(stats.commentCount),
    durationSeconds,
    durationLabel: formatDuration(durationSeconds),
    isShort,
    url: isShort
      ? `${youtube.shortsUrlPrefix}${v.id}`
      : `${youtube.watchUrlPrefix}${v.id}`,
  };
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
  if (isE2EMockModeActive()) {
    announceE2EMockIfActive();
    markCache("miss");
    markUpstream("success");
    return mockedSearchChannels(rawQuery);
  }
  const parsed = parseChannelQuery(rawQuery);
  const cacheKey = `${parsed.kind}:${parsed.value.toLowerCase()}`;

  return (searchCache as {
    getOrLoad(
      key: string,
      loader: () => Promise<ChannelSearchResult[]>,
    ): Promise<ChannelSearchResult[]>;
  }).getOrLoad(cacheKey, async () => {
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

    // Handle path — use `channels.list?forHandle=` (general quota,
    // 1 unit) instead of `search.list` (Search Queries quota, 1 unit
    // — but capped at only 100 calls/day). Both callers that pass a
    // handle (`creatorAvatars.ts`, `creatorProfile.ts`) want the
    // specific channel that owns the handle — not a fuzzy list of
    // related channels — so the direct-lookup endpoint is both
    // strictly correct AND avoids the tight Search Queries bucket
    // entirely.
    //
    // The old handle path went through `search.list?type=channel&q=@X`
    // + `channels.list` enrichment. With 20 curated creators, every
    // cold-cache warm-up spent 20 search queries; the 100/day cap
    // therefore allowed roughly 5 warm-ups before subsequent calls
    // hit `403 quotaExceeded`. See `getChannelByHandle`'s docstring
    // for the full failure mode.
    if (parsed.kind === "handle") {
      const details = await getChannelByHandle(parsed.value);
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

    // Free-text name search — unchanged.
    const q = parsed.value;
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

    const enriched = await ytFetch<YtChannelResponse>("channels", {
      part: "snippet,statistics",
      id: ids.join(","),
      maxResults: ids.length,
    });

    return enriched.items.map(mapChannelSearchResult);
  });
}

export async function getChannelById(
  channelId: string,
): Promise<ChannelDetails | null> {
  if (isE2EMockModeActive()) {
    announceE2EMockIfActive();
    markCache("miss");
    markUpstream("success");
    return mockedGetChannelById(channelId);
  }
  return (channelCache as {
    getOrLoad(
      key: string,
      loader: () => Promise<ChannelDetails | null>,
    ): Promise<ChannelDetails | null>;
  }).getOrLoad(`channel:${channelId}`, async () => {
    const res = await ytFetch<YtChannelResponse>("channels", {
      part: "snippet,statistics,contentDetails,brandingSettings",
      id: channelId,
      maxResults: 1,
    });
    const c = res.items[0];
    if (!c) return null;
    return mapChannel(c);
  });
}

/**
 * Resolve a YouTube channel from its handle (e.g. `@MrBeast`) using
 * the `channels.list?forHandle=` endpoint.
 *
 * Quota model (YouTube Data API v3 as of 2026-07):
 *
 *   * `channels.list?forHandle=@X`   — 1 unit from the general
 *                                      quota (default 10,000/day).
 *
 *   * `search.list?type=channel&q=@X` — 1 unit from the general
 *                                      quota AND 1 call from the
 *                                      **Search Queries** quota
 *                                      bucket (default 100/day).
 *                                      The Search Queries cap is the
 *                                      tight limit, not the general
 *                                      one.
 *
 * Historically the handle case flowed through `search.list`, so every
 * creator lookup consumed one entry from the 100/day Search Queries
 * bucket. On `/creators` a cold-cache warm-up therefore spent 20
 * search queries; only about **five warm-ups per day** were possible
 * before subsequent `search.list` calls returned `403 quotaExceeded`.
 * On serverless (where the process-local `TtlCache` doesn't persist
 * across function invocations) that cap was easy to hit under
 * routine traffic, and the symptom was: most creator cards fell back
 * to their initial-based avatar while whichever handful of requests
 * won the race got cached and continued to render.
 *
 * Routing handle lookups through `channels.list?forHandle=` sidesteps
 * the Search Queries bucket entirely. The general 10,000-units-per-day
 * quota easily absorbs any realistic number of warm-ups.
 *
 * We also seed the `channel:<id>` cache entry with the same
 * `ChannelDetails` so a subsequent `getChannelById()` (used by the
 * profile page's `resolveChannel()`) is a free cache hit rather
 * than a second 1-unit round trip.
 *
 * Never throws in E2E mock mode — delegates to the same fixtures
 * `getChannelById` uses so tests remain deterministic.
 */
export async function getChannelByHandle(
  handle: string,
): Promise<ChannelDetails | null> {
  const normalized = handle.startsWith("@") ? handle : `@${handle}`;
  const cacheKey = `handle:${normalized.toLowerCase()}`;

  if (isE2EMockModeActive()) {
    announceE2EMockIfActive();
    markCache("miss");
    markUpstream("success");
    // The mocked search always returns Alpha/Bravo/Charlie fixtures
    // regardless of query — take the top result's id and route it
    // through the mocked channel-by-id fixture so the returned shape
    // is a full ChannelDetails.
    const results = await mockedSearchChannels(normalized);
    const top = results[0];
    if (!top) return null;
    return mockedGetChannelById(top.channelId);
  }

  return (channelCache as {
    getOrLoad(
      key: string,
      loader: () => Promise<ChannelDetails | null>,
    ): Promise<ChannelDetails | null>;
  }).getOrLoad(cacheKey, async () => {
    const res = await ytFetch<YtChannelResponse>("channels", {
      part: "snippet,statistics,contentDetails,brandingSettings",
      forHandle: normalized,
      maxResults: 1,
    });
    const c = res.items[0];
    if (!c) return null;
    const details = mapChannel(c);
    // Warm the by-id cache too — the profile page (resolveChannel in
    // creatorProfile.ts) calls getChannelById after this, and this
    // makes that call free.
    (channelCache as {
      set(key: string, value: ChannelDetails): void;
    }).set(`channel:${details.channelId}`, details);
    return details;
  });
}

export async function getRecentVideos(
  uploadsPlaylistId: string,
  limit: number = youtube.recentVideosCount,
): Promise<VideoItem[]> {
  const safeLimit = Math.min(Math.max(Math.floor(limit || 0), 1), 50);
  if (isE2EMockModeActive()) {
    announceE2EMockIfActive();
    markCache("miss");
    markUpstream("success");
    return mockedGetRecentVideos(uploadsPlaylistId, safeLimit);
  }
  return (videosCache as {
    getOrLoad(
      key: string,
      loader: () => Promise<VideoItem[]>,
    ): Promise<VideoItem[]>;
  }).getOrLoad(`videos:${uploadsPlaylistId}:${safeLimit}`, async () => {
    const playlist = await ytFetch<YtPlaylistItemsResponse>("playlistItems", {
      part: "contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: safeLimit,
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
      .map(mapVideo);
  });
}
