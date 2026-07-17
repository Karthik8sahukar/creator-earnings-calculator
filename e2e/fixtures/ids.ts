/**
 * Well-known channel ids used by the E2E suite. These mirror the
 * fixtures defined in `src/lib/e2eFixtures.ts`.
 */

export const CHANNEL_IDS = {
  alpha: "UCAAAAAAAAAAAAAAAAAAAAAA",
  bravoNoVideos: "UCBBBBBBBBBBBBBBBBBBBBBB",
  charlieHiddenSubs: "UCCCCCCCCCCCCCCCCCCCCCCC",
  quotaExceeded: "UCQQQQQQQQQQQQQQQQQQQQQQ",
  upstreamUnavailable: "UCUUUUUUUUUUUUUUUUUUUUUU",
  invalid: "not-a-real-id",
} as const;
