import type { EarningsBreakdown, EarningsResult } from "@/types/youtube";
import {
  BAND_FACTORS,
  MIXED_LONG_SHARE,
  MIXED_SHORTS_SHARE,
  REFERENCE_MONETIZATION_PCT,
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
 * ──────────────────────────────────────────────────────────────────
 *   The RPM definition we follow
 * ──────────────────────────────────────────────────────────────────
 *
 * YouTube (per YouTube Help / YouTube Studio) defines RPM as:
 *
 *     RPM = total_revenue ÷ total_views × 1000
 *
 * which crucially divides by TOTAL views (including non-monetized
 * views) and includes revenue from ads, YouTube Premium, memberships,
 * Super Chat, and Super Stickers.
 *
 * The country × niche `baseRpm` tables in `rpmData.ts` are calibrated
 * to that definition — they represent the RPM of a channel that
 * monetizes at the industry-typical rate of ~90% of its views.
 *
 * The engine therefore uses the equivalent creator-side formula:
 *
 *     monthly_ad_revenue
 *       = (monthly_views ÷ 1000)
 *       × effective_RPM
 *       × (monetized_% ÷ REFERENCE_MONETIZATION_PCT)
 *
 * where `effective_RPM = country.baseRpm × niche.rpmMultiplier` (or a
 * user-supplied custom RPM). At the reference monetization value the
 * (monetized_% ÷ REFERENCE) factor is 1.0 and the formula collapses
 * to YouTube's canonical `views ÷ 1000 × RPM` — no double-discount.
 *
 * ──────────────────────────────────────────────────────────────────
 *   Design rules (do not silently break these):
 * ──────────────────────────────────────────────────────────────────
 *
 *   1. **Never multiply views by CPM.** Advertiser CPM (before Google's
 *      share) is not the same as creator RPM (after Google's share).
 *      Using CPM to estimate earnings is a common shortcut in other
 *      tools; it will over-estimate by ~2× on long-form and ~2–3× on
 *      Shorts. This engine always uses RPM.
 *
 *   2. **RPM is per-1,000-TOTAL-views, not per-1,000-monetized-views.**
 *      YouTube's RPM figure already includes the monetization gap in
 *      its denominator. `monetizedPercentage` in this engine is a
 *      *relative* adjustment against `REFERENCE_MONETIZATION_PCT`, not
 *      a raw discount factor on the view count. Applying it any other
 *      way would double-discount.
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

  // The monetization *adjustment factor* — see the module comment.
  // At the reference (90%) this is 1.0, so the formula reduces to
  // YouTube's canonical `views ÷ 1000 × RPM`. Above 90% the user is
  // modelling a better-than-typical channel; below 90%, a worse one.
  //
  // NOTE: this is NOT the same as multiplying views by `monetizedPct
  // ÷ 100`. That would double-discount because `baseRpm` is already
  // a per-total-views figure that bakes in the average monetization
  // gap.
  const monetizationFactor = monetizedPct / REFERENCE_MONETIZATION_PCT;

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
  // ── 2a. Pick the *expected* RPM for this content type. ────────
  //
  // Only the expected value is computed from the data tables; the
  // Conservative and Optimistic bands are then derived uniformly via
  // BAND_FACTORS. This keeps every content-type path (long / shorts /
  // mixed / custom) using the same 0.6× / 1.0× / 1.5× ratios, so
  // switching scenario tabs multiplies the expected result by an
  // exactly-known factor — no cross-country asymmetry, no compound
  // uncertainty.
  //
  let rpmExpected: number;

  if (input.rpm && input.rpm > 0) {
    // Custom RPM override — the user told us their exact RPM. Use it
    // as the expected value regardless of content type.
    rpmExpected = input.rpm;
  } else if (input.contentType === "shorts") {
    rpmExpected = country.shortsRpm * niche.shortsRpmMultiplier;
  } else if (input.contentType === "mixed") {
    // Blend long-form and Shorts. The blend is on the RPM itself —
    // we don't split the view count because we don't know the exact
    // view split; the caller can lean toward pure long-form or pure
    // Shorts via the content-type selector for a specific split.
    rpmExpected =
      country.baseRpm * niche.rpmMultiplier * MIXED_LONG_SHARE +
      country.shortsRpm * niche.shortsRpmMultiplier * MIXED_SHORTS_SHARE;
  } else {
    // Default: long-form.
    rpmExpected = country.baseRpm * niche.rpmMultiplier;
  }

  // ── 2b. Derive Conservative / Optimistic bands from BAND_FACTORS.
  //
  // A single source of truth. Every path funnels here.
  //
  const rpmLow = rpmExpected * BAND_FACTORS.conservative;
  const rpmHigh = rpmExpected * BAND_FACTORS.optimistic;

  // ── 3. Monthly ad revenue = views ÷ 1000 × RPM × monetization. ─
  //
  // Formula:
  //
  //   monthly_ad_revenue
  //     = (safeViews ÷ 1000) × RPM × monetizationFactor
  //
  // Because RPM is already a per-TOTAL-views quantity, dividing by
  // 1000 (not by monetized views) is what makes this creator-side
  // and consistent with YouTube's definition. `monetizationFactor`
  // is a relative adjustment: at the reference monetization it is
  // 1.0 and this collapses to YouTube's own `views ÷ 1000 × RPM`.
  //
  const monthlyAdLow = (safeViews / 1000) * rpmLow * monetizationFactor;
  const monthlyAdExpected =
    (safeViews / 1000) * rpmExpected * monetizationFactor;
  const monthlyAdHigh = (safeViews / 1000) * rpmHigh * monetizationFactor;

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
