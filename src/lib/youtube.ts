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
import { logger } from "./logger";
import {
  markCache,
  markUpstream,
  type UpstreamCategory,
} from "./observability";
import { parseChannelQuery } from "./parseQuery";

// ---------- Quota-efficiency primitives ----------

/**
 * Normalize a free-text search query for BOTH cache lookup and the
 * outgoing YouTube request.
 *
 *   - `key`     : lowercase, whitespace collapsed to single spaces.
 *                 Used as the cache key so "Mr Beast", "mr beast" and
 *                 "  mr   beast  " all hit the same entry.
 *   - `display` : whitespace collapsed but original case preserved.
 *                 Sent to `search.list` as `q=`; YouTube's ranker is
 *                 tolerant of case but we don't gratuitously alter
 *                 the user's input.
 */
export function normalizeSearchQuery(raw: string): {
  key: string;
  display: string;
} {
  const collapsed = raw.trim().replace(/\s+/g, " ");
  return { key: collapsed.toLowerCase(), display: collapsed };
}

/**
 * Global quota circuit breaker.
 *
 * The YouTube daily quota (default 10 000 units) is shared across every
 * endpoint we call. Once Google returns `QUOTA_EXCEEDED`, every further
 * request in the same day is guaranteed to fail — and each of those
 * failed requests still counts against a separate "per-project queries
 * per minute" limit. So blindly retrying is worse than doing nothing.
 *
 * States:
 *   - CLOSED   : normal operation. Requests pass through.
 *   - OPEN     : a QUOTA_EXCEEDED response was received recently. All
 *                calls are short-circuited with QUOTA_EXCEEDED for at
 *                least `QUOTA_COOLDOWN_MS`.
 *   - HALF_OPEN: cooldown elapsed. Exactly one probe request is allowed
 *                through to test whether the upstream recovered. All
 *                other concurrent callers are still blocked until the
 *                probe resolves. On success → CLOSED. On another
 *                QUOTA_EXCEEDED → back to OPEN with a fresh `openedAt`.
 *
 * The state is process-local. In a multi-instance deployment each replica
 * has its own breaker — that's fine: each replica independently learns
 * "quota is dead" the first time it sees a QUOTA_EXCEEDED. A globally
 * shared breaker would need Redis; not worth it for a soft signal.
 */
const QUOTA_COOLDOWN_MS = 10 * 60_000; // 10 minutes

interface CircuitState {
  openedAt: number;
  probeInFlight: boolean;
}

const circuit: { state: CircuitState | null } = { state: null };

type CircuitDecision = "closed" | "open" | "half_open";

/** Read the current circuit decision. Called before each upstream fetch. */
function readCircuit(nowMs: number = Date.now()): CircuitDecision {
  const s = circuit.state;
  if (!s) return "closed";
  const elapsed = nowMs - s.openedAt;
  if (elapsed >= QUOTA_COOLDOWN_MS) {
    if (s.probeInFlight) return "open";
    // Cooldown elapsed and no probe outstanding — allow this caller
    // to be the probe.
    s.probeInFlight = true;
    return "half_open";
  }
  return "open";
}

/** Called when we've just received QUOTA_EXCEEDED from Google. */
function tripCircuit(): void {
  circuit.state = { openedAt: Date.now(), probeInFlight: false };
  logger.warn("youtube.circuit_open", {
    reason: "quota_exceeded",
    cooldownMs: QUOTA_COOLDOWN_MS,
  });
}

/** Called after a successful probe. */
function closeCircuit(): void {
  if (circuit.state) {
    logger.info("youtube.circuit_close", {});
    circuit.state = null;
  }
}

/** Called if a probe failed with something *other than* QUOTA_EXCEEDED. */
function releaseProbe(): void {
  if (circuit.state) circuit.state.probeInFlight = false;
}

