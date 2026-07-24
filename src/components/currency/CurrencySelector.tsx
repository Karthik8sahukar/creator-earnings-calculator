"use client";

import { useId } from "react";
import { CURRENCIES } from "@/lib/rpmData";
import {
  SUPPORTED_CURRENCY_CODES,
  useCurrency,
  type SupportedCurrencyCode,
} from "./CurrencyContext";

/**
 * Global currency selector dropdown.
 *
 * Place this in the header, footer, or settings panel. When the user
 * changes the currency, all <Money> components across the app
 * re-render with the new conversion.
 *
 * The selector only shows the SUPPORTED_CURRENCY_CODES subset (7
 * currencies) rather than the full 13-currency CURRENCIES table
 * to keep the UI clean.
 */
export function CurrencySelector({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  const id = useId();

  const options = SUPPORTED_CURRENCY_CODES.map((code) => {
    const data = CURRENCIES.find((c) => c.code === code);
    return {
      code,
      label: data ? `${data.symbol} ${data.code}` : code,
      fullLabel: data?.label ?? code,
    };
  });

  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        Currency
      </label>
      <select
        id={id}
        value={currency}
        onChange={(e) => setCurrency(e.target.value as SupportedCurrencyCode)}
        className="input text-xs px-2 py-1 w-auto min-w-[4.5rem]"
        data-testid="currency-selector"
        aria-label="Select display currency"
      >
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
