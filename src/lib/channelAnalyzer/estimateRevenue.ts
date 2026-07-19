/**
 * Channel Analyzer — revenue estimation.
 *
 * A thin, dependency-free wrapper on top of the existing
 * `calculateEarnings` engine (`src/lib/earnings.ts`) plus the country
 * / niche tables in `src/lib/rpmData.ts`. This file adds NO new RPM
 * math — every earnings number ultimately comes from `calculateEarnings`
 * so the Channel Analyzer's revenue figures are guaranteed to match
 * the site-wide YouTube Money / RPM / CPM calculators.
 *
 * The Channel Analyzer displays four revenue-adjacent numbers:
 *
 *   • Estimated Monthly Earnings   (low / expected / high)
 *   • Estimated Yearly Earnings    (= 12 × monthly)
 *   • Estimated RPM                (USD per 1,000 total views)
 *   • Estimated CPM                (USD per 1,000 monetized impressions)
 *
 * See the module comment on `src/lib/earnings.ts` for the
 * relationship between RPM and CPM — briefly, CPM is the advertiser-
 * side number BEFORE Google's ~45% revenue share, so we derive it as
 * `RPM × 1.8` (the same ratio the creator-profile page uses).
 */

import { calculateEarnings } from "../earnings";
import {
  COUNTRIES,
  REFERENCE_MONETIZATION_PCT,
  findCountry,
  findNiche,
  type CountryTier,
  type Niche,
} from "../rpmData";
import type { EarningsBreakdown } from "@/types/youtube";

/**
 * Advertiser-CPM to creator-RPM ratio.
 *
 * YouTube pays creators ~55% of gross ad revenue on long-form (~45%
 * on Shorts before the Creator Pool split). Averaging the two paths
 * and rounding gives a stable, documentable multiplier of 1.8×. This
 * matches the number used by `src/lib/creatorProfile.ts` so channel
 * pages and the analyzer stay consistent.
 */
export const CPM_TO_RPM_RATIO = 1.8;

export interface RevenueEstimateInput {
  /** Monthly views projection. Zero-safe. */
  monthlyViews: number;
  /** ISO 3166-1 alpha-2 country code (e.g. "US"). Optional — resolved to "OTHER" when unknown. */
  countryCode: string | null | undefined;
  /**
   * Niche id used to modulate the RPM. Optional — we default to
   * `"other"` (general audience) since the Channel Analyzer can't
   * reliably infer a channel's category from public data.
   */
  nicheId?: string;
  /**
   * Content type mix — long-form / shorts / mixed. Optional; a
   * caller with real Shorts vs long-form telemetry can pass "mixed"
   * or "shorts" to get a more accurate blend. Default: "mixed" so
   * the analyzer's default estimate isn't over-inflated for
   * Shorts-heavy channels.
   */
  contentType?: "long" | "shorts" | "mixed";
  /**
   * Optional override: fraction (0–100) of views that monetize.
   * Defaults to the reference monetization percentage so the formula
   * collapses to YouTube's canonical `views ÷ 1000 × RPM`. See the
   * comment on REFERENCE_MONETIZATION_PCT in `rpmData.ts` for why.
   */
  monetizedPercentage?: number;
}

export interface RevenueEstimate {
  /** ISO currency code — always "USD" for the analyzer's phase-1 output. */
  currency: string;
  /** Effective country tier used for the estimate (label + code + baseRpm). */
  country: CountryTier;
  /** Effective niche used for the estimate. */
  niche: Niche;
  /** Monthly views figure the estimate was calculated from. */
  monthlyViews: number;
  /** Expected creator-side RPM in USD (per 1,000 total views). */
  rpmExpected: number;
  /** Advertiser-side CPM in USD (per 1,000 monetized impressions). */
  cpmExpected: number;
  /** Monthly ad revenue at the conservative / expected / optimistic bands. */
  monthly: EarningsBreakdown & {
    low: number;
    expected: number;
    high: number;
  };
  /** Yearly ad revenue at the conservative / expected / optimistic bands. */
  yearly: {
    low: number;
    expected: number;
    high: number;
  };
}

/**
 * Resolve a raw ISO country code to a `CountryTier` from the RPM
 * tables. Returns the "Other / Global mix" tier when the code is
 * unknown or missing — the same fallback the earnings engine uses.
 */
export function resolveCountryTier(
  code: string | null | undefined,
): CountryTier {
  if (!code) return findCountry("OTHER");
  const upper = code.toUpperCase();
  // Fast path: exact match against COUNTRIES ids.
  const hit = COUNTRIES.find((c) => c.id === upper);
  return hit ?? findCountry("OTHER");
}

/**
 * Compute the four revenue-adjacent figures the Channel Analyzer
 * renders. This is a thin, non-branching wrapper on top of
 * `calculateEarnings` — the low/expected/high band ratios come from
 * `BAND_FACTORS` inside the earnings engine and are NOT reapplied
 * here.
 */
export function estimateRevenue(input: RevenueEstimateInput): RevenueEstimate {
  const country = resolveCountryTier(input.countryCode);
  const niche = findNiche(input.nicheId ?? "other");
  const contentType = input.contentType ?? "mixed";
  const monetizedPercentage =
    input.monetizedPercentage ?? REFERENCE_MONETIZATION_PCT;
  const monthlyViews = Number.isFinite(input.monthlyViews)
    ? Math.max(0, input.monthlyViews)
    : 0;

  const earnings = calculateEarnings({
    monthlyViews,
    country: country.id,
    niche: niche.id,
    contentType,
    currency: "USD",
    monetizedPercentage,
    sponsorship: 0,
    affiliate: 0,
    membership: 0,
  });

  // The earnings engine already exposes low / expected / high monthly
  // and annual figures; we simply flatten the fields the UI needs
  // into a compact envelope.
  const monthly = {
    ...earnings.expected,
    low: earnings.low.monthly,
    expected: earnings.expected.monthly,
    high: earnings.high.monthly,
  };

  const yearly = {
    low: earnings.low.annual,
    expected: earnings.expected.annual,
    high: earnings.high.annual,
  };

  // Effective RPM is inferred from the expected monthly number. We
  // deliberately compute it from the engine's output (rather than
  // multiplying baseRpm × niche.rpmMultiplier again) so it reflects
  // the same content-type blending the engine used.
  const rpmExpected =
    monthlyViews > 0
      ? (earnings.expected.monthly / monthlyViews) * 1000
      : country.baseRpm * niche.rpmMultiplier;

  const cpmExpected = rpmExpected * CPM_TO_RPM_RATIO;

  return {
    currency: earnings.currency,
    country,
    niche,
    monthlyViews,
    rpmExpected,
    cpmExpected,
    monthly,
    yearly,
  };
}
