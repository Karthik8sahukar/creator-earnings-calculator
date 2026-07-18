"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { CopyShareLink } from "./CopyShareLink";
import { EarningsCharts } from "./EarningsCharts";
import { DollarIcon } from "./icons";
import { track } from "@/lib/analytics";
import {
  CALCULATOR_PARAM_KEYS,
  DEFAULT_CALCULATOR_STATE,
  DEFAULT_SCENARIO,
  buildShareUrl,
  encodeCalculatorState,
  toEarningsInput,
  type CalculatorState,
  type EstimateBand,
} from "@/lib/calculatorState";
import { calculateEarnings } from "@/lib/earnings";
import { formatCurrency, formatCompact, formatNumber } from "@/lib/format";
import {
  COUNTRIES,
  CURRENCIES,
  NICHES,
  findCurrency,
} from "@/lib/rpmData";
import type { PerformanceAnalysis } from "@/types/youtube";

interface Props {
  analysis: PerformanceAnalysis;
  initialState?: Partial<CalculatorState>;
  onStateChange?: (state: CalculatorState) => void;
  shareOrigin?: string;
  sharePathname?: string;
  channelId?: string | null;
}

function pickDefaultContentType(shorts: number): CalculatorState["contentType"] {
  if (shorts >= 70) return "shorts";
  if (shorts >= 30) return "mixed";
  return "long";
}

function computeInitialState({
  analysis,
  initialState,
  channelId,
}: {
  analysis: PerformanceAnalysis;
  initialState?: Partial<CalculatorState>;
  channelId: string | null;
}): CalculatorState {
  const analysisDerived: Partial<CalculatorState> = {
    monthlyViews: analysis.monthlyViewEstimate.expected || 0,
    contentType: pickDefaultContentType(analysis.shortsPercentage),
  };

  return {
    ...DEFAULT_CALCULATOR_STATE,
    ...analysisDerived,
    ...(initialState ?? {}),
    channelId,
    estimateBand: initialState?.estimateBand ?? DEFAULT_SCENARIO,
  };
}