/** Exposed for tests only. */
export const _quotaCircuitBreakerForTests = {
  reset(): void {
    circuit.state = null;
  },
  isOpen(): boolean {
    return circuit.state !== null && !circuit.state.probeInFlight;
  },
  isHalfOpen(): boolean {
    return circuit.state !== null && circuit.state.probeInFlight;
  },
  trip(): void {
    tripCircuit();
  },
  /**
   * Force the "opened at" timestamp to `ms` milliseconds in the past —
   * simulates the cooldown elapsing without touching system time.
   * No-op if the breaker isn't currently open.
   */
  ageBy(ms: number): void {
    if (circuit.state) circuit.state.openedAt = Date.now() - ms;
  },
  cooldownMs: QUOTA_COOLDOWN_MS,
};

/**
 * Approximate quota units for the calls we make. Used for the safe
 * observability logs so an operator can eyeball daily burn rates.
 *
 * Source: https://developers.google.com/youtube/v3/determine_quota_cost
 *   - search.list       : 100 units
 *   - channels.list     :   1 unit
 *   - playlistItems.list:   1 unit
 *   - videos.list       :   1 unit
 */
const QUOTA_UNITS_PER_ENDPOINT: Record<string, number> = {
  search: 100,
  channels: 1,
  playlistItems: 1,
  videos: 1,
};

/**
 * Produce a stable non-reversible hash for the cache-key of a query.
 * We log the hash instead of the raw query so operators can correlate
 * repeated searches without persisting user-typed text.
 */
function hashQueryKey(key: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `q_${h.toString(36)}`;
}
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
    // Safe temporary log for operators. We only log the boolean
    // "present-or-not" — never the key itself. This is the highest
    // signal you can get without leaking a secret.
    logger.error("youtube.missing_api_key", { apiKeyPresent: false });
    throw new YouTubeApiError(
      500,
      "MISSING_API_KEY",
      "The server is missing its YouTube API configuration. Set the YOUTUBE_API_KEY environment variable on the server and redeploy.",
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
    case "KEY_RESTRICTED":
      return "invalid_key";
    case "MISSING_API_KEY":
      return "missing_key";
    case "MALFORMED_UPSTREAM":
      return "malformed_response";
    case "API_DISABLED":
    case "FORBIDDEN":
      return "forbidden";
    default:
      return "upstream_error";
  }
}

/**
 * Map an upstream status + reason string to a stable public error
 * code, an HTTP status suitable for the response, and a short,
 * user-safe message. We NEVER surface the raw Google error verbatim
 * — it can contain internal-looking details.
 *
 * The mapping is exhaustive: every documented YouTube Data API error
 * reason is classified. Anything unknown resolves to a "temporarily
 * unavailable" message with a `YOUTUBE_API_ERROR` code, NEVER the
 * old catch-all "returned an unexpected response" which gave the
 * user no actionable information.
 *
 * Documented reasons handled here:
 *   quota / rate limits  : quotaExceeded, dailyLimitExceeded,
 *                          userRateLimitExceeded, rateLimitExceeded
 *   invalid key          : keyInvalid, keyExpired, badRequest
 *                          (400 shape often means "key looks wrong"),
 *                          invalid, unauthorized
 *   key restricted       : ipRefererBlocked, ipBlocked, refererBlocked,
 *                          appBlocked
 *   api disabled         : accessNotConfigured, apiNotActivatedError,
 *                          SERVICE_DISABLED
 *   invalid request      : invalidArgument, parseError, invalidQuery
 *   not found            : notFound, channelNotFound, playlistNotFound
 *   forbidden (other)    : forbidden, insufficientPermissions
 *   upstream unavailable : any 5xx
 */
