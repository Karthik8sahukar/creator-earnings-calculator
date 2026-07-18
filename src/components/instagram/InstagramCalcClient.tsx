"use client";

/**
 * Instagram Money Calculator — interactive client component.
 *
 * Composition:
 *   ┌── Form ────────────────────────────────────────────────────┐
 *   │  Followers · Reach · Reel Views · Story Views · Engagement │
 *   │  Country · Niche · Currency                                │
 *   │  Content frequency (posts / reels / stories per month)     │
 *   │  Monetization toggles                                      │
 *   │  Advanced (expandable): custom rates + affiliate + subs    │
 *   └───────────────────────────────────────────────────────────┘
 *   ┌── Results ─────────────────────────────────────────────────┐
 *   │  Low / Expected / High headline bands                      │
 *   │  Yearly / Monthly / Avg deal / Rev per 1k / Confidence…    │
 *   │  Breakdown cards + share URL + copy                        │
 *   │  Chart (lazy-loaded)                                       │
 *   └───────────────────────────────────────────────────────────┘
 *
 * State management:
 *   • Canonical state lives in a single `state` object that is
 *     restored from URL params on mount.
 *   • Any state change debounces (200ms) into a URL update, so
 *     rapid typing does not spam history entries.
 *   • The calculator functions are pure — the only side effects
 *     here are (a) URL sync, and (b) analytics tracking.
 */

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { track } from "@/lib/analytics";
import { formatCurrency, formatCompact } from "@/lib/format";
import {
  INSTAGRAM_COUNTRIES,
  INSTAGRAM_NICHES,
} from "@/lib/instagram/config";
import {
  calculateInstagramEarnings,
  type EarningsSource,
} from "@/lib/instagram/earnings";
import {
  decodeInstagramState,
  encodeInstagramState,
  hydrateInstagramState,
  INSTAGRAM_DEFAULT_STATE,
  type InstagramCalculatorState,
} from "@/lib/instagram/state";
import { CURRENCIES } from "@/lib/rpmData";

import { InstagramBreakdownChart } from "./InstagramBreakdownChart";

// A whitelist of the currencies the spec explicitly requires. All are
// present in the shared CURRENCIES list; we just filter to keep the
// dropdown short and predictable.
const CALCULATOR_CURRENCIES = ["USD", "INR", "EUR", "GBP", "AUD", "CAD", "JPY", "BRL"];

