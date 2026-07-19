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
 * Map a `YouTubeApiError` to a `AnalyzerFallbackReason`.
 *
 * Mirrors the mapping in `creatorProfile.ts` so the two features
 * classify the same upstream failure identically. The one difference
 * is `NOT_FOUND` — for the analyzer this maps to `"not-found"` (a
 * user-facing "we couldn't find that channel"), whereas for the
 * creator profile it maps to `"not-found"` for the same reason.
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
    case "UPSTREAM_ERROR":
    case "MALFORMED_UPSTREAM":
    case "FORBIDDEN":
      return "upstream-unavailable";
    case "NOT_FOUND":
      return "not-found";
    default:
      return "unknown-error";
  }
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

  // Free-text: take the top result. YouTube's search is decent at
  // this for well-known channel names and there's no reliable
  // signal to do better without more user input.
  return getChannelById(results[0].channelId);
}

/**
 * Run the full Channel Analyzer pipeline. Never throws.
 */
export async function analyzeChannel(
  rawInput: string,
): Promise<AnalyzerResult> {
  const input = normalizeChannelInput(rawInput);

  if (!input.usable) {
    return {
      status: "empty",
      input,
      analysis: null,
      fallbackReason: "empty-input",
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
