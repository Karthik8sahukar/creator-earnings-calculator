/**
 * Extended calculator formulas.
 *
 * Builds on `simpleCalculators.ts` (RPM, CPM, Sponsorship) with
 * additional standalone calculators requested for the platform:
 *   - Engagement Rate Calculator
 *   - Affiliate Revenue Calculator
 *   - Membership Revenue Calculator
 *   - Merch Revenue Calculator
 *   - Channel Valuation Calculator
 *   - AdSense Revenue Calculator
 *
 * Design rules (same as simpleCalculators.ts):
 *   - Pure functions, no side effects
 *   - Never return NaN
 *   - Input validation returns a `reason` string for the UI
 *   - All monetary values in USD unless otherwise noted
 */

// ─── Engagement Rate Calculator ─────────────────────────────────────

export interface EngagementInput {
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

export interface EngagementResult {
  engagementRate: number;
  valid: boolean;
  reason: string | null;
  quality: "low" | "average" | "good" | "excellent";
}

/**
 * Engagement Rate = (likes + comments + shares) ÷ views × 100
 *
 * Quality buckets:
 *   - < 2%: low
 *   - 2-5%: average
 *   - 5-10%: good
 *   - > 10%: excellent
 */
export function calculateEngagementRate(input: EngagementInput): EngagementResult {
  const { likes, comments, shares, views } = input;

  if (
    !Number.isFinite(likes) || !Number.isFinite(comments) ||
    !Number.isFinite(shares) || !Number.isFinite(views)
  ) {
    return { engagementRate: 0, valid: false, reason: "Please enter numeric values.", quality: "low" };
  }

  if (likes < 0 || comments < 0 || shares < 0 || views < 0) {
    return { engagementRate: 0, valid: false, reason: "Values cannot be negative.", quality: "low" };
  }

  if (views === 0) {
    return { engagementRate: 0, valid: false, reason: "Engagement rate is undefined when views is zero.", quality: "low" };
  }

  const totalEngagement = likes + comments + shares;
  const rate = (totalEngagement / views) * 100;

  let quality: EngagementResult["quality"] = "low";
  if (rate >= 10) quality = "excellent";
  else if (rate >= 5) quality = "good";
  else if (rate >= 2) quality = "average";

  return { engagementRate: rate, valid: true, reason: null, quality };
}

// ─── Affiliate Revenue Calculator ───────────────────────────────────

export interface AffiliateInput {
  monthlyViews: number;
  clickThroughRate: number; // percentage 0-100
  conversionRate: number; // percentage 0-100
  averageOrderValue: number; // USD
  commissionRate: number; // percentage 0-100
}

export interface AffiliateResult {
  monthlyRevenue: number;
  yearlyRevenue: number;
  estimatedClicks: number;
  estimatedConversions: number;
  valid: boolean;
  reason: string | null;
}

/**
 * Affiliate Revenue = views × CTR × conversion × AOV × commission
 */
export function calculateAffiliateRevenue(input: AffiliateInput): AffiliateResult {
  const { monthlyViews, clickThroughRate, conversionRate, averageOrderValue, commissionRate } = input;

  if (
    !Number.isFinite(monthlyViews) || !Number.isFinite(clickThroughRate) ||
    !Number.isFinite(conversionRate) || !Number.isFinite(averageOrderValue) ||
    !Number.isFinite(commissionRate)
  ) {
    return { monthlyRevenue: 0, yearlyRevenue: 0, estimatedClicks: 0, estimatedConversions: 0, valid: false, reason: "Please enter numeric values." };
  }

  if (monthlyViews < 0 || clickThroughRate < 0 || conversionRate < 0 || averageOrderValue < 0 || commissionRate < 0) {
    return { monthlyRevenue: 0, yearlyRevenue: 0, estimatedClicks: 0, estimatedConversions: 0, valid: false, reason: "Values cannot be negative." };
  }

  const clicks = monthlyViews * (clickThroughRate / 100);
  const conversions = clicks * (conversionRate / 100);
  const revenue = conversions * averageOrderValue * (commissionRate / 100);

  return {
    monthlyRevenue: revenue,
    yearlyRevenue: revenue * 12,
    estimatedClicks: Math.round(clicks),
    estimatedConversions: Math.round(conversions),
    valid: true,
    reason: null,
  };
}

// ─── Membership Revenue Calculator ──────────────────────────────────

export interface MembershipInput {
  subscribers: number;
  membershipRate: number; // % of subscribers that become members
  averagePrice: number; // USD per month
  tiers: Array<{ name: string; price: number; percentage: number }>;
}

export interface MembershipResult {
  monthlyRevenue: number;
  yearlyRevenue: number;
  estimatedMembers: number;
  revenueAfterYouTubeCut: number;
  valid: boolean;
  reason: string | null;
}

/**
 * Membership Revenue = subscribers × memberRate × avgPrice × 0.7
 * (YouTube takes ~30% of channel memberships)
 */
export function calculateMembershipRevenue(input: MembershipInput): MembershipResult {
  const { subscribers, membershipRate, averagePrice } = input;

  if (!Number.isFinite(subscribers) || !Number.isFinite(membershipRate) || !Number.isFinite(averagePrice)) {
    return { monthlyRevenue: 0, yearlyRevenue: 0, estimatedMembers: 0, revenueAfterYouTubeCut: 0, valid: false, reason: "Please enter numeric values." };
  }

  if (subscribers < 0 || membershipRate < 0 || averagePrice < 0) {
    return { monthlyRevenue: 0, yearlyRevenue: 0, estimatedMembers: 0, revenueAfterYouTubeCut: 0, valid: false, reason: "Values cannot be negative." };
  }

  const members = subscribers * (membershipRate / 100);
  const grossRevenue = members * averagePrice;
  const netRevenue = grossRevenue * 0.7; // YouTube takes ~30%

  return {
    monthlyRevenue: grossRevenue,
    yearlyRevenue: grossRevenue * 12,
    estimatedMembers: Math.round(members),
    revenueAfterYouTubeCut: netRevenue,
    valid: true,
    reason: null,
  };
}

// ─── Merch Revenue Calculator ───────────────────────────────────────

export interface MerchInput {
  monthlyViews: number;
  conversionRate: number; // percentage 0-100
  averageOrderValue: number; // USD
  profitMargin: number; // percentage 0-100
}

export interface MerchResult {
  monthlyRevenue: number;
  yearlyRevenue: number;
  monthlyProfit: number;
  yearlyProfit: number;
  estimatedOrders: number;
  valid: boolean;
  reason: string | null;
}

/**
 * Merch Revenue = views × conversion × AOV
 * Merch Profit = revenue × margin
 *
 * Typical conversion for merch is 0.5-2% of viewers.
 */
export function calculateMerchRevenue(input: MerchInput): MerchResult {
  const { monthlyViews, conversionRate, averageOrderValue, profitMargin } = input;

  if (
    !Number.isFinite(monthlyViews) || !Number.isFinite(conversionRate) ||
    !Number.isFinite(averageOrderValue) || !Number.isFinite(profitMargin)
  ) {
    return { monthlyRevenue: 0, yearlyRevenue: 0, monthlyProfit: 0, yearlyProfit: 0, estimatedOrders: 0, valid: false, reason: "Please enter numeric values." };
  }

  if (monthlyViews < 0 || conversionRate < 0 || averageOrderValue < 0 || profitMargin < 0) {
    return { monthlyRevenue: 0, yearlyRevenue: 0, monthlyProfit: 0, yearlyProfit: 0, estimatedOrders: 0, valid: false, reason: "Values cannot be negative." };
  }

  const orders = monthlyViews * (conversionRate / 100);
  const revenue = orders * averageOrderValue;
  const profit = revenue * (profitMargin / 100);

  return {
    monthlyRevenue: revenue,
    yearlyRevenue: revenue * 12,
    monthlyProfit: profit,
    yearlyProfit: profit * 12,
    estimatedOrders: Math.round(orders),
    valid: true,
    reason: null,
  };
}

// ─── Channel Valuation Calculator ───────────────────────────────────

export interface ChannelValuationInput {
  monthlyRevenue: number; // USD from all sources
  subscribers: number;
  monthlyViews: number;
  growthRate: number; // monthly % growth
  niche: string;
}

export interface ChannelValuationResult {
  lowValuation: number;
  expectedValuation: number;
  highValuation: number;
  revenueMultiple: number;
  valid: boolean;
  reason: string | null;
}

/**
 * Channel Valuation uses a revenue-multiple approach:
 *
 *   Valuation = monthly_revenue × 12 × multiple
 *
 * The multiple ranges from 2× to 5× annual revenue depending on:
 *   - Growth rate (higher growth = higher multiple)
 *   - Niche (evergreen niches command higher multiples)
 *   - Subscriber count (larger channels = more stable)
 *
 * This is a simplified model of how YouTube channels are actually
 * bought and sold on platforms like Flippa, Empire Flippers, etc.
 */
export function calculateChannelValuation(input: ChannelValuationInput): ChannelValuationResult {
  const { monthlyRevenue, subscribers, monthlyViews, growthRate } = input;

  if (
    !Number.isFinite(monthlyRevenue) || !Number.isFinite(subscribers) ||
    !Number.isFinite(monthlyViews) || !Number.isFinite(growthRate)
  ) {
    return { lowValuation: 0, expectedValuation: 0, highValuation: 0, revenueMultiple: 0, valid: false, reason: "Please enter numeric values." };
  }

  if (monthlyRevenue < 0 || subscribers < 0 || monthlyViews < 0) {
    return { lowValuation: 0, expectedValuation: 0, highValuation: 0, revenueMultiple: 0, valid: false, reason: "Values cannot be negative." };
  }

  if (monthlyRevenue === 0) {
    return { lowValuation: 0, expectedValuation: 0, highValuation: 0, revenueMultiple: 0, valid: false, reason: "Monthly revenue must be greater than zero." };
  }

  // Base multiple: 2.5×
  let multiple = 2.5;

  // Growth premium: +0.5 per 5% monthly growth, capped at +2.0
  const growthPremium = Math.min(2.0, Math.max(0, growthRate / 5) * 0.5);
  multiple += growthPremium;

  // Size premium: larger channels are more stable
  if (subscribers > 1_000_000) multiple += 0.5;
  else if (subscribers > 100_000) multiple += 0.25;

  const annualRevenue = monthlyRevenue * 12;
  const expected = annualRevenue * multiple;
  const low = expected * 0.6;
  const high = expected * 1.5;

  return {
    lowValuation: low,
    expectedValuation: expected,
    highValuation: high,
    revenueMultiple: multiple,
    valid: true,
    reason: null,
  };
}

// ─── AdSense Revenue Calculator ─────────────────────────────────────

export interface AdSenseInput {
  monthlyViews: number;
  rpm: number; // USD per 1,000 views
  monetizedPercentage: number; // 0-100
}

export interface AdSenseResult {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  valid: boolean;
  reason: string | null;
}

/**
 * AdSense Revenue = (views ÷ 1000) × RPM × (monetized% ÷ 90)
 *
 * Same formula as the main earnings engine but simplified for a
 * standalone calculator page where users input their own RPM.
 */
export function calculateAdSenseRevenue(input: AdSenseInput): AdSenseResult {
  const { monthlyViews, rpm, monetizedPercentage } = input;

  if (!Number.isFinite(monthlyViews) || !Number.isFinite(rpm) || !Number.isFinite(monetizedPercentage)) {
    return { dailyRevenue: 0, weeklyRevenue: 0, monthlyRevenue: 0, yearlyRevenue: 0, valid: false, reason: "Please enter numeric values." };
  }

  if (monthlyViews < 0 || rpm < 0 || monetizedPercentage < 0) {
    return { dailyRevenue: 0, weeklyRevenue: 0, monthlyRevenue: 0, yearlyRevenue: 0, valid: false, reason: "Values cannot be negative." };
  }

  if (monthlyViews === 0) {
    return { dailyRevenue: 0, weeklyRevenue: 0, monthlyRevenue: 0, yearlyRevenue: 0, valid: false, reason: "Monthly views must be greater than zero." };
  }

  const monetizationFactor = Math.min(monetizedPercentage, 100) / 90;
  const monthly = (monthlyViews / 1000) * rpm * monetizationFactor;

  return {
    dailyRevenue: monthly / 30,
    weeklyRevenue: monthly / (30 / 7),
    monthlyRevenue: monthly,
    yearlyRevenue: monthly * 12,
    valid: true,
    reason: null,
  };
}
