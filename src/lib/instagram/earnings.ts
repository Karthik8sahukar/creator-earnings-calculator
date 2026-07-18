/**
 * Instagram earnings estimation — pure, deterministic, unit-testable.
 *
 * ─────────────────────────────────────────────────────────────────────
 *   Model overview
 * ─────────────────────────────────────────────────────────────────────
 *
 * The estimator DOES NOT use follower count alone. Follower count is
 * an input to a small tier premium (nano/micro/mid/macro/mega) but the
 * dominant drivers are:
 *
 *   • Reach / views / story views  — how many humans actually see
 *     content the sponsor is paying for
 *   • Engagement rate              — how much those humans care
 *   • Niche multiplier             — how much brands pay for this
 *                                    audience
 *   • Country multiplier           — how much local brand budgets
 *                                    support
 *   • Posting cadence              — number of sponsored feed posts /
 *                                    reels / stories the creator ships
 *
 * The formula for each monetization channel is:
 *
 *   rateUSD = baseRateUSD
 *           × nicheMultiplier
 *           × countryMultiplier
 *           × followerTierMultiplier
 *           × engagementMultiplier
 *
 *   sponsoredPost   = feedPostsPerMonth × avgReach   × rateUSD / 1000
 *   sponsoredReel   = reelsPerMonth      × avgViews  × rateUSD / 1000
 *   sponsoredStory  = storiesPerMonth    × storyViews× rateUSD / 1000
 *
 * Affiliate revenue is modeled with an explicit funnel:
 *   engagedReach     = min(avgReach, followers) × engagementRate%
 *   affiliateClicks  = engagedReach × clickThroughPct%
 *   commissions      = affiliateClicks × conversionPct%
 *                                     × averageOrderValue
 *                                     × commissionPct%
 *
 * Subscriptions are simply `paidSubscribers × monthlyPriceUsd`.
 *
 * The low/expected/high bands are derived by multiplying by the
 * `ESTIMATE_BAND_FACTORS` constants. All sponsorship-derived streams
 * see the same multiplier so bands stay internally consistent.
 * Subscriptions do NOT scale by the band factors — subscription
 * revenue is contractual, not negotiated per campaign — so the same
 * amount is added to Low / Expected / High.
 *
 * Every input is coerced through a `safe()` helper that returns 0 for
 * NaN / Infinity / negative values, so the calculator NEVER emits
 * NaN. Callers can safely bind an early-partial state to the model.
 */

import { findCurrency } from "../rpmData";
import {
  AFFILIATE_DEFAULTS,
  CONTENT_MIX_CAPS,
  Confidence,
  ESTIMATE_BAND_FACTORS,
  INSTAGRAM_BASE_RATES_USD,
  SUBSCRIPTION_DEFAULTS,
  engagementMultiplier,
  findInstagramCountry,
  findInstagramNiche,
  followerTierMultiplier,
} from "./config";

// ─────────────────────────────────────────────────────────────────
//   Public input / output types
// ─────────────────────────────────────────────────────────────────

export interface InstagramCalculatorInput {
  /** Total followers. Used ONLY for the tier premium, not the driver. */
  followers: number;
  /** Average reach (unique accounts reached) on a feed post. */
  avgPostReach: number;
  /** Average views on a reel. */
  avgReelViews: number;
  /** Average views on a story (per story slide). */
  avgStoryViews: number;
  /** Engagement rate as a percentage (e.g. 3.5 → 3.5%). */
  engagementRate: number;
  /** Country id from `INSTAGRAM_COUNTRIES`. */
  country: string;
  /** Niche id from `INSTAGRAM_NICHES`. */
  niche: string;

  /** Content cadence — how many pieces per month. */
  feedPostsPerMonth: number;
  reelsPerMonth: number;
  storiesPerMonth: number;

  /** Which monetization channels are enabled. */
  enableSponsoredPosts: boolean;
  enableSponsoredReels: boolean;
  enableSponsoredStories: boolean;
  enableAffiliate: boolean;
  enableSubscriptions: boolean;

  /** Overrides — 0 or undefined means "use derived rate". */
  customPostRateUsd?: number;
  customReelRateUsd?: number;
  customStoryRateUsd?: number;

  /** Affiliate parameters (percentages 0–100). */
  affiliateConversionPct?: number;
  affiliateAverageOrderValueUsd?: number;
  affiliateCommissionPct?: number;

  /** Subscriptions. */
  paidSubscribers?: number;
  subscriptionPriceUsd?: number;

