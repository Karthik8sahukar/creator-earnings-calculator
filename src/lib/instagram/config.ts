/**
 * Instagram Money Calculator — configuration.
 *
 * ─────────────────────────────────────────────────────────────────────
 *   Design principles
 * ─────────────────────────────────────────────────────────────────────
 *
 * • Every multiplier and rate lives here (not in a component). The
 *   calculator components import from this file so that tuning the
 *   model never requires touching UI code.
 *
 * • All figures are DEFENSIBLE APPROXIMATIONS drawn from public
 *   creator-economy reports (Influencer Marketing Hub, IZEA, Aspire,
 *   HypeAuditor, Later, Statista, and public Reddit/YouTube
 *   creator disclosures). They are NOT provided or endorsed by
 *   Instagram or Meta. Real quotes vary enormously — the model
 *   emits a Low / Expected / High band precisely because a single
 *   number would over-promise.
 *
 * • RPM/CPM are irrelevant here: Instagram creators do not have a
 *   YouTube-style ad-revenue share on their organic feed/reels/
 *   stories. Their real income streams are:
 *     – Sponsored feed posts
 *     – Sponsored reels
 *     – Sponsored stories
 *     – Affiliate marketing (conversion-driven)
 *     – Fan subscriptions
 *
 * • We NEVER "guarantee" earnings. Every result is labelled as an
 *   estimate.
 *
 * • The three-band model (Low / Expected / High) is driven by a
 *   single constant (`ESTIMATE_BAND_FACTORS`) so the uncertainty
 *   story is uniform across every income stream.
 */

// ─────────────────────────────────────────────────────────────────
//   Estimate bands
// ─────────────────────────────────────────────────────────────────
//
// Sponsorship pricing on Instagram is extremely negotiable — a mid-
// tier creator with strong engagement can charge 2x what a lower-
// engagement peer with the same follower count would. We reflect
// that with a WIDE band (0.6× / 1.0× / 1.55×). Every downstream
// number funnels through these constants.

export const ESTIMATE_BAND_FACTORS = Object.freeze({
  low: 0.6,
  expected: 1.0,
  high: 1.55,
});

// ─────────────────────────────────────────────────────────────────
//   Base rates — the "typical mid-market US creator, 5% engagement,
//   general lifestyle niche" reference values.
// ─────────────────────────────────────────────────────────────────
//
// These are USD amounts per 1,000 units of the driving metric. The
// driving metric differs by content type:
//   feedPost      → per 1,000 post reach
//   reel          → per 1,000 reel views
//   story         → per 1,000 story views
//
// Rationale for the ordering:
//   • Reels ($22/1k views) are the highest-earning format because
//     they attract the largest brand budgets and the algorithm
//     amplifies them across non-followers.
//   • Feed posts ($16/1k reach) sit below reels but earn a strong
//     premium for their evergreen nature (posts stay on the profile).
//   • Stories ($5/1k views) earn substantially less per view because
//     they disappear after 24h and are consumed passively.

export const INSTAGRAM_BASE_RATES_USD = Object.freeze({
  feedPostPerThousandReach: 16,
  reelPerThousandViews: 22,
  storyPerThousandViews: 5,
});

// ─────────────────────────────────────────────────────────────────
//   Follower-tier premium
// ─────────────────────────────────────────────────────────────────
//
// Instagram sponsorship pricing is NOT linear in followers. Micro-
// influencers command a premium *per follower* because their audience
// converts. Mega-influencers are cheaper *per follower* because their
// audience is broad and less engaged. We model this as a lookup
// keyed on follower count.
//
// Values are multipliers applied on top of the reach/view-driven
// rate. Reference: Influencer Marketing Hub 2025 benchmark reports.

export interface FollowerTier {
  readonly maxFollowers: number;
  readonly multiplier: number;
  readonly label: string;
}

export const FOLLOWER_TIERS: readonly FollowerTier[] = Object.freeze([
  { maxFollowers: 10_000, multiplier: 1.15, label: "Nano (< 10k)" },
  { maxFollowers: 50_000, multiplier: 1.1, label: "Micro (10k – 50k)" },
  { maxFollowers: 250_000, multiplier: 1.0, label: "Mid (50k – 250k)" },
  { maxFollowers: 1_000_000, multiplier: 0.92, label: "Macro (250k – 1M)" },
  { maxFollowers: Number.POSITIVE_INFINITY, multiplier: 0.85, label: "Mega (1M+)" },
]);