export function mapUpstreamError(
  status: number,
  reason: string | undefined,
): { code: string; status: number; message: string } {
  const normalized = (reason ?? "").toLowerCase();

  // ---- Quota / rate-limit reasons (403 in practice, sometimes 429) ----
  if (
    normalized.includes("quota") ||
    normalized.includes("dailylimit") ||
    normalized.includes("ratelimit")
  ) {
    return {
      code: "QUOTA_EXCEEDED",
      status: 429,
      message:
        "The YouTube API quota has been exceeded. Please try again later.",
    };
  }

  // ---- Invalid / expired API key (400 or 403 depending on Google) ----
  if (
    normalized.includes("keyinvalid") ||
    normalized.includes("keyexpired") ||
    normalized === "unauthorized"
  ) {
    return {
      code: "INVALID_API_KEY",
      status: 500,
      message:
        "The server's YouTube API key is invalid or expired. If you are the operator, generate a new key in Google Cloud and redeploy.",
    };
  }

  // ---- Key restricted (referrer / IP / app) ----
  // These fire when the key has HTTP-referrer or IP restrictions that
  // don't match the server making the call (a common Vercel mistake).
  if (
    normalized.includes("iprefererblocked") ||
    normalized.includes("ipblocked") ||
    normalized.includes("refererblocked") ||
    normalized.includes("referrerblocked") ||
    normalized.includes("appblocked")
  ) {
    return {
      code: "KEY_RESTRICTED",
      status: 500,
      message:
        "The server's YouTube API key is restricted and rejected this request. If you are the operator, remove the HTTP referrer / IP restriction — the app calls YouTube server-to-server.",
    };
  }

  // ---- YouTube Data API not enabled for this project ----
  if (
    normalized.includes("accessnotconfigured") ||
    normalized.includes("apinotactivated") ||
    normalized.includes("service_disabled") ||
    normalized.includes("servicedisabled")
  ) {
    return {
      code: "API_DISABLED",
      status: 500,
      message:
        "The YouTube Data API v3 is not enabled for the server's Google Cloud project. If you are the operator, enable it in the API Library and redeploy.",
    };
  }

  // ---- 404 / not-found reasons ----
  if (
    status === 404 ||
    normalized === "notfound" ||
    normalized.includes("notfound")
  ) {
    return {
      code: "NOT_FOUND",
      status: 404,
      message: "The requested YouTube resource was not found.",
    };
  }

  // ---- 400 / invalid-request reasons (query problems, not key) ----
  if (
    status === 400 ||
    normalized.includes("invalidargument") ||
    normalized.includes("badrequest") ||
    normalized.includes("parseerror") ||
    normalized.includes("invalidquery") ||
    normalized.includes("invalidvalue") ||
    normalized.includes("invalidparameter")
  ) {
    return {
      code: "BAD_REQUEST",
      status: 400,
      message:
        "The YouTube API rejected this request. Try a different search term.",
    };
  }

  // ---- 401 / 403 catch-all (forbidden, insufficient permissions, ...) ----
  if (
    status === 401 ||
    status === 403 ||
    normalized.includes("forbidden") ||
    normalized.includes("insufficient")
  ) {
    return {
      code: "FORBIDDEN",
      status: 502,
      message:
        "The YouTube API refused this request. If you are the operator, check the API key's restrictions and permissions.",
    };
  }

  // ---- 5xx upstream unavailable ----
  if (status >= 500 && status < 600) {
    return {
      code: "UPSTREAM_UNAVAILABLE",
      status: 502,
      message:
        "The YouTube API is currently unavailable. Please try again shortly.",
    };
  }

  // ---- Fallback: a status we don't have an explicit branch for ----
  // Deliberately NOT the old "returned an unexpected response" copy —
  // that gave the user zero actionable information. Instead treat it
  // as a temporary upstream problem, which is what it almost always
  // is (edge proxy hiccups, brief 3xx redirects, non-JSON error body).
  return {
    code: "YOUTUBE_API_ERROR",
    status: 502,
    message:
      "YouTube search is temporarily unavailable. Please try again shortly.",
  };
}

