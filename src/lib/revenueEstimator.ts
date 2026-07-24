/**
 * Website Revenue Estimation Engine.
 *
 * Pure functions — no side effects, no UI dependencies.
 * All values are ESTIMATES based on industry averages.
 * The UI layer can later be backed by a real API without changes.
 */

// ─── Types ──────────────────────────────────────────────────────────

export type Niche =
  | "technology" | "finance" | "gaming" | "health" | "education"
  | "travel" | "lifestyle" | "business" | "news" | "ecommerce" | "general";

export interface EstimationInput {
  domain: string;
  monthlyVisitors?: number;
  pageviewsPerSession?: number;
  rpm?: number;
  niche?: Niche;
  primaryCountry?: string;
}

export interface TrafficEstimate {
  monthlyVisitors: number;
  dailyVisitors: number;
  monthlyPageviews: number;
  sessionsPerMonth: number;
  returningVisitorPct: number;
}

export interface RevenueBreakdownItem {
  source: string;
  monthly: number;
  yearly: number;
  pct: number;
}

export interface CountryShare {
  country: string;
  code: string;
  pct: number;
  flag: string;
}

export interface GrowthProjection {
  label: string;
  pct: number;
  monthly: number;
  yearly: number;
}

export interface Insight {
  text: string;
  type: "positive" | "neutral" | "opportunity";
}

export interface EstimationResult {
  domain: string;
  niche: Niche;
  nicheLabel: string;
  traffic: TrafficEstimate;
  rpm: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  revenuePerVisitor: number;
  valuationLow: number;
  valuationHigh: number;
  breakdown: RevenueBreakdownItem[];
  countries: CountryShare[];
  projections: GrowthProjection[];
  insights: Insight[];
}

// ─── Constants ──────────────────────────────────────────────────────

const NICHE_RPM: Record<Niche, { low: number; mid: number; high: number }> = {
  finance: { low: 15, mid: 28, high: 45 },
  technology: { low: 8, mid: 15, high: 25 },
  business: { low: 10, mid: 20, high: 35 },
  health: { low: 8, mid: 14, high: 22 },
  education: { low: 5, mid: 10, high: 18 },
  travel: { low: 6, mid: 12, high: 20 },
  gaming: { low: 3, mid: 6, high: 12 },
  lifestyle: { low: 4, mid: 8, high: 15 },
  news: { low: 4, mid: 8, high: 14 },
  ecommerce: { low: 8, mid: 16, high: 28 },
  general: { low: 4, mid: 8, high: 15 },
};

const NICHE_LABELS: Record<Niche, string> = {
  technology: "Technology", finance: "Finance", gaming: "Gaming",
  health: "Health & Wellness", education: "Education", travel: "Travel",
  lifestyle: "Lifestyle", business: "Business", news: "News & Media",
  ecommerce: "E-commerce", general: "General",
};

const NICHE_VALUATION_MULTIPLIER: Record<Niche, { low: number; high: number }> = {
  finance: { low: 36, high: 60 },
  technology: { low: 30, high: 48 },
  business: { low: 30, high: 50 },
  health: { low: 28, high: 44 },
  education: { low: 24, high: 40 },
  travel: { low: 24, high: 36 },
  gaming: { low: 20, high: 32 },
  lifestyle: { low: 20, high: 36 },
  news: { low: 18, high: 30 },
  ecommerce: { low: 28, high: 48 },
  general: { low: 24, high: 36 },
};

