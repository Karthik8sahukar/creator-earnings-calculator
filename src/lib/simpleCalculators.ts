/**
 * Small, pure formulas used by the standalone calculator pages.
 * Kept dependency-free so they're trivially unit-testable.
 *
 * Each function documents:
 *   - the formula being applied,
 *   - the definition of every input,
 *   - a validation contract (never returns NaN; explicit error reasons
 *     for the caller to render).
 */

// ─────────────────────────────────────────────────────────────────────
//   RPM Calculator
// ─────────────────────────────────────────────────────────────────────

export interface RpmInput {
  revenue: number;
  totalViews: number;
}

export interface RpmResult {
  rpm: number;
  valid: boolean;
  reason: string | null;
}

/**
 * RPM = revenue ÷ total views × 1,000
 *
 * RPM is a "per 1,000 total views" metric — it does NOT filter to just
 * monetized views. That's what distinguishes it from CPM (see below).
 * If the caller wants a monetized-only ratio they should use
 * `calculateCpm` instead.
 */
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

// ─────────────────────────────────────────────────────────────────────
//   CPM Calculator
// ─────────────────────────────────────────────────────────────────────

export interface CpmInput {
  grossAdRevenue: number;
  monetizedImpressions: number;
}

export interface CpmResult {
  cpm: number;
  valid: boolean;
  reason: string | null;
}

/**
 * CPM = gross ad revenue ÷ monetized impressions × 1,000
 *
 * Notes on interpretation:
 *
 *   • The CPM this calculator returns is the *creator-side* CPM —
 *     "how much did I earn per 1,000 monetized ad impressions?".
 *   • The advertiser-side CPM (what the advertiser paid before Google's
 *     share) is NOT exposed to creators by YouTube. Only Google knows
 *     it. Anyone claiming to show you "the advertiser's real CPM" is
 *     guessing.
 *   • CPM ≠ RPM. If you divide by total views (including non-monetized
 *     views), you're computing RPM, not CPM.
 *   • Do NOT multiply views × CPM to estimate creator earnings — that's
 *     mathematically incorrect. Use the main YouTube Money Calculator,
 *     which uses RPM.
 */
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

// ─────────────────────────────────────────────────────────────────────
//   Sponsorship Estimator
// ─────────────────────────────────────────────────────────────────────
//
// Sponsorship pricing is negotiated, not paid at a public rate card.
// Industry rules of thumb converge on a "per 1,000 views" primary
// driver, adjusted by deliverable type, usage rights, exclusivity, and
// niche/geo premium. We combine those factors into a single
// per-video expected rate and apply a wide low/high band (0.6× / 1.6×)
// because real quotes vary enormously.
//
// Base per-1,000-views rates below are drawn from publicly cited
// creator sponsorship guides (Passionfruit, Grin, Aspire, etc.) and
// are intentionally on the "typical mid-market US creator" spectrum.
// A well-negotiated deal for a top-tier creator can easily 2–3× these
// numbers; a lower-desirable audience can hit the 0.6× floor.
//

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

/**
 * Baseline USD per 1,000 views by deliverable type.
 *
 *   • integration    ($22/1k views): 30–90 second brand mention inside
 *     a normal video. The most common format; the reference number
 *     for the whole table.
 *   • dedicated      ($50/1k views): the entire video is about the
 *     sponsor. Higher rate because it exchanges channel goodwill for
 *     the ad message.
 *   • shortsMention  ($9/1k views): a mention inside a Short. Rates
 *     are much lower because Shorts have less "commit" from viewers
 *     and less content for the brand to attach to.
 *   • productPlacement ($14/1k views): unspoken/visual placement,
 *     no verbal endorsement. Priced between shortsMention and
 *     integration because it lacks endorsement value.
 */
const DELIVERABLE_BASE = {
  integration: 22,
  shortsMention: 9,
  dedicated: 50,
  productPlacement: 14,
};

/**
 * Usage-rights multipliers. Standard = "sponsor may use the video on
 * my channel only". Extended = "sponsor may repurpose in their paid
 * ads for 3–6 months". Perpetual = "sponsor may use forever, in any
 * medium, worldwide". Perpetual is what many agencies push for and
 * why creators should charge more for it.
 */
const USAGE_MULT = {
  standard: 1,
  extended: 1.35,
  perpetual: 1.75,
};

/**
 * Exclusivity multipliers. None = "I can promote a competitor next
 * week". Partial = "I won't promote a competitor in this specific
 * category during the term". Full = "I won't accept ANY other
 * sponsorships during the term".
 */
const EXCLUSIVITY_MULT = {
  none: 1,
  partial: 1.2,
  full: 1.6,
};

/**
 * Sponsorship rate formula:
 *
 *   perViewRate  = base × usage × exclusivity × niche × country × engagementMod
 *   primaryRate  = perViewRate × (avgViews / 1000)
 *
 *   subscriberFloor = subscribers × 0.005
 *
 *   perVideoExpected = max(primaryRate, subscriberFloor)
 *   perVideoLow      = perVideoExpected × 0.6   ← wide band because
 *   perVideoHigh     = perVideoExpected × 1.6      sponsorship is highly
 *                                                  negotiable
 *
 * The subscriber floor exists because tiny channels still command a
 * minimum fee — brands don't typically pay less than ~$5 per 1,000
 * subscribers even for a low-view creator, especially in the
 * micro-influencer segment.
 *
 * The engagement modifier treats 5% engagement rate as the reference
 * baseline (1×). Below-average engagement gets discounted (down to
 * 0.5×); premium engaged audiences get uplift (up to 2.5×). The
 * clamp is important because raw engagement rate on YouTube can be
 * misleading — e.g. a Shorts-heavy channel may show a very high
 * engagement ratio simply because Shorts get many likes-per-view.
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

  // 5% engagement ≈ YouTube average; treat as 1×. Slope is gentle so
  // an "engagement stat" doesn't overwhelm the rate.
  const engagementMod = clamp(safeEngagement / 5, 0.5, 2.5);

  // Views-based rate is the primary driver — big audience, big cheque.
  const perThousand = base * usage * excl * safeNiche * safeCountry * engagementMod;
  const primary = (safeViews / 1000) * perThousand;

  // Subscriber floor — small channels still command a minimum rate.
  const floor = safeSubs * 0.005;

  const perVideoExpected = Math.max(primary, floor);
  const perVideoLow = perVideoExpected * 0.6;
  const perVideoHigh = perVideoExpected * 1.6;

  // Number of sponsored videos scales the total package linearly.
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
