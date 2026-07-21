import "server-only";

import {
  type Creator,
  getCreatorCountryTier,
  getCreatorNiche,
  resolveCountryCode,
  resolveNicheId,
} from "./creators";
import { calculateEarnings } from "./earnings";
import { YouTubeApiError } from "./errors";
import { analyzePerformance } from "./performance";
import { REFERENCE_MONETIZATION_PCT } from "./rpmData";
import { calculateSponsorship } from "./simpleCalculators";
import {
  getChannelById,
  getRecentVideos,
} from "./youtube";
import type {
  ChannelDetails,
  EarningsResult,
  PerformanceAnalysis,
  VideoItem,
} from "@/types/youtube";

// Re-export so callers can `import { YouTubeApiError, getCreatorProfile }`
// from a single module.
export { YouTubeApiError };

/**
 * Reason string used when the profile page falls back to placeholder
 * data. Kept as a string union so the UI can render a specific
 * user-facing message per case without coupling to the raw error
 * code from `YouTubeApiError`.
 */
export type CreatorFallbackReason =
  | "not-configured"        // No API key on the server.
  | "quota-exceeded"        // Daily API quota exhausted.
  | "upstream-unavailable"  // YouTube is 5xx-ing.
  | "not-found"             // Channel handle could not be resolved.
  | "not-verified"          // Creator has no verified channel ID — static profile only.
  | "unknown-error";        // Anything else — logged server-side.

export interface CreatorEarningsSnapshot {
  /** Estimated monthly views used as the earnings-estimate input. */
  monthlyViews: number;
  /** Currency code — always USD for the phase-1 profile pages. */
  currency: string;
  /** Long-form-blended expected RPM (USD per 1,000 total views). */
  rpmExpected: number;
  /** Estimated advertiser CPM (USD per 1,000 monetized impressions). */
  cpmExpected: number;
  /** Estimated shorts RPM (USD per 1,000 shorts views). */
  shortsRpmExpected: number;
  /** Full ad-earnings result — used for band cards + monthly / annual. */
  earnings: EarningsResult;
  /** Shorts-only earnings estimate (contentType="shorts"). */
  shortsEarnings: EarningsResult;
  /** Sponsorship rate for a single integration deal. */
  sponsorshipPerVideo: {
    low: number;
    expected: number;
    high: number;
  };
  /** True when the underlying view count was inferred, not observed. */
  monthlyViewsIsEstimate: boolean;
}

export interface CreatorProfile {
  /** The catalog record. */
  creator: Creator;
  /** The live channel details, or a placeholder when the API failed. */
  channel: ChannelDetails;
  /** Recent uploads. Empty when the API failed or the channel has none. */
  videos: VideoItem[];
  /** Same array sorted by views desc — for the "Top videos" section. */
  topVideos: VideoItem[];
  /** Performance analysis (zero-safe when videos is empty). */
  analysis: PerformanceAnalysis;
  /** Earnings snapshot derived from the analysis + creator metadata. */
  earnings: CreatorEarningsSnapshot;
  /**
   * Populated when the profile fell back to placeholder data. The UI
   * uses this to render a soft warning banner explaining why.
   */
  fallbackReason: CreatorFallbackReason | null;
}

// ─────────────────────────────────────────────────────────────────
//   Placeholder / fallback builders
// ─────────────────────────────────────────────────────────────────

/**
 * Build a ChannelDetails placeholder from the creator record so the
 * page can still render — even when YouTube is unavailable.
 *
 * We NEVER fabricate live-looking numbers here: `subscriberCount` is
 * left `null` (which the UI renders as `—` / "Hidden"), and every
 * other numeric is zero. The `hiddenSubscriberCount` flag tells the
 * UI it's a data-availability issue rather than a channel setting.
 */
function buildPlaceholderChannel(creator: Creator): ChannelDetails {
  const handle = creator.youtubeHandle.startsWith("@")
    ? creator.youtubeHandle
    : `@${creator.youtubeHandle}`;
  return {
    channelId: creator.channelId || "",
    title: creator.displayName,
    handle,
    description: creator.description,
    thumbnail: creator.fallbackAvatarUrl ?? "",
    bannerUrl: creator.fallbackBannerUrl ?? null,
    subscriberCount: null,
    hiddenSubscriberCount: true,
    viewCount: 0,
    videoCount: 0,
    publishedAt: "",
    country: creator.countryCode ?? null,
    uploadsPlaylistId: "",
    channelUrl: `https://www.youtube.com/${handle.replace(/^@/, "@")}`,
    customUrl: handle,
  };
}