  /** Currency to display in. USD is the internal unit. */
  currency: string;
}

/**
 * A single line item in the monthly breakdown.
 *
 * `share` is the fraction of the expected monthly total this line
 * contributes (0..1). The UI uses it for the pie/bar chart.
 */
export interface EarningsLine {
  key: EarningsSource;
  labelKey: string;
  amount: number;
  share: number;
}

export type EarningsSource =
  | "sponsoredPosts"
  | "sponsoredReels"
  | "sponsoredStories"
  | "affiliate"
  | "subscriptions";

export interface EarningsBand {
  monthly: number;
  yearly: number;
}

export interface InstagramCalculatorResult {
  /** Currency code the numbers are expressed in. */
  currency: string;
  /** Currency-to-USD rate used to display the numbers. */
  usdRate: number;

  /** Low / Expected / High. Guaranteed low ≤ expected ≤ high. */
  low: EarningsBand;
  expected: EarningsBand;
  high: EarningsBand;

  /** Breakdown lines (expected band). */
  breakdown: readonly EarningsLine[];

  /** Derived headline metrics. */
  averageBrandDealValue: number;
  revenuePerThousandReach: number;
  engagementQuality: EngagementQuality;
  largestSource: EarningsSource | null;
  confidence: Confidence;
}

/**
 * A qualitative label for engagement rate. The number itself remains
 * the source of truth — this is just for the UI.
 */
export type EngagementQuality =
  | "belowAverage"
  | "average"
  | "good"
  | "excellent";

// ─────────────────────────────────────────────────────────────────
//   Core calculation
// ─────────────────────────────────────────────────────────────────

