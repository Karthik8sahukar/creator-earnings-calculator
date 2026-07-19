import "server-only";

import { YouTubeApiError } from "../errors";
import { analyzePerformance } from "../performance";
import {
  getChannelById,
  getRecentVideos,
  searchChannels,
} from "../youtube";
import type {
  ChannelDetails,
  PerformanceAnalysis,
  VideoItem,
} from "@/types/youtube";
import {
  calculateEngagement,
  type EngagementMetrics,
} from "./calculateEngagement";
import { calculateGrowth, type GrowthMetrics } from "./calculateGrowth";
import {
  estimateRevenue,
  type RevenueEstimate,
} from "./estimateRevenue";
import {
  normalizeChannelInput,
  type NormalizedChannelInput,
} from "./normalizeInput";

// Re-export so consumers can `import { analyzeChannel, YouTubeApiError }`
// from a single module.
export { YouTubeApiError };
export type { NormalizedChannelInput } from "./normalizeInput";
export type { RevenueEstimate } from "./estimateRevenue";
export type { EngagementMetrics } from "./calculateEngagement";
export type { GrowthMetrics, GrowthLabel } from "./calculateGrowth";

/**
 * ─────────────────────────────────────────────────────────────────
 *   Channel Analyzer — orchestrator
 * ─────────────────────────────────────────────────────────────────
 *
 * Takes any of the accepted user inputs (raw channel id, @handle,
 * URL, free-text name) and returns a self-contained
 * `ChannelAnalysis` composed of five layers:
 *
 *   1. channel        — from `getChannelById`
 *   2. topVideos      — from `getRecentVideos`, sorted by viewCount desc
 *   3. performance    — from `analyzePerformance` on the same sample
 *   4. engagement     — from `calculateEngagement` on the same sample
 *   5. revenue        — from `estimateRevenue` using the performance
 *                        estimate + channel's country
 *   6. growth         — from `calculateGrowth` combining everything above
 *
 * Reuse:
 *   - `getChannelById` / `getRecentVideos` / `searchChannels` from
 *     `src/lib/youtube.ts` — already cache-deduplicated and E2E-mock
 *     aware. This function issues at most **two** upstream calls
 *     (one for the channel details, one for its uploads playlist)
 *     when the input is already a channel id, and at most **three**
 *     (one search + one channel + one videos) for a handle / URL /
 *     free-text input.
 *
 * Error semantics:
 *   - This function NEVER throws. Every failure mode is mapped to a
 *     structured `AnalyzerFallbackReason` so the page can render a
 *     specific message per case (matching the `creatorProfile.ts`
 *     precedent).
 *   - When `status === "ok"` the caller is guaranteed a fully-
 *     populated `analysis`; when `status === "error"` or `"empty"`
 *     it is `null` and `fallbackReason` explains why.
 */

/**
 * Why the analyzer couldn't produce a full analysis. The UI uses this
 * to render a specific, actionable message per case.
 */
export type AnalyzerFallbackReason =
  | "empty-input"            // Nothing was typed.
  | "invalid-input"          // Non-empty but couldn't be resolved to a channel.
  | "not-found"              // Handle / name did not match any channel.
  | "not-configured"         // Server has no YouTube API key.
  | "quota-exceeded"         // Daily API quota exhausted.
  | "upstream-unavailable"   // YouTube is 5xx-ing or timing out.
  | "unknown-error";         // Anything else — logged server-side.

export interface ChannelAnalysis {
  channel: ChannelDetails;
  /** The uploads sample used for every derived metric (sorted newest first, from YouTube). */
  videos: VideoItem[];
  /** The same sample re-sorted by view count desc. */
  topVideos: VideoItem[];
  performance: PerformanceAnalysis;
  engagement: EngagementMetrics;
  revenue: RevenueEstimate;
  growth: GrowthMetrics;
}

export interface AnalyzerResult {
  status: "ok" | "empty" | "error";
  /** The normalized form of the input, echoed back for the UI. */
  input: NormalizedChannelInput;
  /** Populated when `status === "ok"`. */
  analysis: ChannelAnalysis | null;
  /** Populated when `status !== "ok"`. Never populated on success. */
  fallbackReason: AnalyzerFallbackReason | null;
}

