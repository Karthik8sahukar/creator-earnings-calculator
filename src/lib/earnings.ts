import type { EarningsBreakdown, EarningsResult } from "@/types/youtube";
import {
  BAND_FACTORS,
  MIXED_LONG_SHARE,
  MIXED_SHORTS_SHARE,
  findCountry,
  findCurrency,
  findNiche,
} from "./rpmData";
import type { EarningsInput } from "./schemas";

/**
 * ──────────────────────────────────────────────────────────────────
 *   YouTube ad-revenue estimator (creator-side, RPM-based)
 * ──────────────────────────────────────────────────────────────────
 *
 * Given a monthly view count and some contextual assumptions
 * (country / niche / content type / monetized %, plus optional
 * sponsorship / affiliate / membership add-ons), we return a
 * conservative / expected / optimistic band of estimated creator
 * earnings, broken down by daily / weekly / monthly / annual.
 *
 * Design rules (do not silently break these):
 *
 *   1. **Never multiply views by CPM.** Advertiser CPM (before Google's
 *      share) is not the same as creator RPM (after Google's share).
 *      Using CPM to estimate earnings is a common shortcut in other
 *      tools; it will over-estimate by ~2× on long-form and ~2–3× on
 *      Shorts. This engine always uses RPM.
 *
 *   2. **RPM is per-1,000-TOTAL-views, not per-1,000-monetized-views.**
 *      Applying `monetizedPercentage` in the formula is what bridges
 *      that gap. We apply it exactly once, before the RPM step, so
 *      passing 100% monetized + custom RPM lets the user model any
 *      hypothetical.
 *
 *   3. **Shorts have their own RPM path.** They use a shared revenue
 *      pool with fundamentally different economics from long-form's
 *      per-video ad auction. Falling back to "long-form RPM × small
 *      multiplier" (as this engine used to do) both over-estimates the
 *      typical Shorts creator and mis-shapes the niche premium.
 *
 *   4. **All results are estimates.**  See /methodology for what we
 *      cannot observe: ad fill rate, category mix, refunds, YouTube's
 *      exact revenue share, seasonality, taxes, and so on.
 *
 * ──────────────────────────────────────────────────────────────────
 */