export function calculateInstagramEarnings(
  input: InstagramCalculatorInput,
): InstagramCalculatorResult {
  const niche = findInstagramNiche(input.niche);
  const country = findInstagramCountry(input.country);
  const currency = findCurrency(input.currency);

  const followers = safe(input.followers);
  const avgPostReach = safe(input.avgPostReach);
  const avgReelViews = safe(input.avgReelViews);
  const avgStoryViews = safe(input.avgStoryViews);
  const engagementRate = clamp(safe(input.engagementRate), 0, 100);

  // Content cadence — clamp to sensible caps so a typo (e.g. 1000
  // posts/month) can't blow the estimate to infinity.
  const feedPostsPerMonth = clamp(
    safe(input.feedPostsPerMonth),
    0,
    CONTENT_MIX_CAPS.maxSponsoredPostsPerMonth * 3,
  );
  const reelsPerMonth = clamp(
    safe(input.reelsPerMonth),
    0,
    CONTENT_MIX_CAPS.maxSponsoredReelsPerMonth * 3,
  );
  const storiesPerMonth = clamp(
    safe(input.storiesPerMonth),
    0,
    CONTENT_MIX_CAPS.maxSponsoredStoriesPerMonth * 3,
  );

  // Composite multiplier. Applied to every sponsored line.
  const composite =
    niche.multiplier *
    country.multiplier *
    followerTierMultiplier(followers) *
    engagementMultiplier(engagementRate);

  // ───────────────────────────────────────────────────────────────
  // Per-piece rates in USD (before applying the count and reach).
  // A custom rate short-circuits everything: the user has told us
  // what they charge per post, so trust them.
  // ───────────────────────────────────────────────────────────────

  const derivedPostRateUsd =
    INSTAGRAM_BASE_RATES_USD.feedPostPerThousandReach * composite;
  const derivedReelRateUsd =
    INSTAGRAM_BASE_RATES_USD.reelPerThousandViews * composite;
  const derivedStoryRateUsd =
    INSTAGRAM_BASE_RATES_USD.storyPerThousandViews * composite;

  const postRatePerThousandUsd =
    isPositive(input.customPostRateUsd)
      ? (input.customPostRateUsd as number)
      : derivedPostRateUsd;
  const reelRatePerThousandUsd =
    isPositive(input.customReelRateUsd)
      ? (input.customReelRateUsd as number)
      : derivedReelRateUsd;
  const storyRatePerThousandUsd =
    isPositive(input.customStoryRateUsd)
      ? (input.customStoryRateUsd as number)
      : derivedStoryRateUsd;

  // ───────────────────────────────────────────────────────────────
  // Sponsored streams — expected band in USD.
  // ───────────────────────────────────────────────────────────────

  const sponsoredPostsUsd = input.enableSponsoredPosts
    ? cap(feedPostsPerMonth, CONTENT_MIX_CAPS.maxSponsoredPostsPerMonth) *
      (avgPostReach / 1000) *
      postRatePerThousandUsd
    : 0;

  const sponsoredReelsUsd = input.enableSponsoredReels
    ? cap(reelsPerMonth, CONTENT_MIX_CAPS.maxSponsoredReelsPerMonth) *
      (avgReelViews / 1000) *
      reelRatePerThousandUsd
    : 0;

  const sponsoredStoriesUsd = input.enableSponsoredStories
    ? cap(storiesPerMonth, CONTENT_MIX_CAPS.maxSponsoredStoriesPerMonth) *
      (avgStoryViews / 1000) *
      storyRatePerThousandUsd
    : 0;

  // ───────────────────────────────────────────────────────────────
  // Affiliate — funnel model.
  // ───────────────────────────────────────────────────────────────

  const affiliateConversionPct = clamp(
    input.affiliateConversionPct ?? AFFILIATE_DEFAULTS.conversionRatePct,
    0,
    100,
  );
  const affiliateAov = Math.max(
    safe(input.affiliateAverageOrderValueUsd) ||
      AFFILIATE_DEFAULTS.averageOrderValueUsd,
    0,
  );
  const affiliateCommissionPct = clamp(
    input.affiliateCommissionPct ?? AFFILIATE_DEFAULTS.commissionPct,
    0,
    100,
  );

  // Monthly engaged reach — sum of reels + posts, gated by engagement.
  // Stories are excluded because their swipe-out affiliate CTR is
  // structurally different and already counted at the story rate.
  const monthlyReach =
    reelsPerMonth * avgReelViews + feedPostsPerMonth * avgPostReach;
  const monthlyEngagedReach = monthlyReach * (engagementRate / 100);
  const affiliateClicks =
    monthlyEngagedReach * (AFFILIATE_DEFAULTS.engagedReachClickThroughPct / 100);
  const affiliateOrders = affiliateClicks * (affiliateConversionPct / 100);
  const affiliateUsd = input.enableAffiliate
    ? affiliateOrders * affiliateAov * (affiliateCommissionPct / 100)
    : 0;

  // ───────────────────────────────────────────────────────────────
  // Subscriptions — flat.
  // ───────────────────────────────────────────────────────────────

  const paidSubscribers = Math.max(
    safe(input.paidSubscribers ?? SUBSCRIPTION_DEFAULTS.paidSubscribers),
    0,
  );
  const subscriptionPrice = Math.max(
    safe(input.subscriptionPriceUsd ?? SUBSCRIPTION_DEFAULTS.monthlyPriceUsd),
    0,
  );
  const subscriptionsUsd = input.enableSubscriptions
    ? paidSubscribers * subscriptionPrice
    : 0;

  // Sponsorship subtotal (drives band scaling).
  const sponsorshipExpectedUsd =
    sponsoredPostsUsd + sponsoredReelsUsd + sponsoredStoriesUsd + affiliateUsd;

  const monthlyLowUsd =
    sponsorshipExpectedUsd * ESTIMATE_BAND_FACTORS.low + subscriptionsUsd;
  const monthlyExpectedUsd = sponsorshipExpectedUsd + subscriptionsUsd;
  const monthlyHighUsd =
    sponsorshipExpectedUsd * ESTIMATE_BAND_FACTORS.high + subscriptionsUsd;

  // Ensure monotonic ordering even under adversarial inputs.
  const lowUsd = Math.min(monthlyLowUsd, monthlyExpectedUsd);
  const expectedUsd = monthlyExpectedUsd;
  const highUsd = Math.max(monthlyHighUsd, monthlyExpectedUsd);

  // Convert to the display currency. USD is the internal unit.
  const toDisplay = (v: number) => v * currency.usdRate;

  const low: EarningsBand = {
    monthly: toDisplay(lowUsd),
    yearly: toDisplay(lowUsd * 12),
  };
  const expected: EarningsBand = {
    monthly: toDisplay(expectedUsd),
    yearly: toDisplay(expectedUsd * 12),
  };
  const high: EarningsBand = {
    monthly: toDisplay(highUsd),
    yearly: toDisplay(highUsd * 12),
  };

  const breakdown = buildBreakdown({
    sponsoredPosts: toDisplay(sponsoredPostsUsd),
    sponsoredReels: toDisplay(sponsoredReelsUsd),
    sponsoredStories: toDisplay(sponsoredStoriesUsd),
    affiliate: toDisplay(affiliateUsd),
    subscriptions: toDisplay(subscriptionsUsd),
  });

  const largestSource = pickLargestSource(breakdown);

  // Average brand deal value = weighted average of the per-piece
  // rates across the enabled sponsored channels (expected band).
  const activeUnits =
    (input.enableSponsoredPosts ? feedPostsPerMonth : 0) +
    (input.enableSponsoredReels ? reelsPerMonth : 0) +
    (input.enableSponsoredStories ? storiesPerMonth : 0);
  const sponsoredTotal =
    sponsoredPostsUsd + sponsoredReelsUsd + sponsoredStoriesUsd;
  const averageBrandDealValue =
    activeUnits > 0 ? toDisplay(sponsoredTotal / activeUnits) : 0;

  const revenuePerThousandReach =
    monthlyReach > 0
      ? toDisplay((sponsoredTotal + affiliateUsd) / (monthlyReach / 1000))
      : 0;

  return {
    currency: currency.code,
    usdRate: currency.usdRate,
    low,
    expected,
    high,
    breakdown,
    averageBrandDealValue,
    revenuePerThousandReach,
    engagementQuality: qualifyEngagement(engagementRate),
    largestSource,
    confidence: computeConfidence({
      followers,
      avgPostReach,
      avgReelViews,
      avgStoryViews,
      engagementRate,
    }),
  };
}