/**
 * Map a `YouTubeApiError` to an `AnalyzerFallbackReason`.
 *
 * Buckets (matching the taxonomy the product spec requires):
 *
 *   • not-configured       — the server is misconfigured
 *   • quota-exceeded       — daily YouTube quota exhausted
 *   • upstream-unavailable — 5xx / timeout / network — a *real*
 *                            failure to reach or hear back from
 *                            YouTube. The user should retry.
 *   • not-found            — YouTube responded successfully but no
 *                            channel matches. NOT an error.
 *   • unknown-error        — YouTube returned an unexpected shape
 *                            or an unrecognised status/reason. Rare
 *                            and worth logging.
 *
 * `UPSTREAM_ERROR` (returned by `youtube.ts` for genuinely weird
 * upstream statuses) and `MALFORMED_UPSTREAM` (returned when the
 * JSON parse fails) are unusual-response conditions — they belong
 * in `unknown-error`, NOT `upstream-unavailable`, otherwise the
 * user gets a "try again later" message for a bug we should
 * actually investigate.
 */
function mapErrorToReason(err: unknown): AnalyzerFallbackReason {
  if (!(err instanceof YouTubeApiError)) return "unknown-error";
  switch (err.code) {
    case "MISSING_API_KEY":
    case "INVALID_API_KEY":
      return "not-configured";
    case "QUOTA_EXCEEDED":
      return "quota-exceeded";
    case "UPSTREAM_UNAVAILABLE":
    case "UPSTREAM_TIMEOUT":
    case "NETWORK_ERROR":
      return "upstream-unavailable";
    case "FORBIDDEN":
      // 403 that isn't quota / bad-key — the API rejected the
      // specific request. Bucketing under "not-configured" surfaces
      // an operator-actionable message rather than telling users
      // to retry an already-refused request.
      return "not-configured";
    case "NOT_FOUND":
      return "not-found";
    case "UPSTREAM_ERROR":
    case "MALFORMED_UPSTREAM":
      return "unknown-error";
    default:
      return "unknown-error";
  }
}

/**
 * Confidence check for free-text ("name") searches.
 *
 * YouTube's search endpoint is very lenient — a random keystroke
 * like "hjbhj" can return unrelated channels that happen to have
 * "hjbhj" in their tags or description. Showing one of those to the
 * user as "your analyzed channel" is worse UX than saying we
 * couldn't find a match.
 *
 * We consider a result plausible when EITHER:
 *
 *   1. Its handle (case-insensitive, `@` stripped) contains the
 *      query, or
 *   2. Its title (case-insensitive) contains the query,
 *
 * anywhere. This is a deliberately weak substring check — it lets
 * "kurzgesagt" match "Kurzgesagt – In a Nutshell" and "mrbeast"
 * match "MrBeast" — but rules out low-signal single-word typos.
 *
 * Handle-kind searches use a stricter exact-match check further
 * down the call site; this helper is only for name lookups.
 */
function isPlausibleNameMatch(
  query: string,
  result: {
    title?: string | null;
    handle?: string | null;
  },
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const title = (result.title ?? "").toLowerCase();
  const handle = (result.handle ?? "").toLowerCase().replace(/^@/, "");
  return title.includes(q) || handle.includes(q);
}

/**
 * Resolve any input kind (channel id / handle / free text) to a live
 * `ChannelDetails`. Never throws — any YouTube error is caught and
 * mapped to a fallback reason by the outer `analyzeChannel`.
 *
 * The strategy is:
 *
 *   • channelId  → `getChannelById(value)`         (1 upstream call)
 *   • handle     → `searchChannels("@handle")` →
 *                  `getChannelById(topResult.id)`  (2 upstream calls)
 *   • name       → `searchChannels(name)` →
 *                  `getChannelById(topResult.id)`  (2 upstream calls)
 *
 * All three helpers are cache-deduplicated in `src/lib/cache.ts`, so
 * re-analyzing the same channel within the TTL window issues zero
 * additional network requests.
 */