export function EarningsCalculator({
  analysis,
  initialState,
  onStateChange,
  shareOrigin,
  sharePathname = "/",
  channelId = null,
}: Props) {
  const t = useTranslations("earnings");
  const initialViews = analysis.monthlyViewEstimate.expected || 0;

  const [state, setState] = useState<CalculatorState>(() =>
    computeInitialState({ analysis, initialState, channelId }),
  );

  const estimateBand = state.estimateBand;

  useEffect(() => {
    if (!onStateChange) return;
    const timer = setTimeout(() => {
      onStateChange(state);
    }, 200);
    return () => clearTimeout(timer);
  }, [state, onStateChange]);

  const input = useMemo(() => toEarningsInput(state), [state]);
  const earnings = useMemo(() => calculateEarnings(input), [input]);
  const currencyMeta = useMemo(
    () => findCurrency(state.currency),
    [state.currency],
  );
  const active = earnings[estimateBand];

  function applyBand(band: EstimateBand) {
    setState((s) => ({ ...s, estimateBand: band }));
    track({ name: "calculator.assumption_changed", field: "estimateBand" });
  }

  function update<K extends keyof CalculatorState>(
    field: K,
    value: CalculatorState[K],
  ) {
    setState((s) => ({ ...s, [field]: value }));
    track({ name: "calculator.assumption_changed", field: String(field) });
  }

  function reset() {
    setState(
      computeInitialState({
        analysis,
        initialState: undefined,
        channelId,
      }),
    );
  }

  const shareUrl = useMemo(() => {
    const origin =
      shareOrigin ??
      (typeof window !== "undefined" ? window.location.origin : "");
    return buildShareUrl(origin, sharePathname, state);
  }, [shareOrigin, sharePathname, state]);

  const bandLabels: Record<EstimateBand, string> = {
    low: t("bands.low"),
    expected: t("bands.expected"),
    high: t("bands.high"),
  };

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="earn-title"
        data-testid="earnings-calculator"
        className="card p-6 sm:p-8"
      >
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <DollarIcon className="text-brand-600" />
            <h2 id="earn-title" className="text-lg font-semibold text-slate-900">
              {t("sectionTitle")}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="btn-secondary text-xs sm:text-sm"
            >
              {/* Common: Reset */}
              <ResetLabel />
            </button>
            <CopyShareLink url={shareUrl} />
          </div>
        </header>

        <div
          role="tablist"
          aria-label={t("tabsLabel")}
          className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-sm mb-6"
        >
          {(["low", "expected", "high"] as const).map((band) => (
            <button
              key={band}
              type="button"
              role="tab"
              aria-selected={estimateBand === band}
              data-testid={`estimate-tab-${band}`}
              onClick={() => applyBand(band)}
              className={`px-3 py-1.5 rounded-md transition ${
                estimateBand === band
                  ? "bg-white shadow-sm text-slate-900 font-medium"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {bandLabels[band]}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            <FieldGroup>
              <NumberField
                label={t("fields.monthlyViews")}
                name={CALCULATOR_PARAM_KEYS.monthlyViews}
                value={state.monthlyViews}
                onChange={(v) => update("monthlyViews", clampNumber(v))}
                hint={t("fields.monthlyViewsHint", {
                  compact: formatCompact(initialViews),
                  full: formatNumber(initialViews),
                })}
                min={0}
                step={1000}
              />
              <SelectField
                label={t("fields.contentType")}
                name={CALCULATOR_PARAM_KEYS.contentType}
                value={state.contentType}
                onChange={(v) =>
                  update("contentType", v as CalculatorState["contentType"])
                }
                options={[
                  { value: "long", label: t("contentTypeOptions.long") },
                  { value: "shorts", label: t("contentTypeOptions.shorts") },
                  { value: "mixed", label: t("contentTypeOptions.mixed") },
                ]}
              />
            </FieldGroup>

            <FieldGroup>
              <SelectField
                label={t("fields.country")}
                name={CALCULATOR_PARAM_KEYS.country}
                value={state.country}
                onChange={(v) => update("country", v)}
                options={COUNTRIES.map((c) => ({ value: c.id, label: c.label }))}
              />
              <SelectField
                label={t("fields.niche")}
                name={CALCULATOR_PARAM_KEYS.niche}
                value={state.niche}
                onChange={(v) => update("niche", v)}
                options={NICHES.map((n) => ({ value: n.id, label: n.label }))}
              />
            </FieldGroup>

            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t("fields.rpmMode")}
                  name={CALCULATOR_PARAM_KEYS.rpmMode}
                  value={state.rpmMode}
                  onChange={(v) =>
                    update("rpmMode", v as CalculatorState["rpmMode"])
                  }
                  options={[
                    { value: "auto", label: t("rpmModeOptions.auto") },
                    { value: "custom", label: t("rpmModeOptions.custom") },
                  ]}
                />
                <NumberField
                  label={t("fields.customRpm")}
                  name={CALCULATOR_PARAM_KEYS.customRpm}
                  value={state.customRpm}
                  onChange={(v) => update("customRpm", clampNumber(v))}
                  min={0}
                  step={0.1}
                  disabled={state.rpmMode !== "custom"}
                />
              </div>
              <SelectField
                label={t("fields.displayCurrency")}
                name={CALCULATOR_PARAM_KEYS.currency}
                value={state.currency}
                onChange={(v) => update("currency", v)}
                options={CURRENCIES.map((c) => ({
                  value: c.code,
                  label: `${c.code} — ${c.label}`,
                }))}
              />
            </FieldGroup>

            <FieldGroup>
              <SliderField
                label={t("fields.monetizedPercent")}
                name={CALCULATOR_PARAM_KEYS.monetizedPercentage}
                value={state.monetizedPercentage}
                onChange={(v) => update("monetizedPercentage", clampPct(v))}
                min={0}
                max={100}
                step={1}
                suffix="%"
                hint={t("fields.monetizedHint")}
              />
            </FieldGroup>

            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <legend className="label mb-2 col-span-full">
                {t("fields.extrasLegend", { currency: currencyMeta.code })}
              </legend>
              <NumberField
                label={t("fields.sponsorships")}
                name={CALCULATOR_PARAM_KEYS.sponsorship}
                value={state.sponsorship}
                onChange={(v) => update("sponsorship", clampNumber(v))}
                min={0}
                step={50}
              />
              <NumberField
                label={t("fields.affiliate")}
                name={CALCULATOR_PARAM_KEYS.affiliate}
                value={state.affiliate}
                onChange={(v) => update("affiliate", clampNumber(v))}
                min={0}
                step={50}
              />
              <NumberField
                label={t("fields.memberships")}
                name={CALCULATOR_PARAM_KEYS.membership}
                value={state.membership}
                onChange={(v) => update("membership", clampNumber(v))}
                min={0}
                step={50}
              />
              <NumberField
                label={t("fields.other")}
                name={CALCULATOR_PARAM_KEYS.other}
                value={state.other}
                onChange={(v) => update("other", clampNumber(v))}
                min={0}
                step={50}
              />
            </fieldset>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-6 shadow-pop">
              <p className="text-xs uppercase tracking-wide text-brand-100">
                {t("monthlyTotal", { band: bandLabels[estimateBand] })}
              </p>
              <p
                className="mt-1 text-4xl font-bold tracking-tight"
                data-testid="earnings-monthly"
              >
                {formatCurrency(active.monthly, state.currency)}
              </p>
              <p className="text-brand-100 text-sm mt-1">
                {t("atViews", { views: formatCompact(state.monthlyViews) })}
              </p>

              <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <Kpi
                  label={t("kpi.daily")}
                  value={formatCurrency(active.daily, state.currency)}
                />
                <Kpi
                  label={t("kpi.weekly")}
                  value={formatCurrency(active.weekly, state.currency)}
                />
                <Kpi
                  label={t("kpi.monthly")}
                  value={formatCurrency(active.monthly, state.currency)}
                />
                <Kpi
                  label={t("kpi.annual")}
                  value={formatCurrency(active.annual, state.currency)}
                />
              </dl>
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4 text-sm">
              <h3 className="font-medium text-slate-900">
                {t("breakdown.title")}
              </h3>
              <ul className="mt-3 space-y-2 text-slate-600">
                <BreakdownRow
                  label={t("breakdown.adRevenue")}
                  value={formatCurrency(
                    earnings.monthlyAdRevenue.monthly,
                    state.currency,
                  )}
                />
                <BreakdownRow
                  label={t("breakdown.sponsorships")}
                  value={formatCurrency(
                    earnings.extras.sponsorship,
                    state.currency,
                  )}
                />
                <BreakdownRow
                  label={t("breakdown.affiliate")}
                  value={formatCurrency(
                    earnings.extras.affiliate,
                    state.currency,
                  )}
                />
                <BreakdownRow
                  label={t("breakdown.memberships")}
                  value={formatCurrency(
                    earnings.extras.membership,
                    state.currency,
                  )}
                />
                <BreakdownRow
                  label={t("breakdown.other")}
                  value={formatCurrency(
                    state.other * findCurrency(state.currency).usdRate,
                    state.currency,
                  )}
                />
              </ul>
              <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                {t("disclaimer")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <EarningsCharts
        earnings={earnings}
        currency={state.currency}
        otherIncome={state.other * findCurrency(state.currency).usdRate}
      />

      {/* Machine-readable state for tests and share tooling. */}
      <div className="sr-only" data-testid="calculator-state-json">
        {JSON.stringify({
          state,
          params: encodeCalculatorState(state).toString(),
        })}
      </div>
    </div>
  );
}

function clampNumber(v: number | ""): number {
  if (v === "" || !Number.isFinite(v)) return 0;
  return Math.max(v as number, 0);
}
function clampPct(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(Math.max(v, 0), 100);
}

/** Small helper so we can use `useTranslations` for a nested string. */
function ResetLabel() {
  const t = useTranslations("common.actions");
  return <>{t("reset")}</>;
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function NumberField({
  label,
  name,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  hint,
  disabled,
}: {
  label: string;
  name?: string;
  value: number | "";
  onChange: (v: number | "") => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="number"
        name={name}
        inputMode="decimal"
        value={value === "" ? "" : value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") {
            onChange(0);
          } else {
            const n = Number(v);
            onChange(Number.isFinite(n) ? n : 0);
          }
        }}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={label}
        className="input mt-1 disabled:bg-slate-50 disabled:text-slate-400"
      />
      {hint && (
        <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>
      )}
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
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
  name,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  hint,
}: {
  label: string;
  name?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  hint?: string;
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
        name={name}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="mt-2 w-full accent-brand-600"
      />
      {hint && (
        <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>
      )}
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
