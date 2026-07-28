"use client";

import { useT } from "@/lib/t";
import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { formatCurrency, formatNumber } from "@/lib/format";
import { calculateCpm } from "@/lib/simpleCalculators";

export function CpmCalcClient() {
  const t = useT("calculators");
  const tCpm = useT("calculators.cpm");

  useEffect(() => {
    track({ name: "additional_calculator.opened", kind: "cpm" });
  }, []);
  const [revenue, setRevenue] = useState<number>(0);
  const [impressions, setImpressions] = useState<number>(0);
  const [currency, setCurrency] = useState<"USD" | "EUR" | "GBP">("USD");

  const result = useMemo(
    () =>
      calculateCpm({
        grossAdRevenue: revenue,
        monetizedImpressions: impressions,
      }),
    [revenue, impressions],
  );

  return (
    <section className="card p-6 sm:p-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="label">{t("shared.grossAdRevenue")}</span>
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
              aria-label={t("shared.grossAdRevenueAria")}
            />
          </div>
        </label>
        <label className="block">
          <span className="label">{t("shared.monetizedImpressions")}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={impressions || ""}
            onChange={(e) => setImpressions(Number(e.target.value) || 0)}
            className="input mt-1"
            aria-label={t("shared.monetizedImpressionsAria")}
          />
        </label>
        <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-4">
          <p className="text-xs uppercase tracking-wide text-brand-100">
            {tCpm("resultLabel")}
          </p>
          {result.valid ? (
            <p className="mt-1 text-3xl font-bold" aria-live="polite">
              {formatCurrency(result.cpm, currency)}
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
        <code className="font-mono">{tCpm("formulaText")}</code>
        {result.valid && (
          <>
            <br />
            <span>
              {formatCurrency(revenue, currency)} ÷ {formatNumber(impressions)} ×
              1000 = {formatCurrency(result.cpm, currency)}
            </span>
          </>
        )}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {tCpm("notRpmNotice")}
      </div>
    </section>
  );
}