export function calculateEarnings(input: EarningsInput): EarningsResult {
  const country = findCountry(input.country);
  const niche = findNiche(input.niche);
  const currency = findCurrency(input.currency);

  // ── 1. Sanitize numeric inputs. ────────────────────────────────
  //
  // NaN → 0. Negative views → 0. Infinity is allowed to propagate so
  // callers can probe upper bounds (the test suite exercises this), but
  // we never let it turn into NaN in the final output.
  //
  const rawViews = Number.isFinite(input.monthlyViews)
    ? input.monthlyViews
    : input.monthlyViews === Number.POSITIVE_INFINITY
      ? Number.POSITIVE_INFINITY
      : 0;
  const safeViews = rawViews > 0 ? rawViews : 0;
  const monetizedPct = Number.isFinite(input.monetizedPercentage)
    ? Math.min(Math.max(input.monetizedPercentage, 0), 100)
    : 0;
  const monetizedViews = safeViews * (monetizedPct / 100);

  // ── 2. Pick the RPM path for this content type. ────────────────
  //
  //   • long   → country.baseRpm × niche.rpmMultiplier
  //   • shorts → country.shortsRpm × niche.shortsRpmMultiplier
  //   • mixed  → weighted blend of the two, using MIXED_*_SHARE
  //     constants from rpmData.ts (60% long / 40% shorts by default —
  //     see the comment on MIXED_LONG_SHARE for the rationale).
  //
  // If the user provided an explicit `rpm` override we use it as the
  // "expected" value and scale the low/high bands proportionally.
  // Custom RPM applies regardless of content type — the user is
  // telling us "I know my RPM, just use this number".
  //
  let rpmLow: number;
  let rpmExpected: number;
  let rpmHigh: number;

  if (input.rpm && input.rpm > 0) {
    rpmExpected = input.rpm;
    rpmLow = input.rpm * BAND_FACTORS.conservative;
    rpmHigh = input.rpm * BAND_FACTORS.optimistic;
  } else if (input.contentType === "shorts") {
    rpmLow = country.shortsRpm.low * niche.shortsRpmMultiplier;
    rpmExpected = country.shortsRpm.expected * niche.shortsRpmMultiplier;
    rpmHigh = country.shortsRpm.high * niche.shortsRpmMultiplier;
  } else if (input.contentType === "mixed") {
    // Blend long-form and Shorts on the same low/expected/high band.
    // The blend is on the RPM itself — we don't split the view count
    // because we don't know the exact view split; the caller can lean
    // toward pure long-form or pure Shorts via the content-type
    // selector if they want a specific split.
    rpmLow =
      country.baseRpm.low * niche.rpmMultiplier * MIXED_LONG_SHARE +
      country.shortsRpm.low * niche.shortsRpmMultiplier * MIXED_SHORTS_SHARE;
    rpmExpected =
      country.baseRpm.expected * niche.rpmMultiplier * MIXED_LONG_SHARE +
      country.shortsRpm.expected * niche.shortsRpmMultiplier * MIXED_SHORTS_SHARE;
    rpmHigh =
      country.baseRpm.high * niche.rpmMultiplier * MIXED_LONG_SHARE +
      country.shortsRpm.high * niche.shortsRpmMultiplier * MIXED_SHORTS_SHARE;
  } else {
    // Default: long-form.
    rpmLow = country.baseRpm.low * niche.rpmMultiplier;
    rpmExpected = country.baseRpm.expected * niche.rpmMultiplier;
    rpmHigh = country.baseRpm.high * niche.rpmMultiplier;
  }

  // ── 3. Monthly ad revenue = monetized views × RPM ÷ 1000. ─────
  //
  // This is the canonical creator-side formula. Multiplying by RPM/1000
  // (not by CPM) is what makes this a creator-earnings estimate rather
  // than an advertiser-spend estimate.
  //
  const monthlyAdLow = (monetizedViews / 1000) * rpmLow;
  const monthlyAdExpected = (monetizedViews / 1000) * rpmExpected;
  const monthlyAdHigh = (monetizedViews / 1000) * rpmHigh;

  // ── 4. Non-ad income adds on top. ──────────────────────────────
  //
  // Sponsorship, affiliate, membership income are user-provided in the
  // display currency's units-per-month. They are NOT scaled by the
  // low/expected/high band because the user is stating them as
  // measured monthly income, not as a projection to derive.
  //
  const extras =
    (input.sponsorship || 0) +
    (input.affiliate || 0) +
    (input.membership || 0);

  // ── 5. Convert to the display currency. ────────────────────────
  //
  // Every internal number so far is in USD. We convert at the very end
  // using a static FX rate from `rpmData.CURRENCIES`. The methodology
  // page warns the user this is approximate.
  //
  const toBreakdown = (monthlyUsd: number): EarningsBreakdown => {
    const monthlyTotal = (monthlyUsd + extras) * currency.usdRate;
    return {
      // The formula treats a month as exactly 30 days for daily/weekly
      // splits. This intentionally trades a tiny amount of accuracy
      // for a stable, predictable relationship
      // `daily × 30 == monthly` that our tests verify.
      daily: monthlyTotal / 30,
      weekly: monthlyTotal / (30 / 7),
      monthly: monthlyTotal,
      annual: monthlyTotal * 12,
    };
  };

  const adBreakdown = (monthlyUsd: number): EarningsBreakdown => {
    const monthlyTotal = monthlyUsd * currency.usdRate;
    return {
      daily: monthlyTotal / 30,
      weekly: monthlyTotal / (30 / 7),
      monthly: monthlyTotal,
      annual: monthlyTotal * 12,
    };
  };

  return {
    currency: currency.code,
    low: toBreakdown(monthlyAdLow),
    expected: toBreakdown(monthlyAdExpected),
    high: toBreakdown(monthlyAdHigh),
    // `monthlyAdRevenue` is the ad-only slice at the "expected" band,
    // used by the UI breakdown card. Extras are surfaced separately.
    monthlyAdRevenue: {
      daily: adBreakdown(monthlyAdExpected).daily,
      weekly: adBreakdown(monthlyAdExpected).weekly,
      monthly: adBreakdown(monthlyAdExpected).monthly,
      annual: adBreakdown(monthlyAdExpected).annual,
    },
    extras: {
      sponsorship: (input.sponsorship || 0) * currency.usdRate,
      affiliate: (input.affiliate || 0) * currency.usdRate,
      membership: (input.membership || 0) * currency.usdRate,
    },
  };
}
