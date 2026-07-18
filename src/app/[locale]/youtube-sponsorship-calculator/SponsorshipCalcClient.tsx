"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import { findCountry, findNiche, NICHES, COUNTRIES, CURRENCIES } from "@/lib/rpmData";
import { calculateSponsorship } from "@/lib/simpleCalculators";

export function SponsorshipCalcClient() {
  const tShared = useTranslations("calculators.shared");
  const t = useTranslations("calculators.sponsorship");

  useEffect(() => {
    track({ name: "additional_calculator.opened", kind: "sponsorship" });
  }, []);
  const [subscribers, setSubscribers] = useState<number>(100_000);
  const [averageViews, setAverageViews] = useState<number>(50_000);
  const [engagement, setEngagement] = useState<number>(5);
  const [niche, setNiche] = useState("other");
  const [country, setCountry] = useState("US");
  const [deliverable, setDeliverable] = useState<
    "dedicated" | "integration" | "shortsMention" | "productPlacement"
  >("integration");
  const [usageRights, setUsageRights] = useState<
    "standard" | "extended" | "perpetual"
  >("standard");
  const [exclusivity, setExclusivity] = useState<"none" | "partial" | "full">(
    "none",
  );
  const [videoCount, setVideoCount] = useState<number>(1);
  const [currency, setCurrency] = useState("USD");

  const result = useMemo(() => {
    const nicheDef = findNiche(niche);
    const countryDef = findCountry(country);
    const us = findCountry("US");
    const countryMultiplier = countryDef.baseRpm / us.baseRpm;
    return calculateSponsorship({
      subscribers,
      averageViews,
      engagementRate: engagement,
      nicheMultiplier: nicheDef.rpmMultiplier,
      countryMultiplier,
      deliverable,
      usageRights,
      exclusivity,
      videoCount,
    });
  }, [
    subscribers,
    averageViews,
    engagement,
    niche,
    country,
    deliverable,
    usageRights,
    exclusivity,
    videoCount,
  ]);

  return (
    <section className="card p-6 sm:p-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NumField
          label={t("fields.subscribers")}
          value={subscribers}
          onChange={setSubscribers}
          step={1000}
        />
        <NumField
          label={t("fields.averageViews")}
          value={averageViews}
          onChange={setAverageViews}
          step={1000}
        />
        <NumField
          label={t("fields.engagementRate")}
          value={engagement}
          onChange={setEngagement}
          step={0.1}
          max={100}
        />
        <Select
          label={tShared("niche")}
          value={niche}
          onChange={setNiche}
          options={NICHES.map((n) => ({ value: n.id, label: n.label }))}
        />
        <Select
          label={t("fields.audienceCountry")}
          value={country}
          onChange={setCountry}
          options={COUNTRIES.map((c) => ({ value: c.id, label: c.label }))}
        />
        <Select
          label={t("fields.deliverable")}
          value={deliverable}
          onChange={(v) => setDeliverable(v as typeof deliverable)}
          options={[
            {
              value: "integration",
              label: t("deliverableOptions.integration"),
            },
            { value: "dedicated", label: t("deliverableOptions.dedicated") },
            {
              value: "shortsMention",
              label: t("deliverableOptions.shortsMention"),
            },
            {
              value: "productPlacement",
              label: t("deliverableOptions.productPlacement"),
            },
          ]}
        />
        <Select
          label={t("fields.usageRights")}
          value={usageRights}
          onChange={(v) => setUsageRights(v as typeof usageRights)}
          options={[
            { value: "standard", label: t("usageRightsOptions.standard") },
            { value: "extended", label: t("usageRightsOptions.extended") },
            { value: "perpetual", label: t("usageRightsOptions.perpetual") },
          ]}
        />
        <Select
          label={t("fields.exclusivity")}
          value={exclusivity}
          onChange={(v) => setExclusivity(v as typeof exclusivity)}
          options={[
            { value: "none", label: t("exclusivityOptions.none") },
            { value: "partial", label: t("exclusivityOptions.partial") },
            { value: "full", label: t("exclusivityOptions.full") },
          ]}
        />
        <NumField
          label={t("fields.videoCount")}
          value={videoCount}
          onChange={setVideoCount}
          step={1}
          min={1}
        />
        <Select
          label={tShared("currency")}
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
          label={t("results.conservativeRate")}
          value={result.perVideoLow}
          currency={currency}
        />
        <Band
          label={t("results.expectedRate")}
          value={result.perVideoExpected}
          currency={currency}
          highlight
        />
        <Band
          label={t("results.optimisticRate")}
          value={result.perVideoHigh}
          currency={currency}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <Row
          label={t("results.packageConservative")}
          value={formatCurrency(result.low, currency)}
        />
        <Row
          label={t("results.packageExpected")}
          value={formatCurrency(result.expected, currency)}
        />
        <Row
          label={t("results.packageOptimistic")}
          value={formatCurrency(result.high, currency)}
        />
      </div>

      <p className="text-xs text-slate-500">{t("disclaimer")}</p>
    </section>
  );
}

function NumField({
  label,
  value,
  onChange,
  step,
  min = 0,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
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
