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
  /**
   * Which scenario (band) the user is looking at. Purely a UI selection
   * — the numeric earnings for all three bands are always computed;
   * this just decides which one the headline highlights.
   *
   * Default is always `"expected"`. Never allow an empty/undefined
   * value at runtime.
   */
  estimateBand: EstimateBand;
}

export type EstimateBand = "low" | "expected" | "high";

/**
 * Single source of truth for the default scenario. Referenced from the
 * default state and used by the UI as the fallback on reset and on any
 * missing URL parameter.
 */
export const DEFAULT_SCENARIO: EstimateBand = "expected";

export const DEFAULT_CALCULATOR_STATE: CalculatorState = {
  channelId: null,
  monthlyViews: 0,
  country: "US",
  niche: "other",
  contentType: "long",
  rpmMode: "auto",
  customRpm: 0,
  currency: "USD",
  // Default matches `REFERENCE_MONETIZATION_PCT` in rpmData.ts. At this
  // value the earnings formula collapses to `views ÷ 1000 × RPM` —
  // YouTube's own canonical RPM formula. Users can drag this slider to
  // model channels that monetize better (up to 100%) or worse (e.g.
  // COPPA kids channels near 60%) than the industry-typical rate.
  monetizedPercentage: 90,
  sponsorship: 0,
  affiliate: 0,
  membership: 0,
  other: 0,
  estimateBand: DEFAULT_SCENARIO,
};

const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{20,40}$/;
const MAX_MONEY = 1_000_000_000; // sanity cap
const MAX_VIEWS = 1_000_000_000_000;

/**
 * Coerce raw URL params through Zod. Every field is `.optional()` and
 * every `.catch()` returns `undefined` — the decoder then drops
 * undefined keys so the caller can distinguish "URL did not provide
 * this value" from "URL provided the default value". This is what lets
 * the earnings calculator seed monthly views from the channel analysis
 * whenever no `mv` param was in the URL.
 */
export const calculatorStateSchema = z.object({
  channelId: z
    .string()
    .trim()
    .regex(CHANNEL_ID_RE)
    .optional()
    .catch(undefined),
  monthlyViews: z.coerce
    .number()
    .finite()
    .nonnegative()
    .max(MAX_VIEWS)
    .optional()
    .catch(undefined),
  country: z
    .string()
    .refine((v) => COUNTRIES.some((c) => c.id === v), "unknown country")
    .optional()
    .catch(undefined),
  niche: z
    .string()
    .refine((v) => NICHES.some((n) => n.id === v), "unknown niche")
    .optional()
    .catch(undefined),
  contentType: z
    .enum(["long", "shorts", "mixed"])
    .optional()
    .catch(undefined),
  rpmMode: z
    .enum(["auto", "custom"])
    .optional()
    .catch(undefined),
  customRpm: z.coerce
    .number()
    .finite()
    .nonnegative()
    .max(200)
    .optional()
    .catch(undefined),
  currency: z
    .string()
    .refine((v) => CURRENCIES.some((c) => c.code === v), "unknown currency")
    .optional()
    .catch(undefined),
  monetizedPercentage: z.coerce
    .number()
    .finite()
    .min(0)
    .max(100)
    .optional()
    .catch(undefined),
  sponsorship: z.coerce
    .number()
    .finite()
    .nonnegative()
    .max(MAX_MONEY)
    .optional()
    .catch(undefined),
  affiliate: z.coerce
    .number()
    .finite()
    .nonnegative()
    .max(MAX_MONEY)
    .optional()
    .catch(undefined),
  membership: z.coerce
    .number()
    .finite()
    .nonnegative()
    .max(MAX_MONEY)
    .optional()
    .catch(undefined),
  other: z.coerce
    .number()
    .finite()
    .nonnegative()
    .max(MAX_MONEY)
    .optional()
    .catch(undefined),
  estimateBand: z
    .enum(["low", "expected", "high"])
    .optional()
    .catch(undefined),
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
  estimateBand: "eb",
} as const satisfies Record<keyof CalculatorState, string>;

/**
 * Encode calculator state into URLSearchParams. Only values that differ
 * from defaults are included — this keeps shareable URLs short and
 * readable.
 *
 * Accepts a `Partial<CalculatorState>` so callers that only have some
 * fields (e.g. after decoding a URL) don't have to fill defaults first.
 */
export function encodeCalculatorState(
  state: Partial<CalculatorState>,
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
      if (!Number.isFinite(value)) return;
      params.set(key, String(value));
    } else {
      params.set(key, String(value));
    }
  });

  return params;
}

/**
 * Decode a URLSearchParams (or plain record) into a partial calculator
 * state. Only fields explicitly provided by the URL — and passing
 * validation — appear in the result. Missing / invalid fields are
 * intentionally *absent*, so callers can layer them under their own
 * context-specific defaults (e.g. a channel's auto-estimated monthly
 * views).
 */
export function decodeCalculatorState(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): Partial<CalculatorState> {
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
  // Strip undefined keys so consumers can spread the partial safely.
  const partial: Partial<CalculatorState> = {};
  (Object.keys(parsed) as (keyof typeof parsed)[]).forEach((k) => {
    const v = parsed[k];
    if (v !== undefined) {
      (partial as Record<string, unknown>)[k] = v;
    }
  });
  return partial;
}

/**
 * Fill any missing keys of a partial state with the canonical defaults.
 * Useful for callers that need a fully-hydrated `CalculatorState`.
 */
export function hydrateCalculatorState(
  partial: Partial<CalculatorState>,
): CalculatorState {
  return {
    ...DEFAULT_CALCULATOR_STATE,
    ...partial,
    channelId: partial.channelId ?? DEFAULT_CALCULATOR_STATE.channelId,
    estimateBand: partial.estimateBand ?? DEFAULT_SCENARIO,
  };
}

/**
 * Adapter: convert calculator state into the pure earnings input shape.
 * Accepts either a full state or a partial (missing fields fall back
 * to defaults via `hydrateCalculatorState`).
 */
export function toEarningsInput(
  state: Partial<CalculatorState>,
): EarningsInput {
  const s = hydrateCalculatorState(state);
  return {
    monthlyViews: clamp(s.monthlyViews, 0, MAX_VIEWS),
    country: s.country,
    niche: s.niche,
    contentType: s.contentType,
    rpm:
      s.rpmMode === "custom" && s.customRpm > 0 ? s.customRpm : undefined,
    currency: s.currency,
    monetizedPercentage: clamp(s.monetizedPercentage, 0, 100),
    sponsorship:
      clamp(s.sponsorship, 0, MAX_MONEY) + clamp(s.other, 0, MAX_MONEY),
    affiliate: clamp(s.affiliate, 0, MAX_MONEY),
    membership: clamp(s.membership, 0, MAX_MONEY),
  };
}

/**
 * Build a shareable absolute URL for the current calculator state.
 */
export function buildShareUrl(
  origin: string,
  pathname: string,
  state: Partial<CalculatorState>,
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
