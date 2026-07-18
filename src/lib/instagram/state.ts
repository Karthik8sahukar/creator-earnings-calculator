/**
 * Instagram calculator state ⇄ URL query params.
 *
 * Design mirrors `src/lib/calculatorState.ts` for the YouTube
 * calculators:
 *
 *   • Every field validated with Zod.
 *   • Every field `.optional().catch(undefined)` — an invalid value
 *     in the URL is silently ignored, never crashes the page, never
 *     leaves the calculator in a broken state.
 *   • `encode()` only writes fields that DIFFER from defaults so
 *     shareable URLs stay short.
 *   • `decode()` returns a partial state so callers can layer
 *     context-specific defaults on top.
 */

import { z } from "zod";

import { CURRENCIES } from "../rpmData";
import {
  AFFILIATE_DEFAULTS,
  INSTAGRAM_COUNTRIES,
  INSTAGRAM_NICHES,
  SUBSCRIPTION_DEFAULTS,
} from "./config";

export interface InstagramCalculatorState {
  followers: number;
  avgPostReach: number;
  avgReelViews: number;
  avgStoryViews: number;
  engagementRate: number;
  country: string;
  niche: string;

  feedPostsPerMonth: number;
  reelsPerMonth: number;
  storiesPerMonth: number;

  enableSponsoredPosts: boolean;
  enableSponsoredReels: boolean;
  enableSponsoredStories: boolean;
  enableAffiliate: boolean;
  enableSubscriptions: boolean;

  customPostRateUsd: number;
  customReelRateUsd: number;
  customStoryRateUsd: number;

  affiliateConversionPct: number;
  affiliateAverageOrderValueUsd: number;
  affiliateCommissionPct: number;

  paidSubscribers: number;
  subscriptionPriceUsd: number;

  currency: string;
}

/**
 * Canonical defaults. Chosen to describe a plausible mid-market
 * lifestyle creator with 100k followers so a first-time visitor
 * sees non-zero numbers immediately.
 */
export const INSTAGRAM_DEFAULT_STATE: InstagramCalculatorState = Object.freeze({
  followers: 100_000,
  avgPostReach: 18_000,
  avgReelViews: 45_000,
  avgStoryViews: 6_000,
  engagementRate: 3.5,
  country: "US",
  niche: "lifestyle",

  feedPostsPerMonth: 12,
  reelsPerMonth: 12,
  storiesPerMonth: 25,

  enableSponsoredPosts: true,
  enableSponsoredReels: true,
  enableSponsoredStories: true,
  enableAffiliate: true,
  enableSubscriptions: false,

  customPostRateUsd: 0,
  customReelRateUsd: 0,
  customStoryRateUsd: 0,

  affiliateConversionPct: AFFILIATE_DEFAULTS.conversionRatePct,
  affiliateAverageOrderValueUsd: AFFILIATE_DEFAULTS.averageOrderValueUsd,
  affiliateCommissionPct: AFFILIATE_DEFAULTS.commissionPct,

  paidSubscribers: SUBSCRIPTION_DEFAULTS.paidSubscribers,
  subscriptionPriceUsd: SUBSCRIPTION_DEFAULTS.monthlyPriceUsd,

  currency: "USD",
});

const MAX_COUNT = 1_000_000_000;
const MAX_MONEY = 1_000_000_000;
const MAX_PCT = 100;

const numberField = (max: number) =>
  z.coerce.number().finite().nonnegative().max(max).optional().catch(undefined);

const percentField = z.coerce
  .number()
  .finite()
  .min(0)
  .max(MAX_PCT)
  .optional()
  .catch(undefined);

const boolField = z
  .union([z.literal("0"), z.literal("1"), z.literal("true"), z.literal("false"), z.boolean()])
  .transform((v) => (v === "1" || v === "true" || v === true ? true : false))
  .optional()
  .catch(undefined);

export const instagramStateSchema = z.object({
  followers: numberField(MAX_COUNT),
  avgPostReach: numberField(MAX_COUNT),
  avgReelViews: numberField(MAX_COUNT),
  avgStoryViews: numberField(MAX_COUNT),
  engagementRate: percentField,
  country: z
    .string()
    .refine((v) => INSTAGRAM_COUNTRIES.some((c) => c.id === v), "unknown country")
    .optional()
    .catch(undefined),
  niche: z
    .string()
    .refine((v) => INSTAGRAM_NICHES.some((n) => n.id === v), "unknown niche")
    .optional()
    .catch(undefined),

  feedPostsPerMonth: numberField(MAX_COUNT),
  reelsPerMonth: numberField(MAX_COUNT),
  storiesPerMonth: numberField(MAX_COUNT),

  enableSponsoredPosts: boolField,
  enableSponsoredReels: boolField,
  enableSponsoredStories: boolField,
  enableAffiliate: boolField,
  enableSubscriptions: boolField,

  customPostRateUsd: numberField(MAX_MONEY),
  customReelRateUsd: numberField(MAX_MONEY),
  customStoryRateUsd: numberField(MAX_MONEY),

  affiliateConversionPct: percentField,
  affiliateAverageOrderValueUsd: numberField(MAX_MONEY),
  affiliateCommissionPct: percentField,

  paidSubscribers: numberField(MAX_COUNT),
  subscriptionPriceUsd: numberField(MAX_MONEY),

  currency: z
    .string()
    .refine((v) => CURRENCIES.some((c) => c.code === v), "unknown currency")
    .optional()
    .catch(undefined),
});

