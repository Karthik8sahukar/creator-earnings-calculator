import type { EarningsBreakdown, EarningsResult } from "@/types/youtube";
import {
  CONTENT_TYPE_MULTIPLIERS,
  findCountry,
  findCurrency,
  findNiche,
} from "./rpmData";
import type { EarningsInput } from "./schemas";

/**
 * Compute an estimated ad-revenue band from monthly views + RPM inputs,
 * apply optional overrides, and return a low / expected / high projection
 * with daily / weekly / monthly / annual breakdowns.
 *
 * All results are ESTIMATES. Real creator earnings depend on many factors
 * we cannot know from public data (fill rate, ad category mix, refunds,
 * seasonality, YouTube share, taxes, etc). See /methodology.
 */
export function calculateEarnings(input: EarningsInput): EarningsResult {
  const country = findCountry(input.country);
  const niche = findNiche(input.niche);
  const currency = findCurrency(input.currency);
  const contentMultiplier = CONTENT_TYPE_MULTIPLIERS[input.contentType];

  const monetizedViews =
    Math.max(input.monthlyViews, 0) * (input.monetizedPercentage / 100);

  // If the user provided an explicit RPM override we use it as the "expected"
  // value and keep +/- bands proportional. Otherwise we derive RPM from the
  // country/niche/content-type tables.
  let rpmLow: number;
  let rpmExpected: number;
  let rpmHigh: number;
  if (input.rpm && input.rpm > 0) {
    rpmExpected = input.rpm;
    rpmLow = input.rpm * 0.7;
    rpmHigh = input.rpm * 1.35;
  } else {
    rpmLow = country.baseRpm.low * niche.rpmMultiplier * contentMultiplier;
    rpmExpected =
      country.baseRpm.expected * niche.rpmMultiplier * contentMultiplier;
    rpmHigh = country.baseRpm.high * niche.rpmMultiplier * contentMultiplier;
  }

  const monthlyAdLow = (monetizedViews / 1000) * rpmLow;
  const monthlyAdExpected = (monetizedViews / 1000) * rpmExpected;
  const monthlyAdHigh = (monetizedViews / 1000) * rpmHigh;

  const extras =
    (input.sponsorship || 0) +
    (input.affiliate || 0) +
    (input.membership || 0);

  const toBreakdown = (monthly: number): EarningsBreakdown => {
    const monthlyTotal = (monthly + extras) * currency.usdRate;
    return {
      daily: monthlyTotal / 30,
      weekly: monthlyTotal / (30 / 7),
      monthly: monthlyTotal,
      annual: monthlyTotal * 12,
    };
  };

  const adBreakdown = (monthly: number): EarningsBreakdown => {
    const monthlyTotal = monthly * currency.usdRate;
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
