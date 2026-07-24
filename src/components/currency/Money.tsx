"use client";

import { useCurrency } from "./CurrencyContext";

/**
 * Props for the <Money> component.
 *
 * Every monetary value in the app should pass through this component
 * instead of calling formatCurrency directly. This ensures:
 *   - Consistent formatting across the entire platform
 *   - Automatic currency conversion based on user preference
 *   - No hardcoded "$" symbols
 *   - SSR-safe rendering (hydrates with USD, then updates on client)
 */
interface MoneyProps {
  /** The amount in USD. Conversion happens automatically. */
  amount: number;
  /** Use compact notation (e.g., "$12.3K" instead of "$12,340"). */
  compact?: boolean;
  /** Additional CSS class for the wrapper span. */
  className?: string;
  /** Render as a specific HTML element. Default: span. */
  as?: "span" | "p" | "dd" | "td";
}

/**
 * Renders a monetary value in the user's selected currency.
 *
 * Usage:
 *   <Money amount={12340} />            → "$12,340.00" (USD default)
 *   <Money amount={12340} compact />    → "$12.3K"
 *
 * When the user switches to INR:
 *   <Money amount={12340} />            → "₹10,24,220.00"
 *   <Money amount={12340} compact />    → "₹10.2L"
 *
 * Server-side: renders in USD (the default). Client hydration applies
 * the user's stored preference without layout shift because only the
 * text content changes (same element structure).
 */
export function Money({ amount, compact = false, className, as: Tag = "span" }: MoneyProps) {
  const { formatMoney } = useCurrency();
  const formatted = formatMoney(amount, { compact });

  return <Tag className={className}>{formatted}</Tag>;
}

/**
 * Non-component utility for formatting money in contexts where JSX
 * is inconvenient (e.g., inside template strings for aria-labels,
 * title attributes, or chart tooltips).
 *
 * Must be called inside a component that has access to useCurrency.
 * For server components, use the standalone `formatMoneyServer` instead.
 */
export function useFormatMoney() {
  const { formatMoney, convert, currency, currencyData } = useCurrency();
  return { formatMoney, convert, currency, currencyData };
}