async function ytFetch<T>(
  path: string,
  params: Record<string, string | number | undefined>,
): Promise<T> {
  const key = assertKey();

  // ---- Circuit breaker: short-circuit before we even open a socket ----
  const decision = readCircuit();
  if (decision === "open") {
    markUpstream("quota_exceeded");
    logger.warn("youtube.circuit_blocked", {
      endpoint: path,
      quotaUnitsCost: 0,
      quotaUnitsSaved: QUOTA_UNITS_PER_ENDPOINT[path] ?? 1,
      apiKeyPresent: true,
    });
    throw new YouTubeApiError(
      429,
      "QUOTA_EXCEEDED",
      "The YouTube API quota has been exceeded. Please try again later.",
    );
  }
  const isProbe = decision === "half_open";

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
      // Live channel searches must not be cached at the framework layer.
      // Our in-process TTL cache is the sole authoritative caching layer
      // for successful responses; opt out of any implicit Next.js cache.
      cache: "no-store",
    });
  } catch (err) {
    // The fetch failed at the network level. This includes timeouts.
    // Do NOT include the request URL — it contains the API key.
    // A network/timeout failure on a half-open probe is NOT a quota
    // signal, so release the probe slot so a later request can retry.
    if (isProbe) releaseProbe();
    if ((err as { name?: string }).name === "AbortError") {
      markUpstream("timeout");
      logger.warn("youtube.upstream_timeout", {
        endpoint: path,
        apiKeyPresent: true,
        timeoutMs: UPSTREAM_TIMEOUT_MS,
      });
      throw new YouTubeApiError(
        504,
        "UPSTREAM_TIMEOUT",
        "The YouTube API took too long to respond. Please try again.",
      );
    }
    markUpstream("network_error");
    logger.error("youtube.network_error", {
      endpoint: path,
      apiKeyPresent: true,
    });
    throw new YouTubeApiError(
      502,
      "NETWORK_ERROR",
      "Could not reach the YouTube API. Please try again shortly.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    // Try to extract Google's classified reason. The upstream error
    // body is JSON in the happy case, but may be HTML or plain text
    // (edge proxy, WAF, gateway). Handle both without throwing.
    let reason: string | undefined;
    let upstreamMessage: string | undefined;
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      // ignore — we still have status
    }
    if (bodyText) {
      try {
        const parsedBody = JSON.parse(bodyText) as {
          error?: {
            message?: string;
            status?: string;
            errors?: { reason?: string }[];
          };
        };
        reason =
          parsedBody.error?.errors?.[0]?.reason ??
          parsedBody.error?.status;
        upstreamMessage = parsedBody.error?.message;
      } catch {
        // Non-JSON response body (HTML error page, plain text). We use
        // status alone and let mapUpstreamError classify it.
      }
    }

    const mapped = mapUpstreamError(res.status, reason);
    markUpstream(categoryFor(mapped.code));

    // ---- Circuit breaker bookkeeping ----
    if (mapped.code === "QUOTA_EXCEEDED") {
      // Real quota exhaustion → open (or re-arm) the breaker.
      // If this was a half-open probe, the probeInFlight flag is
      // cleared by tripCircuit() replacing the state entirely.
      tripCircuit();
    } else if (isProbe) {
      // Probe failed for a reason other than quota — release the slot
      // so subsequent requests are re-evaluated on their own merits.
      releaseProbe();
    }

    // Safe temporary log: upstream status, classified reason, our
    // outgoing code, and a boolean about the API key. Never the key
    // itself, and never the URL (which carries the key).
    logger.warn("youtube.upstream_error", {
      endpoint: path,
      upstreamStatus: res.status,
      upstreamReason: reason,
      // Redact but include first 200 chars of Google's own message.
      // Our logger.redact() strips API keys before writing.
      upstreamMessage: upstreamMessage?.slice(0, 200),
      // Whether the body wasn't JSON at all — signals a WAF / edge
      // problem rather than a plain YouTube-level error.
      bodyIsJson: Boolean(reason || upstreamMessage),
      apiKeyPresent: true,
      resolvedCode: mapped.code,
      resolvedStatus: mapped.status,
      quotaUnitsCost: QUOTA_UNITS_PER_ENDPOINT[path] ?? 1,
      circuitProbe: isProbe,
    });

    throw new YouTubeApiError(mapped.status, mapped.code, mapped.message);
  }

  // Success path. Safely parse the JSON — the body should always be
  // JSON on 2xx, but a broken proxy could still return HTML on 200.
  let parsed: T;
  try {
    parsed = (await res.json()) as T;
  } catch {
    if (isProbe) releaseProbe();
    markUpstream("malformed_response");
    logger.warn("youtube.malformed_response", {
      endpoint: path,
      upstreamStatus: res.status,
      apiKeyPresent: true,
    });
    throw new YouTubeApiError(
      502,
      "MALFORMED_UPSTREAM",
      "The YouTube API returned an unreadable response. Please try again shortly.",
    );
  }

  // Successful response — if this was a half-open probe, the upstream
  // has recovered and the breaker fully closes.
  if (isProbe) closeCircuit();

  markUpstream("success");
  // Safe temporary success log: item count for debugging silent
  // failures in production without leaking any user data.
  const maybeItems = (parsed as unknown as { items?: unknown[] }).items;
  const itemsLen = Array.isArray(maybeItems) ? maybeItems.length : undefined;
  logger.debug("youtube.upstream_success", {
    endpoint: path,
    upstreamStatus: res.status,
    itemCount: itemsLen,
    apiKeyPresent: true,
    quotaUnitsCost: QUOTA_UNITS_PER_ENDPOINT[path] ?? 1,
    circuitProbe: isProbe,
  });
  return parsed;
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
 * Compute the cache key for a raw search query without running the
 * search itself. Exposed so callers (e.g. the /api/search route) can
 * cheaply distinguish a cache-hit from a cache-miss and skip the
 * strict search-specific rate limiter for hits.
 */
