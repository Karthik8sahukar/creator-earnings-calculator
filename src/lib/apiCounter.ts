/**
 * Development-only YouTube API call counter / instrumentation.
 *
 * Tracks the number of calls to each YouTube Data API endpoint so
 * developers can verify that:
 *   - search.list stays at zero during supported flows
 *   - channels.list, playlistItems.list, videos.list stay within budget
 *
 * NEVER logs API keys. Only tracks endpoint names and call counts.
 *
 * In production, counters are still maintained (they're cheap) but
 * the summary is only logged when `NODE_ENV !== "production"` or
 * when explicitly requested via `getApiCounters()`.
 */

import { logger } from "./logger";

export type YouTubeEndpoint =
  | "youtube.channels.list"
  | "youtube.playlistItems.list"
  | "youtube.videos.list"
  | "youtube.search.list";

const counters: Record<YouTubeEndpoint, number> = {
  "youtube.channels.list": 0,
  "youtube.playlistItems.list": 0,
  "youtube.videos.list": 0,
  "youtube.search.list": 0,
};

/**
 * Increment the counter for a specific YouTube API endpoint.
 * Called by the YouTube service layer on every upstream request.
 */
export function trackApiCall(endpoint: YouTubeEndpoint): void {
  counters[endpoint]++;

  if (process.env.NODE_ENV !== "production") {
    logger.debug("youtube.api.call", {
      endpoint,
      totalCalls: counters[endpoint],
    });
  }
}

/**
 * Get a snapshot of all API counters. Safe to expose in dev tools
 * or health checks. Never contains secrets.
 */
export function getApiCounters(): Readonly<Record<YouTubeEndpoint, number>> {
  return { ...counters };
}

/**
 * Reset all counters. Used in tests.
 */
export function resetApiCounters(): void {
  counters["youtube.channels.list"] = 0;
  counters["youtube.playlistItems.list"] = 0;
  counters["youtube.videos.list"] = 0;
  counters["youtube.search.list"] = 0;
}

/**
 * Log a summary of all API counters. Called at the end of a request
 * cycle or on-demand for debugging.
 */
export function logApiCounterSummary(): void {
  logger.info("youtube.api.summary", { ...counters });
}
