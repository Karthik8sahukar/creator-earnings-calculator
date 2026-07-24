"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { estimateRevenue, detectNiche } from "@/lib/revenueEstimator";
import type { EstimationResult, Niche } from "@/lib/revenueEstimator";

// ─── Rotating placeholders ──────────────────────────────────────────
const PLACEHOLDERS = ["behumler.com", "techcrunch.com", "github.com", "medium.com", "producthunt.com"];
const LOADING_STEPS = [
  "Analyzing website...",
  "Detecting niche...",
  "Estimating traffic...",
  "Calculating RPM...",
  "Generating revenue estimate...",
  "Preparing report...",
];

// ─── Component ──────────────────────────────────────────────────────
export function WebsiteRevenueClient() {
  const [domain, setDomain] = useState("");
  const [phIdx, setPhIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [rpmOverride, setRpmOverride] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotate placeholder
  useEffect(() => {
    const id = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(id);
  }, []);

  const analyze = useCallback(() => {
    const d = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
    if (!d || d.length < 3) return;
    setLoading(true);
    setLoadingStep(0);
    setResult(null);

    // Simulated loading sequence
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step >= LOADING_STEPS.length) {
        clearInterval(stepInterval);
        const res = estimateRevenue({ domain: d });
        setResult(res);
        setRpmOverride(null);
        setLoading(false);
      } else {
        setLoadingStep(step);
      }
    }, 350);
  }, [domain]);

  // Recalculate when RPM slider changes
  const currentResult = rpmOverride !== null && result
    ? estimateRevenue({ domain: result.domain, rpm: rpmOverride, monthlyVisitors: result.traffic.monthlyVisitors, niche: result.niche })
    : result;

  const fmt = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${Math.round(n)}`;
  const fmtNum = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(Math.round(n));

  return (
    <div className="space-y-8">
      {/* ─── SEARCH HERO ─── */}
      {!result && !loading && (
        <header className="text-center space-y-5 py-8 sm:py-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Estimate Any Website&apos;s Revenue
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Estimate monthly website revenue, RPM, yearly earnings, valuation, and monetization potential in seconds.
          </p>
          <div className="max-w-xl mx-auto flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === "Enter" && analyze()}
              placeholder={PLACEHOLDERS[phIdx]}
              className="input flex-1 text-base py-3 px-4"
              aria-label="Website domain"
            />
            <button
              type="button"
              onClick={analyze}
              disabled={domain.trim().length < 3}
              className="px-5 py-3 rounded-xl bg-brand-600 text-white font-semibold shadow-md hover:bg-brand-700 disabled:opacity-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
            >
              Estimate Revenue
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">All results are estimates. Not actual analytics data.</p>
        </header>
      )}

      {/* ─── LOADING STATE ─── */}
      {loading && (
        <div className="text-center py-16 space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20 animate-pulse">
            <span className="h-5 w-5 rounded-full bg-brand-600 animate-ping" />
          </div>
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100">{LOADING_STEPS[loadingStep]}</p>
          <div className="max-w-xs mx-auto h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-brand-600 rounded-full transition-all duration-300" style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* ─── RESULT DASHBOARD ─── */}
      {currentResult && !loading && (
        <div className="space-y-8">
          {/* Domain header + new search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-brand-600 dark:text-brand-400">Revenue Estimate</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">{currentResult.domain}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Niche: {currentResult.nicheLabel} &middot; All values are estimates</p>
            </div>
            <button type="button" onClick={() => { setResult(null); setDomain(""); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition">
              New Search
            </button>
          </div>

          {/* ─── KPI Cards ─── */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            <KpiCard label="Est. Monthly Revenue" value={fmt(currentResult.monthlyRevenue)} accent />
            <KpiCard label="Est. Yearly Revenue" value={fmt(currentResult.yearlyRevenue)} />
            <KpiCard label="Est. Monthly Traffic" value={fmtNum(currentResult.traffic.monthlyVisitors)} />
            <KpiCard label="Est. RPM" value={`$${currentResult.rpm.toFixed(2)}`} />
            <KpiCard label="Est. Website Value" value={`${fmt(currentResult.valuationLow)}–${fmt(currentResult.valuationHigh)}`} />
            <KpiCard label="Revenue Per Visitor" value={`$${currentResult.revenuePerVisitor.toFixed(4)}`} />
          </div>

          {/* ─── Revenue Breakdown ─── */}
          <section className="card p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Revenue Breakdown (Estimated)</h3>
            <div className="space-y-3">
              {currentResult.breakdown.map(item => (
                <div key={item.source} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{item.source}</span>
                    <span className="text-slate-600 dark:text-slate-400">{fmt(item.monthly)}/mo &middot; {item.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── RPM Slider ─── */}
          <section className="card p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Interactive RPM Calculator</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Adjust RPM to see how it affects revenue. Industry range: $0.50–$100.</p>
            <div className="space-y-2">
              <input
                type="range"
                min={0.5}
                max={100}
                step={0.5}
                value={rpmOverride ?? currentResult.rpm}
                onChange={e => setRpmOverride(Number(e.target.value))}
                className="w-full accent-brand-600"
                aria-label="RPM slider"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>$0.50</span>
                <span className="font-semibold text-brand-600 dark:text-brand-400">${(rpmOverride ?? currentResult.rpm).toFixed(2)} RPM</span>
                <span>$100</span>
              </div>
            </div>
          </section>

          {/* ─── Traffic ─── */}
          <section className="card p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Traffic Estimates</h3>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              <StatBox label="Monthly Visitors" value={fmtNum(currentResult.traffic.monthlyVisitors)} />
              <StatBox label="Daily Visitors" value={fmtNum(currentResult.traffic.dailyVisitors)} />
              <StatBox label="Pageviews" value={fmtNum(currentResult.traffic.monthlyPageviews)} />
              <StatBox label="Sessions" value={fmtNum(currentResult.traffic.sessionsPerMonth)} />
              <StatBox label="Returning %" value={`${currentResult.traffic.returningVisitorPct}%`} />
            </div>
          </section>

          {/* ─── Country Analysis ─── */}
          <section className="card p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Estimated Audience Countries</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {currentResult.countries.map(c => (
                <div key={c.code} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                    <span className="text-lg">{c.flag}</span> {c.country}
                  </span>
                  <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">{c.pct}%</span>
                </div>
              ))}
            </div>
          </section>

          {/* ─── Growth Projections ─── */}
          <section className="card p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Revenue Projections</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">If traffic increases:</p>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              {currentResult.projections.map(p => (
                <div key={p.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Traffic {p.label}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{fmt(p.monthly)}<span className="text-xs font-normal text-slate-500">/mo</span></p>
                  <p className="text-xs text-slate-500">{fmt(p.yearly)}/yr</p>
                </div>
              ))}
            </div>
          </section>

          {/* ─── Insights ─── */}
          <section className="card p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Insights &amp; Opportunities</h3>
            <ul className="space-y-3">
              {currentResult.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${insight.type === "positive" ? "bg-green-500" : insight.type === "opportunity" ? "bg-amber-500" : "bg-slate-400"}`} />
                  <span className="text-slate-700 dark:text-slate-300">{insight.text}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ─── Website Valuation ─── */}
          <section className="card p-6 sm:p-8 text-center space-y-3 bg-gradient-to-br from-brand-50 to-accent-50 dark:from-brand-950/30 dark:to-accent-950/20 border-brand-200 dark:border-brand-800">
            <p className="text-sm font-medium text-brand-700 dark:text-brand-300">Estimated Website Value</p>
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50">
              {fmt(currentResult.valuationLow)} – {fmt(currentResult.valuationHigh)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Based on {currentResult.nicheLabel} niche multiplier ({Math.round(currentResult.valuationLow / currentResult.monthlyRevenue)}–{Math.round(currentResult.valuationHigh / currentResult.monthlyRevenue)}× monthly revenue)
            </p>
          </section>

          {/* ─── Educational Content ─── */}
          <section className="card p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">How Website Revenue Is Estimated</h3>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100">What Is Website RPM?</h4>
                <p>RPM (Revenue Per Mille) represents estimated earnings per 1,000 pageviews. It varies by niche, audience geography, and ad optimization. Finance sites can see $15–45 RPM while general content sites typically earn $4–15.</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100">How Display Ads Generate Revenue</h4>
                <p>Display ad networks pay publishers based on impressions (CPM) and clicks (CPC). Premium networks like Mediavine and AdThrive require minimum traffic but offer significantly higher RPMs than Google AdSense alone.</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Affiliate Marketing Revenue</h4>
                <p>Affiliate income comes from promoting products and earning commissions on sales. Commission rates range from 1% (Amazon) to 50%+ (digital products). Niches with high-value purchases (finance, SaaS) earn more per conversion.</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Factors That Affect Website Earnings</h4>
                <p>Key factors: traffic volume, audience geography (US/UK/AU traffic pays 3–5× more than developing markets), niche demand, seasonality, ad viewability, content quality, and monetization diversity.</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Website Valuation Explained</h4>
                <p>Websites are typically valued at 24–60× monthly revenue. The multiplier depends on niche stability, traffic trends, revenue diversity, and growth potential. Established finance sites command the highest multiples.</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 sm:p-5 ${accent ? "bg-gradient-to-br from-brand-600 to-brand-800 text-white" : "border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${accent ? "text-brand-100" : "text-slate-500 dark:text-slate-400"}`}>{label}</p>
      <p className={`mt-1 text-xl sm:text-2xl font-bold ${accent ? "" : "text-slate-900 dark:text-slate-100"}`}>{value}</p>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-900">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