export function InstagramCalcClient() {
  const t = useTranslations("instagramCalculator");
  const tCommon = useTranslations("common");
  const [state, setState] = useState<InstagramCalculatorState>(
    INSTAGRAM_DEFAULT_STATE,
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [resultsCopyStatus, setResultsCopyStatus] = useState<
    "idle" | "copied" | "error"
  >("idle");
  const trackedCompletionRef = useRef(false);
  const hydratedRef = useRef(false);
  const urlUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Hydrate from URL on first mount ─────────────────────────────
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    track({ name: "instagram_calculator.opened" });
    if (typeof window === "undefined") return;

    try {
      const params = new URLSearchParams(window.location.search);
      const partial = decodeInstagramState(params);
      if (Object.keys(partial).length > 0) {
        setState(hydrateInstagramState(partial));
      }
    } catch {
      // Malformed URL params should never crash the page.
    }
  }, []);

  // ── Compute earnings ────────────────────────────────────────────
  const earnings = useMemo(
    () => calculateInstagramEarnings(state),
    [state],
  );

  // ── URL sync (debounced) ────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (urlUpdateTimer.current) clearTimeout(urlUpdateTimer.current);
    urlUpdateTimer.current = setTimeout(() => {
      const params = encodeInstagramState(state);
      const search = params.toString();
      const nextUrl = `${window.location.pathname}${search ? "?" + search : ""}`;
      const nextAbsolute = `${window.location.origin}${nextUrl}`;
      // Only push if the URL actually changed — avoid gratuitous
      // history entries.
      if (window.location.href !== nextAbsolute) {
        window.history.replaceState(null, "", nextUrl);
      }
      setShareUrl(nextAbsolute);
    }, 200);
    return () => {
      if (urlUpdateTimer.current) clearTimeout(urlUpdateTimer.current);
    };
  }, [state]);

  // ── Track a single "completed" event once a real number appears ─
  useEffect(() => {
    if (trackedCompletionRef.current) return;
    if (earnings.expected.monthly <= 0) return;
    trackedCompletionRef.current = true;
    track({
      name: "instagram_calculator.completed",
      streams: {
        posts: state.enableSponsoredPosts,
        reels: state.enableSponsoredReels,
        stories: state.enableSponsoredStories,
        affiliate: state.enableAffiliate,
        subscriptions: state.enableSubscriptions,
      },
      followerBucket: bucketFollowers(state.followers),
    });
  }, [earnings.expected.monthly, state]);

  const patch = useCallback((patch: Partial<InstagramCalculatorState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const onCurrencyChange = useCallback(
    (currency: string) => {
      patch({ currency });
      track({ name: "instagram_calculator.currency_changed", currency });
    },
    [patch],
  );

  const onCopyShareLink = useCallback(async () => {
    // Compute the URL synchronously so we don't race the debounced
    // URL-sync effect. `shareUrl` (used elsewhere for status display)
    // trails the debounce, but the copy target must be up-to-date
    // the moment the user clicks.
    let url = shareUrl;
    if (!url && typeof window !== "undefined") {
      const params = encodeInstagramState(state);
      const search = params.toString();
      url = `${window.location.origin}${window.location.pathname}${
        search ? "?" + search : ""
      }`;
    }
    if (!url) return;
    try {
      await copyToClipboard(url);
      setCopyStatus("copied");
      track({ name: "instagram_calculator.share_link_created" });
    } catch {
      setCopyStatus("error");
    }
    window.setTimeout(() => setCopyStatus("idle"), 2500);
  }, [shareUrl, state]);

  const onCopyResults = useCallback(async () => {
    const lines: string[] = [
      t("results.copyHeadline"),
      "",
      `${t("results.low")}: ${formatCurrency(
        earnings.low.monthly,
        earnings.currency,
      )} / ${t("results.month")}`,
      `${t("results.expected")}: ${formatCurrency(
        earnings.expected.monthly,
        earnings.currency,
      )} / ${t("results.month")}`,
      `${t("results.high")}: ${formatCurrency(
        earnings.high.monthly,
        earnings.currency,
      )} / ${t("results.month")}`,
      "",
      ...earnings.breakdown
        .filter((line) => line.amount > 0)
        .map(
          (line) =>
            `${t(line.labelKey)}: ${formatCurrency(
              line.amount,
              earnings.currency,
            )}`,
        ),
      "",
      t("results.disclaimer"),
    ];
    try {
      await copyToClipboard(lines.join("\n"));
      setResultsCopyStatus("copied");
      track({ name: "instagram_calculator.results_copied" });
    } catch {
      setResultsCopyStatus("error");
    }
    window.setTimeout(() => setResultsCopyStatus("idle"), 2500);
  }, [earnings, t]);

  const onOpenAdvanced = useCallback(() => {
    setAdvancedOpen((prev) => {
      const next = !prev;
      if (next) track({ name: "instagram_calculator.advanced_opened" });
      return next;
    });
  }, []);

  const onReset = useCallback(() => {
    setState({ ...INSTAGRAM_DEFAULT_STATE });
  }, []);

  const localizedLabels: Record<EarningsSource, string> = {
    sponsoredPosts: t("breakdown.sponsoredPosts"),
    sponsoredReels: t("breakdown.sponsoredReels"),
    sponsoredStories: t("breakdown.sponsoredStories"),
    affiliate: t("breakdown.affiliate"),
    subscriptions: t("breakdown.subscriptions"),
  };

  const currency = CURRENCIES.find((c) => c.code === state.currency)!;

  const followerBucket = bucketFollowers(state.followers);

  return (
    <>
      {/* ─── Calculator form ─────────────────────────────────────── */}
      <section
        aria-labelledby="ig-calc-title"
        className="card p-6 sm:p-8 space-y-8"
        data-testid="instagram-calculator-form"
      >
        <div>
          <h2
            id="ig-calc-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {t("form.title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("form.subtitle")}
          </p>
        </div>

        {/* Row 1 — audience */}
        <fieldset className="space-y-4">
          <legend className="label">{t("form.audienceLegend")}</legend>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumField
              label={t("form.followers")}
              value={state.followers}
              onChange={(v) => patch({ followers: v })}
              step={1000}
              testId="ig-followers"
            />
            <NumField
              label={t("form.avgReelViews")}
              value={state.avgReelViews}
              onChange={(v) => patch({ avgReelViews: v })}
              step={1000}
              testId="ig-reel-views"
            />
            <NumField
              label={t("form.avgPostReach")}
              value={state.avgPostReach}
              onChange={(v) => patch({ avgPostReach: v })}
              step={1000}
              testId="ig-post-reach"
            />
            <NumField
              label={t("form.avgStoryViews")}
              value={state.avgStoryViews}
              onChange={(v) => patch({ avgStoryViews: v })}
              step={100}
              testId="ig-story-views"
            />
            <NumField
              label={t("form.engagementRate")}
              value={state.engagementRate}
              onChange={(v) => patch({ engagementRate: v })}
              step={0.1}
              max={100}
              testId="ig-engagement"
              suffix="%"
            />
            <SelectField
              label={t("form.country")}
              value={state.country}
              onChange={(v) => patch({ country: v })}
              options={INSTAGRAM_COUNTRIES.map((c) => ({
                value: c.id,
                label: c.label,
              }))}
              testId="ig-country"
            />
            <SelectField
              label={t("form.niche")}
              value={state.niche}
              onChange={(v) => patch({ niche: v })}
              options={INSTAGRAM_NICHES.map((n) => ({
                value: n.id,
                label: n.label,
              }))}
              testId="ig-niche"
            />
            <SelectField
              label={t("form.currency")}
              value={state.currency}
              onChange={onCurrencyChange}
              options={CURRENCIES.filter((c) =>
                CALCULATOR_CURRENCIES.includes(c.code),
              ).map((c) => ({
                value: c.code,
                label: `${c.code} — ${c.label}`,
              }))}
              testId="ig-currency"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("form.currencyNote")}
          </p>
        </fieldset>

        {/* Row 2 — content frequency */}
        <fieldset className="space-y-4">
          <legend className="label">{t("form.contentLegend")}</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumField
              label={t("form.feedPostsPerMonth")}
              value={state.feedPostsPerMonth}
              onChange={(v) => patch({ feedPostsPerMonth: v })}
              step={1}
              max={200}
            />
            <NumField
              label={t("form.reelsPerMonth")}
              value={state.reelsPerMonth}
              onChange={(v) => patch({ reelsPerMonth: v })}
              step={1}
              max={200}
            />
            <NumField
              label={t("form.storiesPerMonth")}
              value={state.storiesPerMonth}
              onChange={(v) => patch({ storiesPerMonth: v })}
              step={1}
              max={500}
            />
          </div>
        </fieldset>

        {/* Row 3 — monetization toggles */}
        <fieldset className="space-y-4">
          <legend className="label">{t("form.monetizationLegend")}</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ToggleField
              label={t("form.enableSponsoredPosts")}
              value={state.enableSponsoredPosts}
              onChange={(v) => patch({ enableSponsoredPosts: v })}
            />
            <ToggleField
              label={t("form.enableSponsoredReels")}
              value={state.enableSponsoredReels}
              onChange={(v) => patch({ enableSponsoredReels: v })}
            />
            <ToggleField
              label={t("form.enableSponsoredStories")}
              value={state.enableSponsoredStories}
              onChange={(v) => patch({ enableSponsoredStories: v })}
            />
            <ToggleField
              label={t("form.enableAffiliate")}
              value={state.enableAffiliate}
              onChange={(v) => patch({ enableAffiliate: v })}
            />
            <ToggleField
              label={t("form.enableSubscriptions")}
              value={state.enableSubscriptions}
              onChange={(v) => patch({ enableSubscriptions: v })}
            />
          </div>
        </fieldset>

        {/* Advanced */}
        <div>
          <button
            type="button"
            onClick={onOpenAdvanced}
            className="btn-secondary text-sm"
            aria-expanded={advancedOpen}
            aria-controls="ig-advanced"
            data-testid="ig-advanced-toggle"
          >
            {advancedOpen
              ? t("form.hideAdvanced")
              : t("form.showAdvanced")}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="ml-2 text-sm text-slate-500 underline hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {tCommon("actions.reset")}
          </button>
        </div>

        {advancedOpen && (
          <div
            id="ig-advanced"
            className="space-y-6 border-t border-slate-200 pt-6 dark:border-slate-800"
          >
            <fieldset className="space-y-4">
              <legend className="label">{t("form.customRatesLegend")}</legend>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("form.customRatesHelp", { currency: currency.code })}
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <NumField
                  label={t("form.customPostRate")}
                  value={state.customPostRateUsd}
                  onChange={(v) => patch({ customPostRateUsd: v })}
                  step={10}
                  hint={t("form.leaveBlankHint")}
                />
                <NumField
                  label={t("form.customReelRate")}
                  value={state.customReelRateUsd}
                  onChange={(v) => patch({ customReelRateUsd: v })}
                  step={10}
                  hint={t("form.leaveBlankHint")}
                />
                <NumField
                  label={t("form.customStoryRate")}
                  value={state.customStoryRateUsd}
                  onChange={(v) => patch({ customStoryRateUsd: v })}
                  step={5}
                  hint={t("form.leaveBlankHint")}
                />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="label">{t("form.affiliateLegend")}</legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <NumField
                  label={t("form.affiliateConversionPct")}
                  value={state.affiliateConversionPct}
                  onChange={(v) => patch({ affiliateConversionPct: v })}
                  step={0.1}
                  max={100}
                  suffix="%"
                />
                <NumField
                  label={t("form.affiliateAov")}
                  value={state.affiliateAverageOrderValueUsd}
                  onChange={(v) =>
                    patch({ affiliateAverageOrderValueUsd: v })
                  }
                  step={5}
                />
                <NumField
                  label={t("form.affiliateCommissionPct")}
                  value={state.affiliateCommissionPct}
                  onChange={(v) => patch({ affiliateCommissionPct: v })}
                  step={0.5}
                  max={100}
                  suffix="%"
                />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="label">{t("form.subscriptionsLegend")}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumField
                  label={t("form.paidSubscribers")}
                  value={state.paidSubscribers}
                  onChange={(v) => patch({ paidSubscribers: v })}
                  step={10}
                />
                <NumField
                  label={t("form.subscriptionPrice")}
                  value={state.subscriptionPriceUsd}
                  onChange={(v) => patch({ subscriptionPriceUsd: v })}
                  step={0.5}
                />
              </div>
            </fieldset>
          </div>
        )}
      </section>

      {/* ─── Results ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="ig-results-title"
        className="card p-6 sm:p-8 space-y-6"
        data-testid="instagram-calculator-results"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2
              id="ig-results-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {t("results.title")}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("results.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onCopyResults}
              className="btn-secondary text-sm"
              data-testid="ig-copy-results"
            >
              {resultsCopyStatus === "copied"
                ? t("results.copiedResults")
                : t("results.copyResults")}
            </button>
            <button
              type="button"
              onClick={onCopyShareLink}
              className="btn-secondary text-sm"
              data-testid="ig-copy-share"
            >
              {copyStatus === "copied"
                ? t("results.copiedLink")
                : t("results.copyShareLink")}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3" data-testid="ig-band-row">
          <Band
            label={t("results.low")}
            monthly={earnings.low.monthly}
            yearly={earnings.low.yearly}
            currency={earnings.currency}
          />
          <Band
            label={t("results.expected")}
            monthly={earnings.expected.monthly}
            yearly={earnings.expected.yearly}
            currency={earnings.currency}
            highlight
          />
          <Band
            label={t("results.high")}
            monthly={earnings.high.monthly}
            yearly={earnings.high.yearly}
            currency={earnings.currency}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <StatRow
            label={t("results.monthlyEarnings")}
            value={formatCurrency(
              earnings.expected.monthly,
              earnings.currency,
            )}
          />
          <StatRow
            label={t("results.yearlyEarnings")}
            value={formatCurrency(
              earnings.expected.yearly,
              earnings.currency,
            )}
          />
          <StatRow
            label={t("results.avgBrandDeal")}
            value={formatCurrency(
              earnings.averageBrandDealValue,
              earnings.currency,
            )}
          />
          <StatRow
            label={t("results.revenuePerThousandReach")}
            value={formatCurrency(
              earnings.revenuePerThousandReach,
              earnings.currency,
            )}
          />
          <StatRow
            label={t("results.engagementQuality")}
            value={t(`results.engagementQualityValues.${earnings.engagementQuality}`)}
          />
          <StatRow
            label={t("results.largestSource")}
            value={
              earnings.largestSource
                ? t(`breakdown.${earnings.largestSource}`)
                : "—"
            }
          />
          <StatRow
            label={t("results.confidence")}
            value={t(`results.confidenceValues.${earnings.confidence}`)}
          />
          <StatRow
            label={t("results.followerTier")}
            value={t(`results.followerBuckets.${followerBucket}`)}
          />
          <StatRow
            label={t("results.usdExchangeRate")}
            value={
              earnings.currency === "USD"
                ? "1.00"
                : `1 USD ≈ ${earnings.usdRate.toFixed(2)} ${earnings.currency}`
            }
          />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("results.currencyNote", {
            monthlyCompact: formatCompact(earnings.expected.monthly),
            currency: earnings.currency,
          })}
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("results.disclaimer")}
        </p>
      </section>

      {/* ─── Breakdown cards ────────────────────────────────────── */}
      <section
        aria-labelledby="ig-breakdown-title"
        className="card p-6 sm:p-8 space-y-6"
      >
        <div>
          <h2
            id="ig-breakdown-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {t("breakdown.title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("breakdown.subtitle")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {earnings.breakdown.map((line) => (
            <BreakdownCard
              key={line.key}
              label={t(line.labelKey)}
              amount={line.amount}
              share={line.share}
              currency={earnings.currency}
            />
          ))}
        </div>
      </section>

      {/* ─── Chart ─────────────────────────────────────────────── */}
      <InstagramBreakdownChart
        breakdown={earnings.breakdown}
        currency={earnings.currency}
        labels={localizedLabels}
        title={t("chart.title")}
        subtitle={t("chart.subtitle")}
        totalLabel={t("chart.totalLabel")}
        emptyLabel={t("chart.empty")}
      />
    </>
  );
}

