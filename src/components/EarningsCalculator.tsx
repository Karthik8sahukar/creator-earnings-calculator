"use client";

import { useMemo, useState } from "react";
import { DollarIcon } from "./icons";
import { calculateEarnings } from "@/lib/earnings";
import { formatCurrency, formatCompact, formatNumber } from "@/lib/format";
import {
  COUNTRIES,
  CURRENCIES,
  NICHES,
  findCurrency,
} from "@/lib/rpmData";
import type { EarningsInput } from "@/lib/schemas";
import type { PerformanceAnalysis } from "@/types/youtube";

interface Props {
  analysis: PerformanceAnalysis;
  defaultCountry?: string;
}

type Estimate = "low" | "expected" | "high";

export function EarningsCalculator({ analysis, defaultCountry }: Props) {
  const initialViews = analysis.monthlyViewEstimate.expected || 0;
  const defaultContentType: "long" | "shorts" | "mixed" =
    analysis.shortsPercentage >= 70
      ? "shorts"
      : analysis.shortsPercentage >= 30
        ? "mixed"
        : "long";

  const [monthlyViews, setMonthlyViews] = useState<number>(initialViews);
  const [estimateBand, setEstimateBand] = useState<Estimate>("expected");
  const [country, setCountry] = useState<string>(
    resolveCountry(defaultCountry),
  );
  const [niche, setNiche] = useState<string>("other");
  const [contentType, setContentType] = useState<"long" | "shorts" | "mixed">(
    defaultContentType,
  );
  const [rpmOverride, setRpmOverride] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [monetizedPercentage, setMonetizedPercentage] = useState<number>(90);
  const [sponsorship, setSponsorship] = useState<number>(0);
  const [affiliate, setAffiliate] = useState<number>(0);
  const [membership, setMembership] = useState<number>(0);

  const input: EarningsInput = useMemo(
    () => ({
      monthlyViews,
      country,
      niche,
      contentType,
      rpm: rpmOverride ? Number(rpmOverride) : undefined,
      currency,
      monetizedPercentage,
      sponsorship,
      affiliate,
      membership,
    }),
    [
      monthlyViews,
      country,
      niche,
      contentType,
      rpmOverride,
      currency,
      monetizedPercentage,
      sponsorship,
      affiliate,
      membership,
    ],
  );

  const earnings = useMemo(() => calculateEarnings(input), [input]);
  const currencyMeta = findCurrency(currency);
  const active = earnings[estimateBand];

  function applyBand(band: Estimate) {
    setEstimateBand(band);
    setMonthlyViews(analysis.monthlyViewEstimate[band] || 0);
  }

  return (
    <section aria-labelledby="earn-title" className="card p-6 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <DollarIcon className="text-brand-600" />
          <h2 id="earn-title" className="text-lg font-semibold text-slate-900">
            Earnings estimator
          </h2>
        </div>
        <div
          role="tablist"
          aria-label="Estimate band"
          className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-sm"
        >
          {(["low", "expected", "high"] as const).map((band) => (
            <button
              key={band}
              type="button"
              role="tab"
              aria-selected={estimateBand === band}
              onClick={() => applyBand(band)}
              className={`px-3 py-1.5 rounded-md capitalize transition ${
                estimateBand === band
                  ? "bg-white shadow-sm text-slate-900 font-medium"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {band}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <FieldGroup>
            <NumberField
              label="Monthly views"
              value={monthlyViews}
              onChange={(v) => setMonthlyViews(typeof v === "number" ? v : 0)}
              hint={`Auto-estimated: ${formatCompact(initialViews)} (${formatNumber(initialViews)})`}
              min={0}
              step={1000}
            />
            <SelectField
              label="Content type"
              value={contentType}
              onChange={(v) => setContentType(v as "long" | "shorts" | "mixed")}
              options={[
                { value: "long", label: "Long-form" },
                { value: "shorts", label: "Shorts" },
                { value: "mixed", label: "Mixed" },
              ]}
            />
          </FieldGroup>

          <FieldGroup>
            <SelectField
              label="Country / audience"
              value={country}
              onChange={setCountry}
              options={COUNTRIES.map((c) => ({ value: c.id, label: c.label }))}
            />
            <SelectField
              label="Niche"
              value={niche}
              onChange={setNiche}
              options={NICHES.map((n) => ({ value: n.id, label: n.label }))}
            />
          </FieldGroup>

          <FieldGroup>
            <NumberField
              label="RPM override (USD)"
              value={rpmOverride === "" ? "" : Number(rpmOverride)}
              onChange={(v) => setRpmOverride(v === "" ? "" : String(v))}
              placeholder="Auto"
              hint="Leave blank to auto-derive from country + niche"
              min={0}
              step={0.1}
              allowEmpty
            />
            <SelectField
              label="Display currency"
              value={currency}
              onChange={setCurrency}
              options={CURRENCIES.map((c) => ({
                value: c.code,
                label: `${c.code} — ${c.label}`,
              }))}
            />
          </FieldGroup>

          <FieldGroup>
            <SliderField
              label="Monetized views %"
              value={monetizedPercentage}
              onChange={setMonetizedPercentage}
              min={0}
              max={100}
              step={1}
              suffix="%"
            />
          </FieldGroup>

          <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <legend className="label mb-2 col-span-full">
              Additional monthly income (in {currencyMeta.code})
            </legend>
            <NumberField
              label="Sponsorships"
              value={sponsorship}
              onChange={(v) => setSponsorship(typeof v === "number" ? v : 0)}
              min={0}
              step={50}
            />
            <NumberField
              label="Affiliate"
              value={affiliate}
              onChange={(v) => setAffiliate(typeof v === "number" ? v : 0)}
              min={0}
              step={50}
            />
            <NumberField
              label="Memberships"
              value={membership}
              onChange={(v) => setMembership(typeof v === "number" ? v : 0)}
              min={0}
              step={50}
            />
          </fieldset>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-6 shadow-pop">
            <p className="text-xs uppercase tracking-wide text-brand-100">
              {estimateBand} monthly total
            </p>
            <p className="mt-1 text-4xl font-bold tracking-tight">
              {formatCurrency(active.monthly, currency)}
            </p>
            <p className="text-brand-100 text-sm mt-1">
              at {formatCompact(monthlyViews)} monthly views
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <Kpi label="Daily" value={formatCurrency(active.daily, currency)} />
              <Kpi label="Weekly" value={formatCurrency(active.weekly, currency)} />
              <Kpi label="Monthly" value={formatCurrency(active.monthly, currency)} />
              <Kpi label="Annual" value={formatCurrency(active.annual, currency)} />
            </dl>
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4 text-sm">
            <h3 className="font-medium text-slate-900">Breakdown</h3>
            <ul className="mt-3 space-y-2 text-slate-600">
              <BreakdownRow
                label="Ad revenue (monthly)"
                value={formatCurrency(earnings.monthlyAdRevenue.monthly, currency)}
              />
              <BreakdownRow
                label="Sponsorships"
                value={formatCurrency(earnings.extras.sponsorship, currency)}
              />
              <BreakdownRow
                label="Affiliate"
                value={formatCurrency(earnings.extras.affiliate, currency)}
              />
              <BreakdownRow
                label="Memberships"
                value={formatCurrency(earnings.extras.membership, currency)}
              />
            </ul>
            <p className="mt-4 text-xs text-slate-500 leading-relaxed">
              Estimates only. Actual earnings depend on many factors we can't
              observe — fill rate, seasonality, ad category mix, YouTube share,
              refunds, and taxes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function resolveCountry(country: string | undefined): string {
  if (!country) return "US";
  const match = COUNTRIES.find((c) => c.id === country);
  return match ? match.id : "OTHER";
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  hint,
  allowEmpty = false,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  hint?: string;
  allowEmpty?: boolean;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value === "" ? "" : value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") {
            onChange(allowEmpty ? "" : 0);
          } else {
            const n = Number(v);
            onChange(Number.isFinite(n) ? n : 0);
          }
        }}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="input mt-1"
      />
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

function SelectField({
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

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}) {
  return (
    <label className="block col-span-full">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className="text-sm font-semibold text-slate-800">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="mt-2 w-full accent-brand-600"
      />
    </label>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 backdrop-blur px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-brand-100">
        {label}
      </p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </li>
  );
}
