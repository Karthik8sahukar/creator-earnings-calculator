/**
 * Independent RPM (Revenue Per Mille) estimates.
 *
 * IMPORTANT: These are public-domain approximations aggregated from
 * commonly-cited creator economy reports and are NOT provided or
 * endorsed by YouTube or Google. They exist purely to give the user a
 * reasonable starting point that they can override.
 *
 * RPM = ad revenue per 1,000 monetized views (after platform share).
 */

export interface RpmRange {
  low: number;
  expected: number;
  high: number;
}

export interface Niche {
  id: string;
  label: string;
  rpmMultiplier: number;
}

export interface CountryTier {
  id: string;
  label: string;
  baseRpm: RpmRange;
}

export const COUNTRIES: CountryTier[] = [
  {
    id: "US",
    label: "United States",
    baseRpm: { low: 3.5, expected: 6.5, high: 12 },
  },
  {
    id: "GB",
    label: "United Kingdom",
    baseRpm: { low: 3, expected: 5.5, high: 9 },
  },
  {
    id: "CA",
    label: "Canada",
    baseRpm: { low: 3, expected: 5.5, high: 9 },
  },
  {
    id: "AU",
    label: "Australia",
    baseRpm: { low: 3, expected: 5.8, high: 9.5 },
  },
  {
    id: "DE",
    label: "Germany",
    baseRpm: { low: 2.5, expected: 4.8, high: 8 },
  },
  {
    id: "FR",
    label: "France",
    baseRpm: { low: 2, expected: 3.8, high: 6.5 },
  },
  {
    id: "NL",
    label: "Netherlands",
    baseRpm: { low: 2.5, expected: 4.6, high: 7.5 },
  },
  {
    id: "SE",
    label: "Sweden",
    baseRpm: { low: 2.5, expected: 4.4, high: 7.2 },
  },
  {
    id: "JP",
    label: "Japan",
    baseRpm: { low: 2, expected: 3.5, high: 6 },
  },
  {
    id: "KR",
    label: "South Korea",
    baseRpm: { low: 1.5, expected: 2.8, high: 4.8 },
  },
  {
    id: "IN",
    label: "India",
    baseRpm: { low: 0.4, expected: 1.1, high: 2.2 },
  },
  {
    id: "BR",
    label: "Brazil",
    baseRpm: { low: 0.6, expected: 1.4, high: 2.6 },
  },
  {
    id: "MX",
    label: "Mexico",
    baseRpm: { low: 0.8, expected: 1.6, high: 2.8 },
  },
  {
    id: "ES",
    label: "Spain",
    baseRpm: { low: 1.5, expected: 3, high: 5 },
  },
  {
    id: "IT",
    label: "Italy",
    baseRpm: { low: 1.5, expected: 2.8, high: 4.6 },
  },
  {
    id: "ID",
    label: "Indonesia",
    baseRpm: { low: 0.3, expected: 0.9, high: 1.8 },
  },
  {
    id: "PH",
    label: "Philippines",
    baseRpm: { low: 0.4, expected: 1, high: 1.9 },
  },
  {
    id: "ZA",
    label: "South Africa",
    baseRpm: { low: 0.6, expected: 1.5, high: 2.6 },
  },
  {
    id: "AE",
    label: "United Arab Emirates",
    baseRpm: { low: 2, expected: 4, high: 7 },
  },
  {
    id: "OTHER",
    label: "Other / Global mix",
    baseRpm: { low: 1, expected: 2.2, high: 4 },
  },
];

export const NICHES: Niche[] = [
  { id: "finance", label: "Finance & Business", rpmMultiplier: 2.4 },
  { id: "tech", label: "Tech & Software", rpmMultiplier: 1.6 },
  { id: "education", label: "Education & How-to", rpmMultiplier: 1.4 },
  { id: "marketing", label: "Marketing & Career", rpmMultiplier: 1.8 },
  { id: "health", label: "Health & Fitness", rpmMultiplier: 1.2 },
  { id: "food", label: "Food & Cooking", rpmMultiplier: 0.9 },
  { id: "travel", label: "Travel", rpmMultiplier: 0.9 },
  { id: "auto", label: "Automotive", rpmMultiplier: 1.1 },
  { id: "beauty", label: "Beauty & Fashion", rpmMultiplier: 1 },
  { id: "diy", label: "DIY & Home", rpmMultiplier: 0.9 },
  { id: "science", label: "Science", rpmMultiplier: 1.1 },
  { id: "news", label: "News & Politics", rpmMultiplier: 0.7 },
  { id: "entertainment", label: "Entertainment & Vlogs", rpmMultiplier: 0.8 },
  { id: "gaming", label: "Gaming", rpmMultiplier: 0.7 },
  { id: "music", label: "Music", rpmMultiplier: 0.6 },
  { id: "kids", label: "Kids & Family", rpmMultiplier: 0.5 },
  { id: "sports", label: "Sports", rpmMultiplier: 0.8 },
  { id: "other", label: "Other / General", rpmMultiplier: 1 },
];

/**
 * Shorts monetize very differently from long-form. These multipliers
 * reflect the well-documented Shorts vs. long-form RPM gap.
 */
export const CONTENT_TYPE_MULTIPLIERS = {
  long: 1,
  shorts: 0.08,
  mixed: 0.55,
} as const satisfies Record<string, number>;

/**
 * A minimal, hard-coded set of currency options with rough USD conversion
 * rates. Users can pick their preferred currency; this app never claims to
 * be a live FX source.
 */
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