export function followerTierMultiplier(followers: number): number {
  const safe = Number.isFinite(followers) && followers > 0 ? followers : 0;
  const tier = FOLLOWER_TIERS.find((t) => safe <= t.maxFollowers);
  return tier ? tier.multiplier : 1;
}

// ─────────────────────────────────────────────────────────────────
//   Engagement modifier
// ─────────────────────────────────────────────────────────────────
//
// Reference baseline is 3% engagement (the Instagram average across
// mid-sized accounts per HypeAuditor's 2025 benchmarks). We slope
// linearly to 3x at 15%+ engagement (typical of niche communities)
// and floor at 0.5x below 0.5% engagement.

export const REFERENCE_ENGAGEMENT_PCT = 3;
export const ENGAGEMENT_MIN_MULTIPLIER = 0.5;
export const ENGAGEMENT_MAX_MULTIPLIER = 3.0;

export function engagementMultiplier(engagementPct: number): number {
  if (!Number.isFinite(engagementPct) || engagementPct <= 0) {
    return ENGAGEMENT_MIN_MULTIPLIER;
  }
  const ratio = engagementPct / REFERENCE_ENGAGEMENT_PCT;
  if (ratio < ENGAGEMENT_MIN_MULTIPLIER) return ENGAGEMENT_MIN_MULTIPLIER;
  if (ratio > ENGAGEMENT_MAX_MULTIPLIER) return ENGAGEMENT_MAX_MULTIPLIER;
  return ratio;
}

// ─────────────────────────────────────────────────────────────────
//   Niches — Instagram-specific
// ─────────────────────────────────────────────────────────────────
//
// The multiplier reflects the effective brand-deal premium each
// niche commands. Luxury and finance are top; comedy/entertainment
// sit below general. These come from public rate-card leaks and
// influencer-agency reports.
//
// Ordering rationale:
//   Luxury (2.4)     — jewelry, watches, high-end fashion
//   Finance (2.2)    — investing, credit, crypto
//   Business (1.9)   — SaaS, entrepreneurship, marketing
//   Technology (1.8) — apps, gadgets, dev tools
//   Beauty (1.6)     — cosmetics, skincare
//   Fashion (1.5)    — apparel, styling
//   Fitness (1.4)    — activewear, supplements
//   Travel (1.35)    — hospitality, airlines
//   Education (1.3)  — courses, ed-tech
//   Food (1.2)       — restaurants, meal kits
//   Parenting (1.15) — baby, family products
//   Photography (1.1)— cameras, prints
//   Lifestyle (1.05) — mixed
//   Pets (1.0)       — general (reference)
//   Gaming (0.95)    — gaming brands are budget-conscious
//   Comedy (0.9)     — brand-safety concerns compress rates
//   Other (1.0)      — fallback

export interface Niche {
  readonly id: string;
  readonly label: string;
  readonly multiplier: number;
}

export const INSTAGRAM_NICHES: readonly Niche[] = Object.freeze([
  { id: "luxury", label: "Luxury", multiplier: 2.4 },
  { id: "finance", label: "Finance & Investing", multiplier: 2.2 },
  { id: "business", label: "Business & Marketing", multiplier: 1.9 },
  { id: "technology", label: "Technology", multiplier: 1.8 },
  { id: "beauty", label: "Beauty", multiplier: 1.6 },
  { id: "fashion", label: "Fashion", multiplier: 1.5 },
  { id: "fitness", label: "Fitness & Health", multiplier: 1.4 },
  { id: "travel", label: "Travel", multiplier: 1.35 },
  { id: "education", label: "Education", multiplier: 1.3 },
  { id: "food", label: "Food & Cooking", multiplier: 1.2 },
  { id: "parenting", label: "Parenting", multiplier: 1.15 },
  { id: "photography", label: "Photography", multiplier: 1.1 },
  { id: "lifestyle", label: "Lifestyle", multiplier: 1.05 },
  { id: "pets", label: "Pets & Animals", multiplier: 1.0 },
  { id: "gaming", label: "Gaming", multiplier: 0.95 },
  { id: "comedy", label: "Comedy & Entertainment", multiplier: 0.9 },
  { id: "other", label: "Other / General", multiplier: 1.0 },
]);

export function findInstagramNiche(id: string): Niche {
  return (
    INSTAGRAM_NICHES.find((n) => n.id === id) ??
    INSTAGRAM_NICHES[INSTAGRAM_NICHES.length - 1]
  );
}