export function searchCacheKeyFor(rawQuery: string): string {
  const parsed = parseChannelQuery(rawQuery);
  if (parsed.kind === "channelId") return `channelId:${parsed.value}`;
  if (parsed.kind === "handle") {
    return `handle:${parsed.value.toLowerCase()}`;
  }
  const { key } = normalizeSearchQuery(parsed.value);
  return `name:${key}`;
}

/**
 * True iff `searchChannels(rawQuery)` would return without any upstream
 * YouTube call because it's already cached in-process.
 */
export function isSearchCached(rawQuery: string): boolean {
  return searchCache.peek(searchCacheKeyFor(rawQuery)) !== undefined;
}

/** Convert a `ChannelDetails` record to the compact search-result shape. */
function detailsToSearchResult(
  details: ChannelDetails,
): ChannelSearchResult {
  return {
    channelId: details.channelId,
    title: details.title,
    handle: details.handle,
    description: details.description,
    thumbnail: details.thumbnail,
    subscriberCount: details.hiddenSubscriberCount
      ? null
      : details.subscriberCount,
    hiddenSubscriberCount: details.hiddenSubscriberCount,
  };
}

/**
 * Smart search — quota-aware entry point.
 *
 * The intent is to *never* call the expensive `search.list` endpoint
 * (100 quota units) when a cheaper one will do:
 *
 *   - Raw `UC…` channel id  → `channels.list?id=…`      (1 unit)
 *   - `@handle` / /@handle  → `channels.list?forHandle` (1 unit)
 *   - Anything else         → `search.list` + enrich    (100 + 1 units)
 *
 * Every branch caches through `searchCache` under a canonical key so
 * a second search for "mr beast" / "Mr Beast" / "  Mr   Beast  " is
 * served in-process without spending a single quota unit.
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
  const cacheKey = searchCacheKeyFor(rawQuery);
  const queryHash = hashQueryKey(cacheKey);

  return (searchCache as {
    getOrLoad(
      key: string,
      loader: () => Promise<ChannelSearchResult[]>,
    ): Promise<ChannelSearchResult[]>;
  }).getOrLoad(cacheKey, async () => {
    // ---- Direct channel-id lookup (1 unit) ----
    if (parsed.kind === "channelId") {
      logger.debug("youtube.search.route", {
        method: "channelId",
        queryHash,
        endpoint: "channels",
        quotaUnitsCost: QUOTA_UNITS_PER_ENDPOINT.channels,
      });
      const details = await getChannelById(parsed.value);
      return details ? [detailsToSearchResult(details)] : [];
    }

    // ---- @handle lookup via channels.list?forHandle (1 unit) ----
    if (parsed.kind === "handle") {
      logger.debug("youtube.search.route", {
        method: "handle",
        queryHash,
        endpoint: "channels",
        quotaUnitsCost: QUOTA_UNITS_PER_ENDPOINT.channels,
      });
      const details = await getChannelByHandle(parsed.value);
      return details ? [detailsToSearchResult(details)] : [];
    }

    // ---- Free-text search (100 + 1 units) ----
    const { display } = normalizeSearchQuery(parsed.value);
    if (!display) return [];

    logger.debug("youtube.search.route", {
      method: "search",
      queryHash,
      endpoint: "search",
      quotaUnitsCost:
        QUOTA_UNITS_PER_ENDPOINT.search + QUOTA_UNITS_PER_ENDPOINT.channels,
    });

    const search = await ytFetch<YtSearchResponse>("search", {
      part: "snippet",
      type: "channel",
      q: display,
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
    const details = mapChannel(c);
    // Cross-populate the handle cache so a subsequent lookup by
    // `@handle` for this same channel is an instant cache hit.
    if (details.handle) {
      const handleKey = `handle:${details.handle.replace(/^@/, "").toLowerCase()}`;
      (channelCache as {
        // Direct set on the underlying store: the loader semantics
        // guarantee this call is the winner for `channel:<id>`, so
        // it's safe to also seed the sibling key.
        set(key: string, value: ChannelDetails | null): void;
      }).set(handleKey, details);
    }
    return details;
  });
}

/**
 * Resolve a channel by its `@handle` using YouTube's `channels.list?forHandle=`
 * endpoint (1 quota unit) instead of `search.list` (100 quota units).
 *
 * The `forHandle` parameter accepts the handle with or without the
 * leading `@`. We always send it with `@` for consistency and to
 * avoid ambiguity with `forUsername` (legacy).
 *
 * Cached in `channelCache` under `handle:<normalized>` (24h TTL). Also
 * cross-populates `channel:<channelId>` on success so subsequent
 * lookups by id are free.
 */
