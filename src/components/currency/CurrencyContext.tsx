"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CURRENCIES, type Currency } from "@/lib/rpmData";

// ─── Supported currencies for the selector ──────────────────────────

/**
 * The subset of currencies shown in the global selector.
 * These are the most relevant to the platform's audience.
 */
export const SUPPORTED_CURRENCY_CODES = [
  "USD",
  "INR",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCY_CODES)[number];

// ─── Context shape ──────────────────────────────────────────────────

interface CurrencyContextValue {
  /** The currently selected currency code. */
  currency: SupportedCurrencyCode;
  /** The full Currency object for the active currency. */
  currencyData: Currency;
  /** Change the active currency. Persists to localStorage. */
  setCurrency: (code: SupportedCurrencyCode) => void;
  /** Convert a USD amount to the active currency. */
  convert: (usdAmount: number) => number;
  /** Format a USD amount in the active currency (converted + formatted). */
  formatMoney: (usdAmount: number, opts?: { compact?: boolean }) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

// ─── Storage key ────────────────────────────────────────────────────

const STORAGE_KEY = "BEHUMLER_CURRENCY";

// ─── Provider ───────────────────────────────────────────────────────

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrencyCode>("USD");

  // Hydrate from localStorage on mount (client-only).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (
        stored &&
        SUPPORTED_CURRENCY_CODES.includes(stored as SupportedCurrencyCode)
      ) {
        setCurrencyState(stored as SupportedCurrencyCode);
      }
    } catch {
      // localStorage unavailable — keep default.
    }
  }, []);

  const setCurrency = useCallback((code: SupportedCurrencyCode) => {
    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Silently fail if localStorage unavailable.
    }
  }, []);

  const currencyData = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  const convert = useCallback(
    (usdAmount: number): number => {
      if (!Number.isFinite(usdAmount)) return 0;
      return usdAmount * currencyData.usdRate;
    },
    [currencyData],
  );

  const formatMoney = useCallback(
    (usdAmount: number, opts: { compact?: boolean } = {}): string => {
      const converted = convert(usdAmount);
      const safe = Number.isFinite(converted) ? converted : 0;
      try {
        return new Intl.NumberFormat("en", {
          style: "currency",
          currency: currencyData.code,
          notation: opts.compact ? "compact" : "standard",
          maximumFractionDigits: opts.compact ? 1 : 2,
        }).format(safe);
      } catch {
        return `${currencyData.symbol}${safe.toFixed(2)}`;
      }
    },
    [convert, currencyData],
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, currencyData, setCurrency, convert, formatMoney }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────

/**
 * Access the global currency context.
 *
 * Must be called inside a <CurrencyProvider>. If called outside
 * (e.g. in a server component that accidentally imports it), returns
 * a safe USD-only fallback rather than throwing — so the page still
 * renders during SSR with USD values that hydrate correctly.
 */
export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (ctx) return ctx;

  // Fallback for SSR or when called outside provider — USD only.
  const fallbackCurrency = CURRENCIES[0];
  return {
    currency: "USD",
    currencyData: fallbackCurrency,
    setCurrency: () => {},
    convert: (usd: number) => usd,
    formatMoney: (usd: number, opts?: { compact?: boolean }) => {
      const safe = Number.isFinite(usd) ? usd : 0;
      try {
        return new Intl.NumberFormat("en", {
          style: "currency",
          currency: "USD",
          notation: opts?.compact ? "compact" : "standard",
          maximumFractionDigits: opts?.compact ? 1 : 2,
        }).format(safe);
      } catch {
        return `$${safe.toFixed(2)}`;
      }
    },
  };
}