// ─────────────────────────────────────────────────────────────────
//   Error → fallback mapping
// ─────────────────────────────────────────────────────────────────

function mapErrorToReason(err: unknown): CreatorFallbackReason {
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

// ─────────────────────────────────────────────────────────────────
//   Channel resolution
// ─────────────────────────────────────────────────────────────────

/**
 * Resolve a creator's handle to a live ChannelDetails record.
 *
 * Priority:
 *   1. If `creator.channelId` is set, use it directly (cheapest path).
 *   2. If channelId is empty (unverified creator), return null immediately.
 *      NO YouTube API call is made. The page renders a static profile
 *      with a "not-verified" fallback reason.
 *
 * This prevents unverified creators from consuming API quota when
 * Googlebot or users browse their profile pages.
 */
async function resolveChannel(creator: Creator): Promise<ChannelDetails | null> {
  if (creator.channelId) {
    return getChannelById(creator.channelId);
  }

  // Unverified creator — do NOT call the YouTube API.
  // The caller will set fallbackReason = "not-verified".
  return null;
}

// ─────────────────────────────────────────────────────────────────
//   Monthly-views estimation
// ─────────────────────────────────────────────────────────────────

/**
 * Return a monthly-views figure suitable for the earnings estimator.
 *
 * Priority:
 *   1. `analysis.estimatedMonthlyViews` if the sample gave us a real
 *      number (channel had recent uploads).
 *   2. Total lifetime views divided by months since channel creation
 *      — a coarse but defensible fallback.
 *   3. `0` when we have nothing. The earnings estimate then just
 *      renders as zeros; the UI marks this state visibly.
 */
function estimateMonthlyViews(
  channel: ChannelDetails,
  analysis: PerformanceAnalysis,
): { value: number; isEstimate: boolean } {
  if (analysis.estimatedMonthlyViews > 0) {
    return { value: analysis.estimatedMonthlyViews, isEstimate: true };
  }

  if (channel.viewCount > 0 && channel.publishedAt) {
    const joined = new Date(channel.publishedAt).getTime();
    if (Number.isFinite(joined) && joined > 0) {
      const monthsSince = Math.max(
        (Date.now() - joined) / (30 * 24 * 60 * 60 * 1000),
        1,
      );
      return {
        value: Math.round(channel.viewCount / monthsSince),
        isEstimate: true,
      };
    }
  }

  return { value: 0, isEstimate: true };
}

// ─────────────────────────────────────────────────────────────────
//   Earnings snapshot
// ─────────────────────────────────────────────────────────────────

/**
 * Build the earnings snapshot for a resolved channel. Uses the
 * existing shared estimators (`calculateEarnings`,
 * `calculateSponsorship`, `analyzePerformance`) so this file does
 * NOT duplicate any RPM/CPM math.
 */
function buildEarningsSnapshot(
  creator: Creator,
  channel: ChannelDetails,
  analysis: PerformanceAnalysis,
): CreatorEarningsSnapshot {
  const countryTier = getCreatorCountryTier(creator);
  const niche = getCreatorNiche(creator);
  const contentType = creator.contentType ?? "long";
  const currency = "USD";
  const { value: monthlyViews, isEstimate: monthlyViewsIsEstimate } =
    estimateMonthlyViews(channel, analysis);

  const rpmExpected = countryTier.baseRpm * niche.rpmMultiplier;
  const shortsRpmExpected = countryTier.shortsRpm * niche.shortsRpmMultiplier;
  // CPM ≈ RPM ÷ (creator revenue share after YouTube's ~45% cut).
  // We use the industry rule-of-thumb of ~55% to the creator, which
  // gives a CPM roughly 1.82× the RPM. Rounded to 1.8 for a stable,
  // documentable number.
  const cpmExpected = rpmExpected * 1.8;

  const commonInput = {
    country: resolveCountryCode(creator),
    niche: resolveNicheId(creator),
    currency,
    monetizedPercentage: REFERENCE_MONETIZATION_PCT,
    sponsorship: 0,
    affiliate: 0,
    membership: 0,
  } as const;

  const earnings = calculateEarnings({
    ...commonInput,
    monthlyViews,
    contentType,
  });

  // A shorts-only projection used purely for the "Estimated Shorts
  // revenue" tile. We reuse the same monthly view volume so the two
  // numbers stay comparable.
  const shortsEarnings = calculateEarnings({
    ...commonInput,
    monthlyViews,
    contentType: "shorts",
  });

  // Sponsorship for a single integration deal. Uses the median-ish
  // creator profile (5% engagement rate baseline in
  // `calculateSponsorship`). We pass the resolved country + niche
  // multipliers directly so the sponsorship rate reacts to the same
  // country/niche settings the earnings estimator uses.
  //
  // The country multiplier is derived from the long-form `baseRpm`
  // — a proxy for advertiser budget in that market — normalized so
  // the US-tier lands near 1.9× and Tier-3 markets floor at 0.5×.
  const rawCountryMultiplier = countryTier.baseRpm / 3.5;
  const clampedCountryMultiplier = Math.min(
    2.5,
    Math.max(0.5, rawCountryMultiplier),
  );

  const sponsorship = calculateSponsorship({
    subscribers: channel.subscriberCount ?? 0,
    averageViews: analysis.averageRecentViews,
    engagementRate: 5,
    nicheMultiplier: niche.rpmMultiplier,
    countryMultiplier: clampedCountryMultiplier,
    deliverable: "integration",
    usageRights: "standard",
    exclusivity: "none",
    videoCount: 1,
  });

  return {
    monthlyViews,
    currency,
    rpmExpected,
    cpmExpected,
    shortsRpmExpected,
    earnings,
    shortsEarnings,
    sponsorshipPerVideo: {
      low: sponsorship.perVideoLow,
      expected: sponsorship.perVideoExpected,
      high: sponsorship.perVideoHigh,
    },
    monthlyViewsIsEstimate,
  };
}

// ─────────────────────────────────────────────────────────────────
//   Public API
// ─────────────────────────────────────────────────────────────────

/**
 * Build the profile the `/creator/[slug]` page renders.
 *
 * Never throws. On any upstream failure we return a `CreatorProfile`
 * with `fallbackReason` set and every numeric field zeroed. That is
 * how the "Never crash" requirement is honoured.
 */
export async function getCreatorProfile(
  creator: Creator,
): Promise<CreatorProfile> {
  let channel: ChannelDetails | null = null;
  let videos: VideoItem[] = [];
  let fallbackReason: CreatorFallbackReason | null = null;

  try {
    channel = await resolveChannel(creator);
    if (!channel) {
      fallbackReason = creator.channelId ? "not-found" : "not-verified";
    }
  } catch (err) {
    fallbackReason = mapErrorToReason(err);
    // Log server-side with just the code — never the raw message
    // (mapUpstreamError already scrubs, but we're defense-in-depth).
    console.error("creator-profile:resolveChannel failed", {
      slug: creator.slug,
      code: err instanceof YouTubeApiError ? err.code : "UNEXPECTED",
    });
  }

  if (channel && channel.uploadsPlaylistId) {
    try {
      videos = await getRecentVideos(channel.uploadsPlaylistId);
    } catch (err) {
      // Video fetch failure is soft — we still show the channel
      // hero and earnings estimate.
      console.error("creator-profile:getRecentVideos failed", {
        slug: creator.slug,
        code: err instanceof YouTubeApiError ? err.code : "UNEXPECTED",
      });
      videos = [];
    }
  }

  const effectiveChannel = channel ?? buildPlaceholderChannel(creator);
  const analysis = analyzePerformance(videos);
  const earnings = buildEarningsSnapshot(creator, effectiveChannel, analysis);
  const topVideos = [...videos].sort((a, b) => b.viewCount - a.viewCount);

  return {
    creator,
    channel: effectiveChannel,
    videos,
    topVideos,
    analysis,
    earnings,
    fallbackReason,
  };
}