export async function getChannelByHandle(
  handle: string,
): Promise<ChannelDetails | null> {
  const normalized = handle.trim().replace(/^@/, "").toLowerCase();
  if (!normalized) return null;

  if (isE2EMockModeActive()) {
    announceE2EMockIfActive();
    markCache("miss");
    markUpstream("success");
    // In E2E mock mode we route through the mocked search so fixtures
    // continue to drive the UI. This path never hits the network.
    const results = await mockedSearchChannels(`@${normalized}`);
    const picked = results[0];
    if (!picked) return null;
    // Adapt the compact search-result shape to the full details shape
    // expected here. Only the fields the UI actually renders are
    // populated — enough for E2E tests to succeed.
    return {
      channelId: picked.channelId,
      title: picked.title,
      handle: picked.handle,
      description: picked.description,
      thumbnail: picked.thumbnail,
      bannerUrl: null,
      subscriberCount: picked.subscriberCount,
      hiddenSubscriberCount: picked.hiddenSubscriberCount,
      viewCount: 0,
      videoCount: 0,
      publishedAt: "",
      country: null,
      uploadsPlaylistId: "",
      channelUrl: `${youtube.handleUrlPrefix}${normalized}`,
      customUrl: picked.handle,
    };
  }

  return (channelCache as {
    getOrLoad(
      key: string,
      loader: () => Promise<ChannelDetails | null>,
    ): Promise<ChannelDetails | null>;
  }).getOrLoad(`handle:${normalized}`, async () => {
    const res = await ytFetch<YtChannelResponse>("channels", {
      part: "snippet,statistics,contentDetails,brandingSettings",
      forHandle: `@${normalized}`,
      maxResults: 1,
    });
    const c = res.items[0];
    if (!c) return null;
    const details = mapChannel(c);
    // Cross-populate the id cache so a subsequent lookup by
    // channelId is a free hit.
    (channelCache as {
      set(key: string, value: ChannelDetails | null): void;
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
