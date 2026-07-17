/**
 * Small, pure formulas used by the standalone calculator pages.
 * Kept dependency-free so they're trivially unit-testable.
 */

export interface RpmInput {
  revenue: number;
  totalViews: number;
}

export interface RpmResult {
  rpm: number;
  valid: boolean;
  reason: string | null;
}

export function calculateRpm({ revenue, totalViews }: RpmInput): RpmResult {
  if (!Number.isFinite(revenue) || !Number.isFinite(totalViews)) {
    return { rpm: 0, valid: false, reason: "Please enter numeric values." };
  }
  if (revenue < 0 || totalViews < 0) {
    return { rpm: 0, valid: false, reason: "Values cannot be negative." };
  }
  if (totalViews === 0) {
    return {
      rpm: 0,
      valid: false,
      reason: "RPM is undefined when total views is zero.",
    };
  }
  return {
    rpm: (revenue / totalViews) * 1000,
    valid: true,
    reason: null,
  };
}

export interface CpmInput {
  grossAdRevenue: number;
  monetizedImpressions: number;
}

export interface CpmResult {
  cpm: number;
  valid: boolean;
  reason: string | null;
}

export function calculateCpm({
  grossAdRevenue,
  monetizedImpressions,
}: CpmInput): CpmResult {
  if (
    !Number.isFinite(grossAdRevenue) ||
    !Number.isFinite(monetizedImpressions)
  ) {
    return { cpm: 0, valid: false, reason: "Please enter numeric values." };
  }
  if (grossAdRevenue < 0 || monetizedImpressions < 0) {
    return { cpm: 0, valid: false, reason: "Values cannot be negative." };
  }
  if (monetizedImpressions === 0) {
    return {
      cpm: 0,
      valid: false,
      reason: "CPM is undefined when monetized impressions is zero.",
    };
  }
  return {
    cpm: (grossAdRevenue / monetizedImpressions) * 1000,
    valid: true,
    reason: null,
  };
}

/**
 * A simple sponsorship rate estimator. Based on commonly-cited creator
 * economy rules of thumb — NOT an official Google/YouTube number. We
 * intentionally return a wide low/high band because sponsorship rates
 * are highly negotiable in the real world.
 */
export interface SponsorshipInput {
  subscribers: number;
  averageViews: number;
  engagementRate: number; // 0..100
  nicheMultiplier: number; // from rpmData or a per-niche override
  countryMultiplier: number;
  deliverable: "dedicated" | "integration" | "shortsMention" | "productPlacement";
  usageRights: "standard" | "extended" | "perpetual";
  exclusivity: "none" | "partial" | "full";
  videoCount: number;
}

export interface SponsorshipResult {
  low: number;
  expected: number;
  high: number;
  perVideoLow: number;
  perVideoExpected: number;
  perVideoHigh: number;
}

const DELIVERABLE_BASE = {
  integration: 20,
  shortsMention: 8,
  dedicated: 45,
  productPlacement: 12,
};

const USAGE_MULT = {
  standard: 1,
  extended: 1.35,
  perpetual: 1.75,
};

const EXCLUSIVITY_MULT = {
  none: 1,
  partial: 1.2,
  full: 1.6,
};

/**
 * Baseline: $/1,000 views by deliverable type × usage × exclusivity ×
 * niche × country × engagement modifier. Then × video count.
 */
export function calculateSponsorship(input: SponsorshipInput): SponsorshipResult {
  const {
    subscribers,
    averageViews,
    engagementRate,
    nicheMultiplier,
    countryMultiplier,
    deliverable,
    usageRights,
    exclusivity,
    videoCount,
  } = input;

  const base = DELIVERABLE_BASE[deliverable] ?? DELIVERABLE_BASE.integration;
  const usage = USAGE_MULT[usageRights];
  const excl = EXCLUSIVITY_MULT[exclusivity];

  // Sanitize all numeric inputs against NaN/Infinity to avoid producing
  // NaN in the final result. Callers should never see NaN.
  const safeViews = Number.isFinite(averageViews) ? Math.max(averageViews, 0) : 0;
  const safeSubs = Number.isFinite(subscribers) ? Math.max(subscribers, 0) : 0;
  const safeEngagement = Number.isFinite(engagementRate) ? engagementRate : 0;
  const safeNiche = Number.isFinite(nicheMultiplier) ? nicheMultiplier : 1;
  const safeCountry = Number.isFinite(countryMultiplier) ? countryMultiplier : 1;

  // Engagement modifier — 5% is roughly average, we treat 1x at 5%.
  const engagementMod = clamp(safeEngagement / 5, 0.5, 2.5);

  // Views-based rate is the primary driver.
  const perThousand = base * usage * excl * safeNiche * safeCountry * engagementMod;
  const primary = (safeViews / 1000) * perThousand;

  // Subscriber floor — small channels still command a minimum rate.
  const floor = safeSubs * 0.005;

  const perVideoExpected = Math.max(primary, floor);
  const perVideoLow = perVideoExpected * 0.6;
  const perVideoHigh = perVideoExpected * 1.6;

  const count = Math.max(Math.floor(videoCount || 0), 1);
  return {
    perVideoLow,
    perVideoExpected,
    perVideoHigh,
    low: perVideoLow * count,
    expected: perVideoExpected * count,
    high: perVideoHigh * count,
  };
}

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.min(Math.max(v, min), max);
}