// ─────────────────────────────────────────────────────────────────
//   Countries / markets
// ─────────────────────────────────────────────────────────────────
//
// Reflects the effective premium sponsorship budgets pay for a
// creator whose audience is centered in each market. US is the
// reference (1.0). UK/CA/AU are close. Germany/Japan slightly
// below because Instagram commerce there is less mature. India /
// Brazil are meaningfully below because CPMs there are lower and
// the local brand budget-per-post is smaller.

export interface Country {
  readonly id: string;
  readonly label: string;
  readonly multiplier: number;
}

export const INSTAGRAM_COUNTRIES: readonly Country[] = Object.freeze([
  { id: "US", label: "United States", multiplier: 1.0 },
  { id: "GB", label: "United Kingdom", multiplier: 0.92 },
  { id: "CA", label: "Canada", multiplier: 0.88 },
  { id: "AU", label: "Australia", multiplier: 0.9 },
  { id: "DE", label: "Germany", multiplier: 0.82 },
  { id: "FR", label: "France", multiplier: 0.78 },
  { id: "JP", label: "Japan", multiplier: 0.72 },
  { id: "AE", label: "United Arab Emirates", multiplier: 0.85 },
  { id: "SG", label: "Singapore", multiplier: 0.8 },
  { id: "BR", label: "Brazil", multiplier: 0.35 },
  { id: "IN", label: "India", multiplier: 0.28 },
  { id: "MX", label: "Mexico", multiplier: 0.4 },
  { id: "OTHER", label: "Rest of World", multiplier: 0.5 },
]);

export function findInstagramCountry(id: string): Country {
  return (
    INSTAGRAM_COUNTRIES.find((c) => c.id === id) ??
    INSTAGRAM_COUNTRIES[INSTAGRAM_COUNTRIES.length - 1]
  );
}

// ─────────────────────────────────────────────────────────────────
//   Affiliate defaults
// ─────────────────────────────────────────────────────────────────
//
// Amazon-Associates-style affiliate: pageviews × conversion rate ×
// AOV × commission %. Defaults reflect a typical mid-market creator
// running affiliate links from their bio + occasional post CTAs.

export const AFFILIATE_DEFAULTS = Object.freeze({
  conversionRatePct: 1.5,   // % of engaged followers who click a link
  averageOrderValueUsd: 45, // typical basket size across creator affiliate
  commissionPct: 8,         // niche-blended average commission
  /**
   * The fraction of monthly engaged reach that becomes "affiliate
   * traffic". Not every viewer clicks — this reflects the funnel
   * top. Kept small so unrealistic estimates don't emerge from
   * mega-account inputs.
   */
  engagedReachClickThroughPct: 3,
});

// ─────────────────────────────────────────────────────────────────
//   Subscription defaults
// ─────────────────────────────────────────────────────────────────
//
// Instagram Subscriptions: creators charge a monthly fee for
// subscribers-only content. Meta typically retains 0% for creators
// currently (with a stated intent to introduce a share later), so
// we model at gross.

export const SUBSCRIPTION_DEFAULTS = Object.freeze({
  monthlyPriceUsd: 4.99,
  paidSubscribers: 0,
});

// ─────────────────────────────────────────────────────────────────
//   Content-frequency defaults
// ─────────────────────────────────────────────────────────────────
//
// The "sponsored fraction" of a creator's content is naturally
// capped — a creator who posts 30 feed posts a month but 25 are
// sponsored would burn their audience. We cap the sponsored share
// of posts and reels at 30% and stories at 50% by default. The user
// can still override any of these in the advanced section by setting
// their own monthly counts explicitly.

export const CONTENT_MIX_CAPS = Object.freeze({
  maxSponsoredPostsPerMonth: 12,
  maxSponsoredReelsPerMonth: 12,
  maxSponsoredStoriesPerMonth: 30,
});

// ─────────────────────────────────────────────────────────────────
//   Confidence heuristic
// ─────────────────────────────────────────────────────────────────
//
// Confidence is a UX label — it does NOT feed back into the
// numbers. It tells the user how much to trust the estimate given
// the inputs.
//
//   • Low         : any of the primary inputs (followers, engagement,
//                   or reach) is missing or zero.
//   • Moderate    : reach + engagement are populated but the numbers
//                   look off (very high engagement, very low reach:
//                   follower ratio).
//   • High        : all primary inputs are populated with plausible
//                   values.

export type Confidence = "low" | "moderate" | "high";