// ── Small building blocks ────────────────────────────────────────

function NumField({
  label,
  value,
  onChange,
  step,
  min = 0,
  max,
  suffix,
  hint,
  testId,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  hint?: string;
  testId?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="mt-1 relative">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value === 0 ? "" : value}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange(0);
              return;
            }
            const parsed = Number(raw);
            onChange(Number.isFinite(parsed) ? parsed : 0);
          }}
          className="input"
          aria-label={label}
          data-testid={testId}
        />
        {suffix && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"
          >
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  testId?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input mt-1"
        aria-label={label}
        data-testid={testId}
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

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800"
        aria-label={label}
      />
      <span className="text-slate-800 dark:text-slate-200">{label}</span>
    </label>
  );
}

function Band({
  label,
  monthly,
  yearly,
  currency,
  highlight,
}: {
  label: string;
  monthly: number;
  yearly: number;
  currency: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight
          ? "bg-gradient-to-br from-brand-600 to-brand-800 text-white border-brand-600"
          : "bg-slate-50 text-slate-800 border-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800"
      }`}
    >
      <p
        className={`text-[10px] uppercase tracking-wide ${
          highlight
            ? "text-brand-100"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {label}
      </p>
      <p className="text-2xl font-bold">{formatCurrency(monthly, currency)}</p>
      <p
        className={`text-xs ${
          highlight ? "text-brand-100/90" : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {formatCurrency(yearly, currency)} / yr
      </p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}

function BreakdownCard({
  label,
  amount,
  share,
  currency,
}: {
  label: string;
  amount: number;
  share: number;
  currency: string;
}) {
  const pct = Math.max(0, Math.round(share * 100));
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
        {formatCurrency(amount, currency)}
      </p>
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{pct}%</p>
    </div>
  );
}

// ── Utilities ──────────────────────────────────────────────────

function bucketFollowers(
  followers: number,
): "nano" | "micro" | "mid" | "macro" | "mega" {
  if (followers < 10_000) return "nano";
  if (followers < 50_000) return "micro";
  if (followers < 250_000) return "mid";
  if (followers < 1_000_000) return "macro";
  return "mega";
}

async function copyToClipboard(text: string): Promise<void> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "absolute";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  if (!ok) throw new Error("copy-failed");
}