const BREAKDOWN_WEIGHTS: Record<Niche, Record<string, number>> = {
  finance: { "Display Ads": 30, "Affiliate Marketing": 35, "Sponsored Posts": 15, "Digital Products": 12, "Memberships": 8 },
  technology: { "Display Ads": 35, "Affiliate Marketing": 30, "Sponsored Posts": 15, "Digital Products": 12, "Memberships": 8 },
  business: { "Display Ads": 25, "Affiliate Marketing": 25, "Sponsored Posts": 20, "Digital Products": 18, "Memberships": 12 },
  health: { "Display Ads": 35, "Affiliate Marketing": 30, "Sponsored Posts": 15, "Digital Products": 12, "Memberships": 8 },
  education: { "Display Ads": 25, "Affiliate Marketing": 15, "Sponsored Posts": 10, "Digital Products": 30, "Memberships": 20 },
  travel: { "Display Ads": 35, "Affiliate Marketing": 35, "Sponsored Posts": 15, "Digital Products": 8, "Memberships": 7 },
  gaming: { "Display Ads": 45, "Affiliate Marketing": 25, "Sponsored Posts": 15, "Digital Products": 10, "Memberships": 5 },
  lifestyle: { "Display Ads": 35, "Affiliate Marketing": 25, "Sponsored Posts": 20, "Digital Products": 12, "Memberships": 8 },
  news: { "Display Ads": 55, "Affiliate Marketing": 10, "Sponsored Posts": 15, "Digital Products": 10, "Memberships": 10 },
  ecommerce: { "Display Ads": 20, "Affiliate Marketing": 40, "Sponsored Posts": 15, "Digital Products": 15, "Memberships": 10 },
  general: { "Display Ads": 35, "Affiliate Marketing": 25, "Sponsored Posts": 15, "Digital Products": 15, "Memberships": 10 },
};

const DEFAULT_COUNTRIES: CountryShare[] = [
  { country: "United States", code: "US", pct: 35, flag: "🇺🇸" },
  { country: "United Kingdom", code: "GB", pct: 12, flag: "🇬🇧" },
  { country: "India", code: "IN", pct: 15, flag: "🇮🇳" },
  { country: "Canada", code: "CA", pct: 8, flag: "🇨🇦" },
  { country: "Germany", code: "DE", pct: 6, flag: "🇩🇪" },
  { country: "Australia", code: "AU", pct: 5, flag: "🇦🇺" },
  { country: "Others", code: "XX", pct: 19, flag: "🌍" },
];

// ─── Core Functions ─────────────────────────────────────────────────

/** Detect niche from domain name heuristics. */
export function detectNiche(domain: string): Niche {
  const d = domain.toLowerCase();
  if (/tech|code|dev|soft|hack|cyber|ai|cloud/.test(d)) return "technology";
  if (/finance|invest|money|bank|crypto|stock|trade/.test(d)) return "finance";
  if (/game|play|esport|gaming/.test(d)) return "gaming";
  if (/health|medical|fitness|diet|wellness/.test(d)) return "health";
  if (/edu|learn|course|school|university|study/.test(d)) return "education";
  if (/travel|trip|tour|hotel|flight|booking/.test(d)) return "travel";
  if (/shop|store|buy|deal|product|ecommerce/.test(d)) return "ecommerce";
  if (/business|entrepreneur|startup|saas/.test(d)) return "business";
  if (/news|media|press|journal|times|post/.test(d)) return "news";
  if (/life|style|fashion|beauty|food|recipe/.test(d)) return "lifestyle";
  return "general";
}

/** Estimate traffic from domain characteristics. */
export function estimateTraffic(input: EstimationInput): TrafficEstimate {
  const base = input.monthlyVisitors ?? generateTrafficEstimate(input.domain);
  const pageviews = input.pageviewsPerSession ?? 2.5;
  return {
    monthlyVisitors: base,
    dailyVisitors: Math.round(base / 30),
    monthlyPageviews: Math.round(base * pageviews),
    sessionsPerMonth: Math.round(base * 1.2),
    returningVisitorPct: 35,
  };
}

/** Estimate RPM for a niche. */
export function estimateRPM(niche: Niche, customRpm?: number): number {
  if (customRpm !== undefined && customRpm > 0) return customRpm;
  return NICHE_RPM[niche].mid;
}

/** Full revenue estimate. */
export function estimateRevenue(input: EstimationInput): EstimationResult {
  const niche = input.niche ?? detectNiche(input.domain);
  const traffic = estimateTraffic(input);
  const rpm = estimateRPM(niche, input.rpm);
  const monthlyRevenue = (traffic.monthlyPageviews * rpm) / 1000;
  const yearlyRevenue = monthlyRevenue * 12;
  const revenuePerVisitor = traffic.monthlyVisitors > 0 ? monthlyRevenue / traffic.monthlyVisitors : 0;

  const mult = NICHE_VALUATION_MULTIPLIER[niche];
  const valuationLow = Math.round(monthlyRevenue * mult.low);
  const valuationHigh = Math.round(monthlyRevenue * mult.high);

  const breakdown = estimateRevenueBreakdown(niche, monthlyRevenue);
  const countries = DEFAULT_COUNTRIES;
  const projections = estimateGrowthProjection(monthlyRevenue);
  const insights = generateInsights(niche, traffic, rpm, monthlyRevenue);

  return {
    domain: input.domain,
    niche,
    nicheLabel: NICHE_LABELS[niche],
    traffic,
    rpm,
    monthlyRevenue,
    yearlyRevenue,
    revenuePerVisitor,
    valuationLow,
    valuationHigh,
    breakdown,
    countries,
    projections,
    insights,
  };
}

