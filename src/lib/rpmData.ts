/**
 * Independent RPM (Revenue Per Mille) benchmarks.
 *
 * ─────────────────────────────────────────────────────────────────────
 *   Terminology cheat-sheet
 * ─────────────────────────────────────────────────────────────────────
 *
 * • **CPM** — Cost Per Mille. What an advertiser pays for 1,000 monetized
 *   ad impressions on YouTube, BEFORE Google takes its share (~45% on
 *   long-form, up to ~55% on Shorts). This is an advertiser-side metric
 *   that creators never see directly.
 *
 * • **RPM** — Revenue Per Mille. What the creator actually earns per
 *   1,000 total video views, AFTER Google's revenue share and AFTER
 *   accounting for non-monetized views (ad-blockers, Premium viewers,
 *   Made-for-Kids restrictions, unfilled ad slots, etc.). RPM is what
 *   creators see in YouTube Studio.
 *
 * • **This app estimates RPM, never CPM.**  Multiplying `views × CPM`
 *   to estimate creator earnings is a common but incorrect shortcut
 *   used by many other calculators — we deliberately avoid it.
 *
 * ─────────────────────────────────────────────────────────────────────
 *   Where these numbers come from
 * ─────────────────────────────────────────────────────────────────────
 *
 * The values below are aggregated approximations from publicly-reported
 * creator RPMs, industry blog posts, and creator-economy reports. They
 * are NOT provided or endorsed by YouTube or Google. They exist purely
 * to give the user a defensible starting point that they can override
 * with their own custom RPM (see `EarningsInput.rpm`).
 *
 * Every number has a comment explaining its rationale. If any number
 * seems off, please flag it — the goal is realism, not marketing.
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface RpmRange {
  low: number;
  expected: number;
  high: number;
}

/**
 * A niche has TWO multipliers because the mechanisms are different:
 *
 * • `rpmMultiplier` (long-form) — advertiser demand for that audience
 *   times a per-video auction. Finance viewers cost advertisers roughly
 *   2–3× what general-audience viewers cost, so finance creators earn
 *   roughly 2–3× the general long-form RPM.
 *
 * • `shortsRpmMultiplier` — Shorts pay from a shared ad-revenue pool
 *   allocated by view share. The pool is less niche-sensitive because
 *   advertisers bid on the Shorts feed as a whole, not on individual
 *   videos. So the niche premium is compressed — a finance creator
 *   earns maybe 1.4–1.6× the general Shorts RPM, not 2–3×.
 */
export interface Niche {
  id: string;
  label: string;
  /** Long-form multiplier on top of the country base RPM. */
  rpmMultiplier: number;
  /** Shorts multiplier on top of the country Shorts base RPM. */
  shortsRpmMultiplier: number;
}

/**
 * A country tier carries TWO RPM ranges — one for long-form, one for
 * Shorts — because the Shorts revenue pool is much flatter globally
 * than long-form ad prices are.
 */
export interface CountryTier {
  id: string;
  label: string;
  /** Long-form RPM range in USD (per 1,000 total views). */
  baseRpm: RpmRange;
  /**
   * Shorts RPM range in USD (per 1,000 Shorts views). Values are
   * roughly 1–2 orders of magnitude below long-form because the
   * Shorts monetization pool is smaller and shared broadly.
   */
  shortsRpm: RpmRange;
}

// ─── Country RPM tiers ─────────────────────────────────────────────
//
// Long-form ranges reflect the typical creator-reported spread for a
// mid-desirable niche in each country. Shorts ranges are drawn from
// public creator reports of the YouTube Shorts monetization program.
//
// Real-world reference points (all publicly cited, non-proprietary):
//   • US mid-market long-form RPM: $4–$10, with premium niches $10–$25.
//   • UK/CA/AU long-form RPM: $3–$8.
//   • Germany/Nordic long-form RPM: $2.5–$8.
//   • India/Indonesia long-form RPM: $0.3–$2.
//   • US Shorts: $0.02–$0.15 (most creators report $0.04–$0.08).
//   • Tier-3 Shorts: $0.005–$0.03.
//

