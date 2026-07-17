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

/**
 * Canonical product name.
 *
 * Deliberately hardcoded here (not sourced from an environment
 * variable) so that a stale `NEXT_PUBLIC_SITE_NAME` value on any
 * deployment CANNOT cause the header, footer, JSON-LD, Open Graph, or
 * any other branding surface to render the wrong name.
 *
 * If a fork of this app wants to rebrand, change this single constant.
 */
export const BRAND_NAME = "YouTube Money Calculator";

/**
 * Meta description used across metadata (Open Graph, Twitter, and any
 * page that doesn't override it). Kept in sync with the branding guide.
 */
const description =
  "Estimate YouTube channel earnings using public statistics. Calculate potential monthly income, RPM, CPM, Shorts revenue, sponsorship value, and more with our free YouTube Money Calculator.";

export const publicConfig = Object.freeze({
  siteName: BRAND_NAME,
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