/** Revenue breakdown by monetization type. */
export function estimateRevenueBreakdown(niche: Niche, monthlyRevenue: number): RevenueBreakdownItem[] {
  const weights = BREAKDOWN_WEIGHTS[niche];
  return Object.entries(weights).map(([source, pct]) => ({
    source,
    monthly: Math.round((monthlyRevenue * pct) / 100),
    yearly: Math.round((monthlyRevenue * pct * 12) / 100),
    pct,
  }));
}

/** Growth projections. */
export function estimateGrowthProjection(monthlyRevenue: number): GrowthProjection[] {
  return [
    { label: "+10%", pct: 10, monthly: Math.round(monthlyRevenue * 1.1), yearly: Math.round(monthlyRevenue * 1.1 * 12) },
    { label: "+25%", pct: 25, monthly: Math.round(monthlyRevenue * 1.25), yearly: Math.round(monthlyRevenue * 1.25 * 12) },
    { label: "+50%", pct: 50, monthly: Math.round(monthlyRevenue * 1.5), yearly: Math.round(monthlyRevenue * 1.5 * 12) },
    { label: "+100%", pct: 100, monthly: Math.round(monthlyRevenue * 2), yearly: Math.round(monthlyRevenue * 2 * 12) },
  ];
}

/** Generate contextual insights. */
export function generateInsights(niche: Niche, traffic: TrafficEstimate, rpm: number, monthly: number): Insight[] {
  const insights: Insight[] = [];
  const nicheData = NICHE_RPM[niche];

  if (rpm >= nicheData.high * 0.8) {
    insights.push({ text: `This niche (${NICHE_LABELS[niche]}) generally commands above-average RPM, supporting strong ad revenue.`, type: "positive" });
  }
  if (traffic.monthlyVisitors >= 50000) {
    insights.push({ text: "Traffic appears sufficient for premium ad networks like Mediavine or AdThrive.", type: "positive" });
  } else if (traffic.monthlyVisitors >= 10000) {
    insights.push({ text: "Traffic is approaching the threshold for premium ad networks. Growth could unlock significantly higher RPM.", type: "opportunity" });
  }
  if (BREAKDOWN_WEIGHTS[niche]["Affiliate Marketing"] >= 30) {
    insights.push({ text: "Affiliate income potential is high for this niche. Product reviews and comparisons perform well.", type: "opportunity" });
  }
  if (BREAKDOWN_WEIGHTS[niche]["Display Ads"] >= 40) {
    insights.push({ text: "Display ads likely contribute the majority of revenue. Optimizing ad placement could increase earnings.", type: "neutral" });
  }
  if (monthly >= 5000) {
    insights.push({ text: "At this revenue level, diversifying into digital products or memberships could accelerate growth.", type: "opportunity" });
  }
  if (traffic.monthlyVisitors < 10000) {
    insights.push({ text: "Focus on content production and SEO to grow traffic. Revenue scales linearly with visitors in most niches.", type: "opportunity" });
  }

  return insights.slice(0, 5);
}

/** Estimate website value. */
export function estimateWebsiteValue(monthlyRevenue: number, niche: Niche): { low: number; high: number } {
  const mult = NICHE_VALUATION_MULTIPLIER[niche];
  return { low: Math.round(monthlyRevenue * mult.low), high: Math.round(monthlyRevenue * mult.high) };
}

/** Estimate country distribution. */
export function estimateCountryDistribution(): CountryShare[] {
  return DEFAULT_COUNTRIES;
}

// ─── Helpers ────────────────────────────────────────────────────────

function generateTrafficEstimate(domain: string): number {
  // Seed-based pseudorandom from domain for consistent estimates
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash + domain.charCodeAt(i)) | 0;
  }
  // Generate a plausible traffic range (5k–500k)
  const normalized = Math.abs(hash % 10000) / 10000;
  return Math.round(5000 + normalized * 495000);
}