export const COUNTRIES: CountryTier[] = [
  {
    id: "US",
    label: "United States",
    baseRpm: { low: 3.5, expected: 6.5, high: 12 },
    shortsRpm: { low: 0.04, expected: 0.08, high: 0.18 },
  },
  {
    id: "GB",
    label: "United Kingdom",
    baseRpm: { low: 3, expected: 5.5, high: 9 },
    shortsRpm: { low: 0.03, expected: 0.07, high: 0.14 },
  },
  {
    id: "CA",
    label: "Canada",
    baseRpm: { low: 3, expected: 5.5, high: 9 },
    shortsRpm: { low: 0.03, expected: 0.07, high: 0.14 },
  },
  {
    id: "AU",
    label: "Australia",
    baseRpm: { low: 3, expected: 5.8, high: 9.5 },
    shortsRpm: { low: 0.03, expected: 0.07, high: 0.14 },
  },
  {
    id: "DE",
    label: "Germany",
    baseRpm: { low: 2.5, expected: 4.8, high: 8 },
    shortsRpm: { low: 0.03, expected: 0.06, high: 0.12 },
  },
  {
    id: "FR",
    label: "France",
    baseRpm: { low: 2, expected: 3.8, high: 6.5 },
    shortsRpm: { low: 0.02, expected: 0.05, high: 0.1 },
  },
  {
    id: "NL",
    label: "Netherlands",
    baseRpm: { low: 2.5, expected: 4.6, high: 7.5 },
    shortsRpm: { low: 0.03, expected: 0.06, high: 0.12 },
  },
  {
    id: "SE",
    label: "Sweden",
    baseRpm: { low: 2.5, expected: 4.4, high: 7.2 },
    shortsRpm: { low: 0.03, expected: 0.06, high: 0.11 },
  },
  {
    id: "JP",
    label: "Japan",
    baseRpm: { low: 2, expected: 3.5, high: 6 },
    shortsRpm: { low: 0.02, expected: 0.05, high: 0.1 },
  },
  {
    id: "KR",
    label: "South Korea",
    baseRpm: { low: 1.5, expected: 2.8, high: 4.8 },
    shortsRpm: { low: 0.015, expected: 0.04, high: 0.08 },
  },
  {
    id: "IN",
    label: "India",
    baseRpm: { low: 0.4, expected: 1.1, high: 2.2 },
    shortsRpm: { low: 0.005, expected: 0.012, high: 0.03 },
  },
  {
    id: "BR",
    label: "Brazil",
    baseRpm: { low: 0.6, expected: 1.4, high: 2.6 },
    shortsRpm: { low: 0.008, expected: 0.018, high: 0.04 },
  },
  {
    id: "MX",
    label: "Mexico",
    baseRpm: { low: 0.8, expected: 1.6, high: 2.8 },
    shortsRpm: { low: 0.01, expected: 0.02, high: 0.045 },
  },
  {
    id: "ES",
    label: "Spain",
    baseRpm: { low: 1.5, expected: 3, high: 5 },
    shortsRpm: { low: 0.02, expected: 0.04, high: 0.08 },
  },
  {
    id: "IT",
    label: "Italy",
    baseRpm: { low: 1.5, expected: 2.8, high: 4.6 },
    shortsRpm: { low: 0.02, expected: 0.04, high: 0.08 },
  },
  {
    id: "ID",
    label: "Indonesia",
    baseRpm: { low: 0.3, expected: 0.9, high: 1.8 },
    shortsRpm: { low: 0.005, expected: 0.012, high: 0.025 },
  },
  {
    id: "PH",
    label: "Philippines",
    baseRpm: { low: 0.4, expected: 1, high: 1.9 },
    shortsRpm: { low: 0.005, expected: 0.013, high: 0.028 },
  },
  {
    id: "ZA",
    label: "South Africa",
    // Adjusted slightly down from the previous $1.5 expected; public
    // creator reports for ZA cluster around $1–$1.6 for general content.
    baseRpm: { low: 0.5, expected: 1.2, high: 2.2 },
    shortsRpm: { low: 0.008, expected: 0.02, high: 0.04 },
  },
  {
    id: "AE",
    label: "United Arab Emirates",
    baseRpm: { low: 2, expected: 4, high: 7 },
    shortsRpm: { low: 0.025, expected: 0.05, high: 0.1 },
  },
  {
    id: "OTHER",
    label: "Other / Global mix",
    // A safe global-average fallback for a channel with mixed geography.
    baseRpm: { low: 1, expected: 2.2, high: 4 },
    shortsRpm: { low: 0.015, expected: 0.03, high: 0.06 },
  },
];