// ─────────────────────────────────────────────────────────────────
//   Helpers
// ─────────────────────────────────────────────────────────────────

function buildBreakdown(sources: {
  sponsoredPosts: number;
  sponsoredReels: number;
  sponsoredStories: number;
  affiliate: number;
  subscriptions: number;
}): readonly EarningsLine[] {
  const raw: Array<Omit<EarningsLine, "share">> = [
    {
      key: "sponsoredPosts",
      labelKey: "breakdown.sponsoredPosts",
      amount: sources.sponsoredPosts,
    },
    {
      key: "sponsoredReels",
      labelKey: "breakdown.sponsoredReels",
      amount: sources.sponsoredReels,
    },
    {
      key: "sponsoredStories",
      labelKey: "breakdown.sponsoredStories",
      amount: sources.sponsoredStories,
    },
    {
      key: "affiliate",
      labelKey: "breakdown.affiliate",
      amount: sources.affiliate,
    },
    {
      key: "subscriptions",
      labelKey: "breakdown.subscriptions",
      amount: sources.subscriptions,
    },
  ];

  const total = raw.reduce((sum, line) => sum + Math.max(line.amount, 0), 0);
  return raw.map((line) => ({
    ...line,
    share: total > 0 ? Math.max(line.amount, 0) / total : 0,
  }));
}

function pickLargestSource(
  breakdown: readonly EarningsLine[],
): EarningsSource | null {
  const best = breakdown.reduce<EarningsLine | null>((acc, line) => {
    if (line.amount <= 0) return acc;
    if (!acc || line.amount > acc.amount) return line;
    return acc;
  }, null);
  return best ? best.key : null;
}

function qualifyEngagement(pct: number): EngagementQuality {
  if (pct <= 0) return "belowAverage";
  if (pct < 1.5) return "belowAverage";
  if (pct < 3.5) return "average";
  if (pct < 6) return "good";
  return "excellent";
}

function computeConfidence(args: {
  followers: number;
  avgPostReach: number;
  avgReelViews: number;
  avgStoryViews: number;
  engagementRate: number;
}): Confidence {
  const hasFollowers = args.followers > 0;
  const hasReach =
    args.avgPostReach > 0 ||
    args.avgReelViews > 0 ||
    args.avgStoryViews > 0;
  const hasEngagement = args.engagementRate > 0;

  if (!hasFollowers || !hasReach || !hasEngagement) return "low";

  // Suspicious values → moderate confidence.
  //   - >25% engagement is very rare above ~10k followers
  //   - reach > followers is possible via reels but shouldn't be
  //     enormous
  const reelViewsExceedFollowers =
    args.avgReelViews > 0 &&
    args.followers > 0 &&
    args.avgReelViews > args.followers * 30;
  const impossibleEngagement =
    args.engagementRate > 25 && args.followers > 5_000;

  if (reelViewsExceedFollowers || impossibleEngagement) return "moderate";
  return "high";
}

function safe(value: number | null | undefined): number {
  if (value == null) return 0;
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  return value;
}

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function cap(v: number, max: number): number {
  return v > max ? max : v;
}

function isPositive(v: number | null | undefined): boolean {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}
