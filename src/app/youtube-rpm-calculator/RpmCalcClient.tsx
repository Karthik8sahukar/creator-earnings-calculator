"use client";

import { useT } from "@/lib/t";
import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { formatCurrency, formatNumber } from "@/lib/format";
import { calculateRpm } from "@/lib/simpleCalculators";

export function RpmCalcClient() {
  const t = useT("calculators");
  const tRpm = useTranslations("calculators.rpm");

  useEffect(() => {
    track({ name: "additional_calculator.opened", kind: "rpm" });
  }, []);
  const [revenue, setRevenue] = useState<number>(0);
  const [views, setViews] = useState<number>(0);
  const [currency, setCurrency] = useState<"USD" | "EUR" | "GBP">("USD");

  const result = useMemo(
    () => calculateRpm({ revenue, totalViews: views }),
    [revenue, views],
  );

  return (
    <section className="card p-6 sm:p-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="label">{t("shared.revenue")}</span>
          <div className="mt-1 flex items-stretch gap-2">
            <select
              aria-label={t("shared.currencyAria")}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as typeof currency)}
              className="input w-24"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={revenue || ""}
              onChange={(e) => setRevenue(Number(e.target.value) || 0)}
              className="input flex-1"
              aria-label={t("shared.revenueAria")}
            />
          </div>
        </label>
        <label className="block">
          <span className="label">{t("shared.totalViews")}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={views || ""}
            onChange={(e) => setViews(Number(e.target.value) || 0)}
            className="input mt-1"
            aria-label={t("shared.totalViewsAria")}
          />
        </label>
        <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-4">
          <p className="text-xs uppercase tracking-wide text-brand-100">
            {tRpm("resultLabel")}
          </p>
          {result.valid ? (
            <p className="mt-1 text-3xl font-bold" aria-live="polite">
              {formatCurrency(result.rpm, currency)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-brand-100" aria-live="polite">
              {result.reason}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-600">
        <strong className="text-slate-900">{t("shared.formula")}</strong>{" "}
        <code className="font-mono">{tRpm("formulaText")}</code>
        {result.valid && (
          <>
            <br />
            <span>
              {formatCurrency(revenue, currency)} ÷ {formatNumber(views)} × 1000
              = {formatCurrency(result.rpm, currency)}
            </span>
          </>
        )}
      </div>
    </section>
  );
}
