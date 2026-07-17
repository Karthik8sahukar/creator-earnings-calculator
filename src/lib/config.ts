/**
 * Centralized runtime and public configuration.
 *
 * This module is safe to import from both client and server code —
 * everything here is either a compile-time constant or derived from
 * `NEXT_PUBLIC_*` environment variables (validated in `env.public.ts`).
 *
 * Server-only secrets (the YouTube API key, timeouts, rate-limit
 * settings, etc.) live in `env.server.ts` and can only be imported
 * from server code. Client bundles never see them.
 */

import { publicEnv } from "./env.public";

const description =
  "Search any YouTube channel and estimate creator earnings using public statistics from the YouTube Data API v3.";

export const publicConfig = Object.freeze({
  siteName: publicEnv.siteName,
  siteUrl: publicEnv.siteUrl,
  description,
});

export type PublicConfig = typeof publicConfig;

export const youtube = Object.freeze({
  apiBase: "https://www.googleapis.com/youtube/v3",
  searchMaxResults: 8,
  recentVideosCount: 12,
  channelUrlPrefix: "https://www.youtube.com/channel/",
  handleUrlPrefix: "https://www.youtube.com/@",
  watchUrlPrefix: "https://www.youtube.com/watch?v=",
  shortsUrlPrefix: "https://www.youtube.com/shorts/",
});

/**
 * Editorial "last updated" date for legal / methodology pages. Sourced
 * from centralized config so all legal copy stays in sync.
 */
export const legalLastUpdatedIso = "2026-07-17";