async function resolveChannel(
  input: NormalizedChannelInput,
): Promise<ChannelDetails | null> {
  if (input.kind === "channelId") {
    return getChannelById(input.value);
  }

  // Handle + name paths both go through the search endpoint — the
  // YouTube service already prepends "@" for handles internally.
  const results = await searchChannels(
    input.kind === "handle" ? `@${input.value}` : input.value,
  );
  if (results.length === 0) return null;

  // For handle lookups, prefer the exact case-insensitive match
  // (matches the creatorProfile.ts pattern). This guards against
  // YouTube's search returning a similarly-named channel first.
  if (input.kind === "handle") {
    const wanted = `@${input.value.toLowerCase()}`;
    const exact = results.find(
      (r) => r.handle && r.handle.toLowerCase() === wanted,
    );
    const picked = exact ?? results[0];
    return getChannelById(picked.channelId);
  }

  // Free-text: pick the first result whose title or handle
  // *actually* contains the user's query. This filters out
  // low-signal matches (YouTube search will surface unrelated
  // channels for random / typo queries like "hjbhj") while still
  // resolving well-known channel names via a plain substring.
  const plausible = results.find((r) => isPlausibleNameMatch(input.value, r));
  if (!plausible) return null;
  return getChannelById(plausible.channelId);
}

/**
 * Run the full Channel Analyzer pipeline. Never throws.
 */
export async function analyzeChannel(
  rawInput: string,
): Promise<AnalyzerResult> {
  const input = normalizeChannelInput(rawInput);

  if (!input.usable) {
    // Distinguish "user typed nothing" (a natural landing state) from
    // "user typed something we couldn't parse" (an error banner). The
    // normalizer's `invalidReason` is the single source of truth for
    // which is which.
    if (input.invalidReason === "empty") {
      return {
        status: "empty",
        input,
        analysis: null,
        fallbackReason: "empty-input",
      };
    }
    return {
      status: "error",
      input,
      analysis: null,
      fallbackReason: "invalid-input",
    };
  }

  // ── 1. Resolve the channel ───────────────────────────────────────
  let channel: ChannelDetails | null = null;
  try {
    channel = await resolveChannel(input);
  } catch (err) {
    const reason = mapErrorToReason(err);
    console.error("channel-analyzer:resolveChannel failed", {
      kind: input.kind,
      code: err instanceof YouTubeApiError ? err.code : "UNEXPECTED",
    });
    return {
      status: "error",
      input,
      analysis: null,
      fallbackReason: reason,
    };
  }

  if (!channel) {
    return {
      status: "error",
      input,
      analysis: null,
      fallbackReason: "not-found",
    };
  }

  // ── 2. Fetch recent uploads (soft failure) ───────────────────────
  //
  // We intentionally do NOT bubble a video-fetch failure to the whole
  // pipeline: the channel card is still valuable on its own, so if
  // videos fail we render what we have with zeroed derived metrics.
  //
  let videos: VideoItem[] = [];
  if (channel.uploadsPlaylistId) {
    try {
      videos = await getRecentVideos(channel.uploadsPlaylistId);
    } catch (err) {
      console.error("channel-analyzer:getRecentVideos failed", {
        channelId: channel.channelId,
        code: err instanceof YouTubeApiError ? err.code : "UNEXPECTED",
      });
      videos = [];
    }
  }

  // ── 3. Derived metrics ───────────────────────────────────────────
  const performance = analyzePerformance(videos);
  const engagement = calculateEngagement(videos);
  const revenue = estimateRevenue({
    monthlyViews: performance.estimatedMonthlyViews,
    countryCode: channel.country,
    contentType: "mixed",
  });
  const growth = calculateGrowth({ channel, performance, engagement });

  // Top videos = same sample, sorted by view count desc. We don't
  // hit YouTube again; the sample is already fetched.
  const topVideos = [...videos].sort((a, b) => b.viewCount - a.viewCount);

  return {
    status: "ok",
    input,
    analysis: {
      channel,
      videos,
      topVideos,
      performance,
      engagement,
      revenue,
      growth,
    },
    fallbackReason: null,
  };
}