/**
 * Short URL param names — kept small on purpose so shared URLs stay
 * readable. Adding a new key here MUST also update `PARAM_KEYS_INV`
 * which is trivially derived below.
 */
export const INSTAGRAM_PARAM_KEYS = {
  followers: "followers",
  avgPostReach: "reach",
  avgReelViews: "reelviews",
  avgStoryViews: "storyviews",
  engagementRate: "engagement",
  country: "country",
  niche: "niche",

  feedPostsPerMonth: "posts",
  reelsPerMonth: "reels",
  storiesPerMonth: "stories",

  enableSponsoredPosts: "eposts",
  enableSponsoredReels: "ereels",
  enableSponsoredStories: "estories",
  enableAffiliate: "eaff",
  enableSubscriptions: "esub",

  customPostRateUsd: "postrate",
  customReelRateUsd: "reelrate",
  customStoryRateUsd: "storyrate",

  affiliateConversionPct: "affconv",
  affiliateAverageOrderValueUsd: "affaov",
  affiliateCommissionPct: "affcomm",

  paidSubscribers: "subs",
  subscriptionPriceUsd: "subprice",

  currency: "currency",
} as const satisfies Record<keyof InstagramCalculatorState, string>;

/**
 * Encode a state into URLSearchParams. Only values that differ from
 * defaults are written.
 */
export function encodeInstagramState(
  state: Partial<InstagramCalculatorState>,
  base?: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(base);
  for (const key of Object.values(INSTAGRAM_PARAM_KEYS)) {
    params.delete(key);
  }

  (Object.keys(INSTAGRAM_PARAM_KEYS) as (keyof InstagramCalculatorState)[]).forEach(
    (field) => {
      const paramName = INSTAGRAM_PARAM_KEYS[field];
      const value = state[field];
      const defaultValue = INSTAGRAM_DEFAULT_STATE[field];
      if (value === undefined || value === null) return;
      if (value === defaultValue) return;
      if (typeof value === "number") {
        if (!Number.isFinite(value)) return;
        params.set(paramName, String(value));
      } else if (typeof value === "boolean") {
        params.set(paramName, value ? "1" : "0");
      } else {
        params.set(paramName, String(value));
      }
    },
  );

  return params;
}

/**
 * Decode raw URL params into a partial state. Missing/invalid values
 * are silently dropped; only fields explicitly provided AND passing
 * validation appear in the result.
 */
export function decodeInstagramState(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): Partial<InstagramCalculatorState> {
  const raw: Record<string, unknown> = {};
  const get = (key: string): string | undefined => {
    if (input instanceof URLSearchParams) return input.get(key) ?? undefined;
    const v = input[key];
    if (Array.isArray(v)) return v[0];
    return v ?? undefined;
  };

  (Object.keys(INSTAGRAM_PARAM_KEYS) as (keyof InstagramCalculatorState)[]).forEach(
    (field) => {
      const value = get(INSTAGRAM_PARAM_KEYS[field]);
      if (value !== undefined && value !== "") raw[field] = value;
    },
  );

  const parsed = instagramStateSchema.parse(raw);
  const partial: Partial<InstagramCalculatorState> = {};
  (Object.keys(parsed) as (keyof typeof parsed)[]).forEach((k) => {
    const v = parsed[k];
    if (v !== undefined) {
      (partial as Record<string, unknown>)[k] = v;
    }
  });
  return partial;
}

/**
 * Merge a partial state onto defaults, producing a fully-hydrated
 * state.
 */
export function hydrateInstagramState(
  partial: Partial<InstagramCalculatorState>,
): InstagramCalculatorState {
  return {
    ...INSTAGRAM_DEFAULT_STATE,
    ...partial,
  };
}

/**
 * Build a shareable absolute URL for the current state.
 */
export function buildInstagramShareUrl(
  origin: string,
  pathname: string,
  state: Partial<InstagramCalculatorState>,
): string {
  const params = encodeInstagramState(state);
  const search = params.toString();
  return search ? `${origin}${pathname}?${search}` : `${origin}${pathname}`;
}
