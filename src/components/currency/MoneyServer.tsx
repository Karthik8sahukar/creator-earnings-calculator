import { CURRENCIES } from "@/lib/rpmData";

/**
 * Server-side money formatter.
 *
 * Server components cannot use React context, so they always render
 * in USD. The client-side <Money> component handles conversion for
 * interactive pages. For static/server pages where the value is
 * already computed in USD, use this helper.
 *
 * This is intentionally a plain function, not a component — it returns
 * a formatted string suitable for use in:
 *   - JSON-LD structured data
 *   - Meta descriptions
 *   - Open Graph tags
 *   - Server component text
 */
export function formatMoneyServer(
  usdAmount: number,
  opts: { compact?: boolean; currency?: string } = {},
): string {
  const currencyCode = opts.currency ?? "USD";
  const currencyData = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];
  const converted = usdAmount * currencyData.usdRate;
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
}
