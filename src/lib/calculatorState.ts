import { z } from "zod";

import { COUNTRIES, CURRENCIES, NICHES } from "./rpmData";
import type { EarningsInput } from "./schemas";

/**
 * Canonical calculator state — the single source of truth that drives
 * the earnings estimator and its shareable URL.
 *
 * Every field must be:
 *   - Round-trippable through URL query params
 *   - Safe when the value is missing or malformed (defaults kick in)
 *   - Public (never encode PII into the URL)
 */
export interface CalculatorState {
  channelId: string | null;
  monthlyViews: number;
  country: string;
  niche: string;
  contentType: "long" | "shorts" | "mixed";
  rpmMode: "auto" | "custom";
  customRpm: number;
  currency: string;
  monetizedPercentage: number;
  sponsorship: number;
  affiliate: number;
  membership: number;
  other: number;
}

export const DEFAULT_CALCULATOR_STATE: CalculatorState = {
  channelId: null,
  monthlyViews: 0,
  country: "US",
  niche: "other",
  contentType: "long",
  rpmMode: "auto",
  customRpm: 0,
  currency: "USD",
  monetizedPercentage: 90,
  sponsorship: 0,
  affiliate: 0,
  membership: 0,
  other: 0,
};

const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{20,40}$/;
const MAX_MONEY = 1_000_000_000; // sanity cap
const MAX_VIEWS = 1_000_000_000_000;

/**
 * Coerce raw URL params through Zod. Missing / invalid values fall back
 * to defaults rather than throw — a shareable URL should never break a
 * user's session.
 */
export const calculatorStateSchema = z.object({
  channelId: z
    .string()
    .trim()
    .regex(CHANNEL_ID_RE)
    .nullable()
    .optional()
    .catch(null)
    .transform((v) => v ?? null),
  monthlyViews: z.coerce
    .number()
    .finite()
    .nonnegative()
    .max(MAX_VIEWS)
    .catch(DEFAULT_CALCULATOR_STATE.monthlyViews),
  country: z
    .string()
    .refine((v) => COUNTRIES.some((c) => c.id === v), "unknown country")
    .catch(DEFAULT_CALCULATOR_STATE.country),
  niche: z
    .string()
    .refine((v) => NICHES.some((n) => n.id === v), "unknown niche")
    .catch(DEFAULT_CALCULATOR_STATE.niche),
  contentType: z
    .enum(["long", "shorts", "mixed"])
    .catch(DEFAULT_CALCULATOR_STATE.contentType),
  rpmMode: z
    .enum(["auto", "custom"])
    .catch(DEFAULT_CALCULATOR_STATE.rpmMode),
  customRpm: z.coerce
    .number()
    .finite()
    .nonnegative()
    .max(200)
    .catch(DEFAULT_CALCULATOR_STATE.customRpm),
  currency: z
    .string()
    .refine((v) => CURRENCIES.some((c) => c.code === v), "unknown currency")
    .catch(DEFAULT_CALCULATOR_STATE.currency),
  monetizedPercentage: z.coerce
    .number()
    .finite()
    .min(0)
    .max(100)
    .catch(DEFAULT_CALCULATOR_STATE.monetizedPercentage),
  sponsorship: z.coerce
    .number()
    .finite()
    .nonnegative()
    .max(MAX_MONEY)
    .catch(0),
  affiliate: z.coerce.number().finite().nonnegative().max(MAX_MONEY).catch(0),
  membership: z.coerce.number().finite().nonnegative().max(MAX_MONEY).catch(0),
  other: z.coerce.number().finite().nonnegative().max(MAX_MONEY).catch(0),
});

/**
 * URL param name map. Kept short to keep shareable URLs compact.
 */
const PARAM_KEYS = {
  channelId: "cid",
  monthlyViews: "mv",
  country: "c",
  niche: "n",
  contentType: "ct",
  rpmMode: "rm",
  customRpm: "rpm",
  currency: "cur",
  monetizedPercentage: "mp",
  sponsorship: "sp",
  affiliate: "af",
  membership: "mb",
  other: "ot",
} as const satisfies Record<keyof CalculatorState, string>;

/**
 * Encode calculator state into URLSearchParams. Only values that differ
 * from defaults are included — this keeps shareable URLs short and
 * readable.
 */
export function encodeCalculatorState(
  state: CalculatorState,
  base?: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(base);
  // Wipe existing calc keys so we don't stack stale values
  for (const key of Object.values(PARAM_KEYS)) params.delete(key);

  (Object.keys(PARAM_KEYS) as (keyof CalculatorState)[]).forEach((field) => {
    const key = PARAM_KEYS[field];
    const value = state[field];
    const defaultValue = DEFAULT_CALCULATOR_STATE[field];
    if (value === null || value === undefined) return;
    if (value === defaultValue) return;
    if (typeof value === "number") {
      // Skip 0s that equal defaults (already handled) but also nudge
      // NaN/Infinity out entirely.
      if (!Number.isFinite(value)) return;
      params.set(key, String(value));
    } else {
      params.set(key, String(value));
    }
  });

  return params;
}

/**
 * Decode a URLSearchParams (or plain record) back into a fully-populated
 * calculator state. Unknown fields are ignored, invalid values fall back
 * to defaults.
 */
export function decodeCalculatorState(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): CalculatorState {
  const raw: Record<string, unknown> = {};
  const get = (key: string): string | undefined => {
    if (input instanceof URLSearchParams) return input.get(key) ?? undefined;
    const v = input[key];
    if (Array.isArray(v)) return v[0];
    return v ?? undefined;
  };

  (Object.keys(PARAM_KEYS) as (keyof CalculatorState)[]).forEach((field) => {
    const value = get(PARAM_KEYS[field]);
    if (value !== undefined && value !== "") raw[field] = value;
  });

  const parsed = calculatorStateSchema.parse(raw);
  return {
    ...DEFAULT_CALCULATOR_STATE,
    ...parsed,
    channelId: parsed.channelId ?? null,
  };
}

/**
 * Adapter: convert calculator state into the pure earnings input shape.
 */
export function toEarningsInput(state: CalculatorState): EarningsInput {
  return {
    monthlyViews: clamp(state.monthlyViews, 0, MAX_VIEWS),
    country: state.country,
    niche: state.niche,
    contentType: state.contentType,
    rpm:
      state.rpmMode === "custom" && state.customRpm > 0
        ? state.customRpm
        : undefined,
    currency: state.currency,
    monetizedPercentage: clamp(state.monetizedPercentage, 0, 100),
    sponsorship:
      clamp(state.sponsorship, 0, MAX_MONEY) +
      clamp(state.other, 0, MAX_MONEY), // "other" folds into sponsorships bucket for the pure engine
    affiliate: clamp(state.affiliate, 0, MAX_MONEY),
    membership: clamp(state.membership, 0, MAX_MONEY),
  };
}

/**
 * Build a shareable absolute URL for the current calculator state.
 */
export function buildShareUrl(
  origin: string,
  pathname: string,
  state: CalculatorState,
): string {
  const params = encodeCalculatorState(state);
  const search = params.toString();
  return search ? `${origin}${pathname}?${search}` : `${origin}${pathname}`;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export const CALCULATOR_PARAM_KEYS = PARAM_KEYS;