// ─── Niche multipliers ─────────────────────────────────────────────
//
// Long-form multipliers reflect the well-documented advertiser premium
// paid to reach different audiences. The commonly cited ordering is:
//   Finance ≫ Business/Marketing ≫ Tech ≫ Education ≫ Health
//   ≫ General ≫ Entertainment ≫ Gaming ≫ Music ≫ Kids.
//
// Shorts multipliers are compressed. The Shorts revenue pool is
// allocated on view share, not per-video auction, so niche premium
// carries less signal. Public reports show finance-Shorts earning
// perhaps ~1.5× general-audience-Shorts, versus finance-long-form
// earning ~2.4× general-audience-long-form.
//

export const NICHES: Niche[] = [
  {
    id: "finance",
    label: "Personal Finance & Investing",
    // Consistently the top-earning long-form niche in creator reports.
    rpmMultiplier: 2.4,
    shortsRpmMultiplier: 1.5,
  },
  {
    id: "business",
    // Split out from finance in the 2026 revision. Business, marketing,
    // and entrepreneurship content commands high but not finance-tier
    // premium — advertisers bidding here are B2B and SaaS.
    label: "Business & Entrepreneurship",
    rpmMultiplier: 1.9,
    shortsRpmMultiplier: 1.4,
  },
  {
    id: "marketing",
    label: "Marketing & Career",
    rpmMultiplier: 1.8,
    shortsRpmMultiplier: 1.35,
  },
  {
    id: "tech",
    label: "Tech & Software",
    // Tech reviews and tutorials attract SaaS, hardware, and consumer-
    // electronics advertisers — reliably above-average RPM.
    rpmMultiplier: 1.6,
    shortsRpmMultiplier: 1.3,
  },
  {
    id: "education",
    label: "Education & How-to",
    // Education attracts test-prep, online-course, and edtech
    // advertisers. Reliable, mid-high premium.
    rpmMultiplier: 1.4,
    shortsRpmMultiplier: 1.2,
  },
  {
    id: "health",
    label: "Health & Fitness",
    // Health advertisers bid competitively for engaged audiences, but
    // some sub-topics (supplements, medical claims) are demonetization
    // risks that pull the average down.
    rpmMultiplier: 1.2,
    shortsRpmMultiplier: 1.1,
  },
  {
    id: "auto",
    label: "Automotive",
    // Car brands + insurance advertisers push this above general.
    rpmMultiplier: 1.1,
    shortsRpmMultiplier: 1.05,
  },
  {
    id: "science",
    label: "Science",
    rpmMultiplier: 1.1,
    shortsRpmMultiplier: 1.05,
  },
  {
    id: "beauty",
    label: "Beauty & Fashion",
    // Beauty is roughly parity with general — high advertiser demand
    // but the sponsorship-heavy nature of the niche means AdSense RPM
    // is only average. Sponsorship rates (separate calculator) are
    // where beauty creators actually pull ahead.
    rpmMultiplier: 1.0,
    shortsRpmMultiplier: 1.0,
  },
  {
    id: "lifestyle",
    // Added in the 2026 revision — vlogs, daily-life, wellness content.
    label: "Lifestyle & Vlogs",
    rpmMultiplier: 0.9,
    shortsRpmMultiplier: 0.95,
  },
  {
    id: "food",
    label: "Food & Cooking",
    rpmMultiplier: 0.9,
    shortsRpmMultiplier: 0.95,
  },
  {
    id: "travel",
    label: "Travel",
    rpmMultiplier: 0.9,
    shortsRpmMultiplier: 0.95,
  },
  {
    id: "news",
    label: "News & Politics",
    // Bumped from 0.7 → 0.9 in the 2026 revision. News RPMs have
    // recovered as YouTube's "advertiser-friendly" categorization has
    // matured; still below general because political content is a
    // brand-safety risk to many advertisers.
    rpmMultiplier: 0.9,
    shortsRpmMultiplier: 0.9,
  },
  {
    id: "diy",
    label: "DIY & Home",
    rpmMultiplier: 0.9,
    shortsRpmMultiplier: 0.95,
  },
  {
    id: "sports",
    label: "Sports",
    rpmMultiplier: 0.85,
    shortsRpmMultiplier: 0.9,
  },
  {
    id: "entertainment",
    label: "Entertainment & Comedy",
    // Broad-audience content — advertisers still bid, but general
    // rather than premium.
    rpmMultiplier: 0.8,
    shortsRpmMultiplier: 0.9,
  },
  {
    id: "gaming",
    label: "Gaming",
    // Gaming is a huge category but skews younger with a lot of
    // advertiser-shy sub-content (violent games, streamer language,
    // etc.), which pulls the effective RPM well below general.
    rpmMultiplier: 0.7,
    shortsRpmMultiplier: 0.85,
  },
  {
    id: "music",
    label: "Music",
    // Music is the most heavily "shared" niche — YouTube's music-
    // licensing arrangements mean creators keep less of the ad revenue
    // than in other categories.
    rpmMultiplier: 0.6,
    shortsRpmMultiplier: 0.75,
  },
  {
    id: "kids",
    label: "Kids & Family",
    // Made-for-Kids content is COPPA-compliant and cannot show
    // personalized ads, which drastically reduces RPM. Set below the
    // long-form 0.5× previously used because the effective revenue
    // gap versus general is closer to 60–70%, not 50%.
    rpmMultiplier: 0.4,
    shortsRpmMultiplier: 0.55,
  },
  {
    id: "other",
    label: "Other / General",
    rpmMultiplier: 1.0,
    shortsRpmMultiplier: 1.0,
  },
];

