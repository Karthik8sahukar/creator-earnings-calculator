"use client";

import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { calculateEarnings } from "@/lib/earnings";
import { formatCurrency, formatCompact } from "@/lib/format";
import { COUNTRIES, CURRENCIES, NICHES } from "@/lib/rpmData";

export function ShortsCalcClient() {
  useEffect(() => {
    track({ name: "additional_calculator.opened", kind: "shorts" });
  }, []);
  const [monthlyViews, setMonthlyViews] = useState<number>(1_000_000);
  const [country, setCountry] = useState("US");
  const [niche, setNiche] = useState("other");
  const [customRpm, setCustomRpm] = useState<number | "">("");
  const [sponsorship, setSponsorship] = useState<number>(0);
  const [affiliate, setAffiliate] = useState<number>(0);
  const [currency, setCurrency] = useState("USD");

  const earnings = useMemo(
    () =>
      calculateEarnings({
        monthlyViews,
        country,
        niche,
        contentType: "shorts",
        currency,
        monetizedPercentage: 100,
        sponsorship,
        affiliate,
        membership: 0,
        rpm: typeof customRpm === "number" && customRpm > 0 ? customRpm : undefined,
      }),
    [monthlyViews, country, niche, currency, sponsorship, affiliate, customRpm],
  );

  return (
    <section className="card p-6 sm:p-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NumField
          label="Monthly Shorts views"
          value={monthlyViews}
          onChange={setMonthlyViews}
          step={10_000}
        />
        <Select
          label="Audience country"
          value={country}
          onChange={setCountry}
          options={COUNTRIES.map((c) => ({ value: c.id, label: c.label }))}
        />
        <Select
          label="Niche"
          value={niche}
          onChange={setNiche}
          options={NICHES.map((n) => ({ value: n.id, label: n.label }))}
        />
        <label className="block">
          <span className="label">Custom Shorts RPM (USD)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={customRpm === "" ? "" : customRpm}
            placeholder="Auto"
            onChange={(e) =>
              setCustomRpm(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="input mt-1"
            aria-label="Custom Shorts RPM"
          />
        </label>
        <NumField
          label="Sponsorship income (monthly)"
          value={sponsorship}
          onChange={setSponsorship}
          step={50}
        />
        <NumField
          label="Affiliate income (monthly)"
          value={affiliate}
          onChange={setAffiliate}
          step={50}
        />
        <Select
          label="Currency"
          value={currency}
          onChange={setCurrency}
          options={CURRENCIES.map((c) => ({
            value: c.code,
            label: `${c.code} — ${c.label}`,
          }))}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Band
          label="Conservative"
          value={earnings.low.monthly}
          currency={currency}
        />
        <Band
          label="Expected monthly"
          value={earnings.expected.monthly}
          currency={currency}
          highlight
        />
        <Band
          label="Optimistic"
          value={earnings.high.monthly}
          currency={currency}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <Row
          label="Daily (expected)"
          value={formatCurrency(earnings.expected.daily, currency)}
        />
        <Row
          label="Monthly (expected)"
          value={formatCurrency(earnings.expected.monthly, currency)}
        />
        <Row
          label="Annual (expected)"
          value={formatCurrency(earnings.expected.annual, currency)}
        />
      </div>

      <p className="text-xs text-slate-500">
        Estimated for {formatCompact(monthlyViews)} monthly Shorts views. Shorts
        default RPM is significantly lower than long-form.
      </p>
    </section>
  );
}

function NumField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={step}
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="input mt-1"
        aria-label={label}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input mt-1"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Band({
  label,
  value,
  currency,
  highlight,
}: {
  label: string;
  value: number;
  currency: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight
          ? "bg-gradient-to-br from-brand-600 to-brand-800 text-white border-brand-600"
          : "bg-slate-50 text-slate-800 border-slate-100"
      }`}
    >
      <p
        className={`text-[10px] uppercase tracking-wide ${
          highlight ? "text-brand-100" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p className="text-2xl font-bold">{formatCurrency(value, currency)}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
