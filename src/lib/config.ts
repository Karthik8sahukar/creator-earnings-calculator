/**
 * Centralized runtime & public configuration.
 * Do NOT import server-only secrets from here in client components.
 * `serverEnv` is only safe inside route handlers / server components.
 */

export const publicConfig = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? "Creator Earnings Calculator",
  siteUrl: (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, ""),
  description:
    "Search any YouTube channel and estimate creator earnings using public statistics from the YouTube Data API v3.",
} as const;

export const serverEnv = {
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
} as const;

export const youtube = {
  apiBase: "https://www.googleapis.com/youtube/v3",
  searchMaxResults: 8,
  recentVideosCount: 12,
  channelUrlPrefix: "https://www.youtube.com/channel/",
  handleUrlPrefix: "https://www.youtube.com/@",
  watchUrlPrefix: "https://www.youtube.com/watch?v=",
  shortsUrlPrefix: "https://www.youtube.com/shorts/",
} as const;