// ─── Mixed-content blend ───────────────────────────────────────────
//
// When a channel publishes both Shorts and long-form videos we can't
// know the exact revenue split without private analytics. We assume a
// weighted blend based on the split of views (not videos): the earnings
// engine uses `MIXED_LONG_SHARE` as the default long-form share unless
// the caller provides a specific `shortsShare`.
//
// Rationale: for a channel that's genuinely "mixed" (30–70% of uploads
// are Shorts), Shorts tend to over-index in view count but under-index
// in watch time, and thus in revenue. 60% long / 40% shorts of REVENUE
// is a reasonable default when only the upload-count split is known.
//

export const MIXED_LONG_SHARE = 0.6;
export const MIXED_SHORTS_SHARE = 0.4;

// ─── Estimate bands ────────────────────────────────────────────────
//
// Given an "expected" RPM, we return a low/expected/high band to
// visualize uncertainty. Real per-creator variance is wide because so
// many factors (fill rate, ad category mix, seasonality, refund rate,
// YouTube share) are hidden from us.
//
// The band factors are exposed here (rather than hard-coded in
// `earnings.ts`) so tests can reference the same source of truth.
//
// Widened in the 2026 revision from 0.7/1.35 → 0.6/1.5 to reflect
// real-world variance more honestly.
//

export const BAND_FACTORS = {
  conservative: 0.6,
  expected: 1.0,
  optimistic: 1.5,
} as const;

// ─── Currencies ────────────────────────────────────────────────────
//
// Static approximate FX table. This tool does not consume a live FX
// feed; users are told this explicitly on the methodology page. If a
// number matters, cross-check against a live rate.
//

export interface Currency {
  code: string;
  label: string;
  symbol: string;
  usdRate: number; // 1 USD = usdRate units of this currency
}

export const CURRENCIES: Currency[] = [
  { code: "USD", label: "US Dollar", symbol: "$", usdRate: 1 },
  { code: "EUR", label: "Euro", symbol: "€", usdRate: 0.92 },
  { code: "GBP", label: "British Pound", symbol: "£", usdRate: 0.79 },
  { code: "CAD", label: "Canadian Dollar", symbol: "$", usdRate: 1.37 },
  { code: "AUD", label: "Australian Dollar", symbol: "$", usdRate: 1.51 },
  { code: "JPY", label: "Japanese Yen", symbol: "¥", usdRate: 156 },
  { code: "INR", label: "Indian Rupee", symbol: "₹", usdRate: 83 },
  { code: "BRL", label: "Brazilian Real", symbol: "R$", usdRate: 5.1 },
  { code: "MXN", label: "Mexican Peso", symbol: "$", usdRate: 17 },
  { code: "KRW", label: "South Korean Won", symbol: "₩", usdRate: 1360 },
  { code: "SGD", label: "Singapore Dollar", symbol: "$", usdRate: 1.35 },
  { code: "AED", label: "UAE Dirham", symbol: "د.إ", usdRate: 3.67 },
  { code: "ZAR", label: "South African Rand", symbol: "R", usdRate: 18.5 },
];

export function findCountry(id: string): CountryTier {
  return COUNTRIES.find((c) => c.id === id) ?? COUNTRIES[COUNTRIES.length - 1];
}

export function findNiche(id: string): Niche {
  return NICHES.find((n) => n.id === id) ?? NICHES[NICHES.length - 1];
}

export function findCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}
