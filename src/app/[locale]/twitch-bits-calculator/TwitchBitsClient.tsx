"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";

// ─── Constants ──────────────────────────────────────────────────────

/** 1 Bit = $0.01 for the streamer */
const BITS_TO_USD_RATE = 0.01;

/** Common Bit packages (viewer cost in USD — US pricing, may vary by region) */
const BIT_PACKAGES = [
  { bits: 100, cost: 1.4 },
  { bits: 500, cost: 7.0 },
  { bits: 1500, cost: 19.95 },
  { bits: 5000, cost: 64.4 },
  { bits: 10000, cost: 126.0 },
  { bits: 25000, cost: 308.0 },
] as const;

const PRESETS = [100, 500, 1000, 5000, 10000, 25000] as const;

// ─── Component ──────────────────────────────────────────────────────

export function TwitchBitsClient() {
  const [mode, setMode] = useState<"bits-to-usd" | "usd-to-bits">("bits-to-usd");
  const [bits, setBits] = useState<number>(1000);
  const [usd, setUsd] = useState<number>(10);

  const result = useMemo(() => {
    if (mode === "bits-to-usd") {
      if (!Number.isFinite(bits) || bits < 0) return { value: 0, valid: false };
      return { value: bits * BITS_TO_USD_RATE, valid: bits > 0 };
    }
    if (!Number.isFinite(usd) || usd < 0) return { value: 0, valid: false };
    return { value: Math.round(usd / BITS_TO_USD_RATE), valid: usd > 0 };
  }, [mode, bits, usd]);

  function handleBitsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = Number(e.target.value);
    setBits(Number.isFinite(raw) && raw >= 0 ? raw : 0);
  }

  function handleUsdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = Number(e.target.value);
    setUsd(Number.isFinite(raw) && raw >= 0 ? raw : 0);
  }

  return (
    <section className="space-y-6">
      {/* Mode toggle */}
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("bits-to-usd")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              mode === "bits-to-usd"
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Bits → USD (streamer payout)
          </button>
          <button
            type="button"
            onClick={() => setMode("usd-to-bits")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              mode === "usd-to-bits"
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            USD → Bits (how many Bits?)
          </button>
        </div>

        {/* Input */}
        {mode === "bits-to-usd" ? (
          <div className="space-y-3">
            <label className="block">
              <span className="label">Bits cheered</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={bits || ""}
                onChange={handleBitsChange}
                className="input mt-1"
                placeholder="Enter Bits"
              />
            </label>
            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setBits(p)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    bits === p
                      ? "bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {p.toLocaleString()} Bits
                </button>
              ))}
            </div>
          </div>
        ) : (
          <label className="block">
            <span className="label">Target streamer payout (USD)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={usd || ""}
              onChange={handleUsdChange}
              className="input mt-1"
              placeholder="Enter USD amount"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              How many Bits must be cheered for the streamer to earn this amount?
            </span>
          </label>
        )}

        {/* Result */}
        <div aria-live="polite" aria-atomic="true">
          {result.valid && (
            <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white text-center">
              <p className="text-sm uppercase tracking-wide text-brand-100">
                {mode === "bits-to-usd" ? "Streamer earns" : "Bits required"}
              </p>
              <p className="mt-1 text-3xl sm:text-4xl font-bold">
                {mode === "bits-to-usd"
                  ? `$${result.value.toFixed(2)}`
                  : `${result.value.toLocaleString()} Bits`}
              </p>
              <p className="mt-2 text-xs text-brand-200">
                {mode === "bits-to-usd"
                  ? `${bits.toLocaleString()} Bits × $0.01 per Bit = $${result.value.toFixed(2)} streamer payout`
                  : `$${usd.toFixed(2)} ÷ $0.01 per Bit = ${result.value.toLocaleString()} Bits`}
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          This calculator shows the <strong>streamer payout</strong> (1 Bit = $0.01 USD). Viewers pay more when purchasing
          Bits from Twitch. Purchase prices shown in the table below are approximate US prices before tax — actual cost
          varies by region, currency, platform, and applicable taxes.
        </p>
      </div>

      {/* Reference table: Bit packages */}
      <div className="card p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Twitch Bits Package Prices (US, approximate)
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          How much viewers pay for Bits vs. how much streamers receive. Prices are approximate US retail pricing and may vary by region and platform.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                <th className="pb-2 font-medium text-slate-700 dark:text-slate-300">Package</th>
                <th className="pb-2 font-medium text-slate-700 dark:text-slate-300">Viewer pays (approx.)</th>
                <th className="pb-2 font-medium text-slate-700 dark:text-slate-300">Streamer earns</th>
                <th className="pb-2 font-medium text-slate-700 dark:text-slate-300">Viewer cost per Bit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {BIT_PACKAGES.map((pkg) => (
                <tr key={pkg.bits}>
                  <td className="py-2 font-medium text-slate-900 dark:text-slate-100">
                    {pkg.bits.toLocaleString()} Bits
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-400">~${pkg.cost.toFixed(2)}</td>
                  <td className="py-2 text-green-700 dark:text-green-400 font-medium">
                    ${(pkg.bits * BITS_TO_USD_RATE).toFixed(2)}
                  </td>
                  <td className="py-2 text-slate-500 dark:text-slate-400">
                    ~${(pkg.cost / pkg.bits).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* How Bits Work */}
      <div className="card p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          How Twitch Bits Work
        </h2>
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            <strong className="text-slate-900 dark:text-slate-100">What are Bits?</strong>{" "}
            Bits are Twitch&apos;s virtual currency. Viewers buy Bits from Twitch and &quot;Cheer&quot; them in a
            streamer&apos;s chat to show support. Each Bit cheered pays the streamer exactly $0.01 USD.
          </p>
          <p>
            <strong className="text-slate-900 dark:text-slate-100">Viewer cost vs. streamer payout:</strong>{" "}
            Viewers pay more than $0.01 per Bit when purchasing — Twitch keeps the margin. For example, 100 Bits
            costs approximately $1.40 in the US. Streamers always receive exactly $0.01 per Bit regardless of how the viewer acquired them.
          </p>
          <p>
            <strong className="text-slate-900 dark:text-slate-100">Eligibility:</strong>{" "}
            Only Twitch Affiliates and Partners can receive Bits. Viewers need a Twitch account and a valid payment method to purchase them.
          </p>
          <p>
            <strong className="text-slate-900 dark:text-slate-100">Regional pricing:</strong>{" "}
            Bit package prices vary by country, currency, and platform (desktop vs. mobile). The prices shown above
            are approximate US desktop prices. Mobile purchases may cost more due to app store fees.
          </p>
        </div>
      </div>

      {/* Related tools */}
      <div className="card p-6 sm:p-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Related Tools
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 text-sm">
          <li>
            <Link href="/youtube-adsense-calculator" className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-200 underline-offset-2 hover:underline">
              YouTube AdSense Calculator
            </Link>
            <span className="text-slate-500 dark:text-slate-400"> — Estimate ad revenue from views.</span>
          </li>
          <li>
            <Link href="/youtube-sponsorship-calculator" className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-200 underline-offset-2 hover:underline">
              Sponsorship Rate Calculator
            </Link>
            <span className="text-slate-500 dark:text-slate-400"> — Estimate brand deal rates.</span>
          </li>
          <li>
            <Link href="/instagram-money-calculator" className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-200 underline-offset-2 hover:underline">
              Instagram Money Calculator
            </Link>
            <span className="text-slate-500 dark:text-slate-400"> — Estimate Instagram creator earnings.</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
