// Independent verification script for the audit report.
// Prints the earnings-engine's output for a curated grid of scenarios.
// Uses `tsx` (via `npx tsx`) so we can import the TypeScript modules
// directly without a compile step.
//
//   Run with:  npx tsx scripts/verify-samples.mjs
//
// This file is NOT shipped with the app — it's a report generator.
//
// Every sample uses monetizedPercentage = 90 (the reference). At the
// reference the formula reduces to YouTube's canonical
//
//     monthly_ad_revenue = views / 1000 × RPM
//
// so the printed numbers are directly comparable to a YouTube Studio
// RPM report for a typical channel. The Conservative → Optimistic
// spread is exactly BAND_FACTORS × Expected — a single source of
// truth for the RPM uncertainty band.

import { calculateEarnings } from "../src/lib/earnings.ts";
import {
  BAND_FACTORS,
  MIXED_LONG_SHARE,
  MIXED_SHORTS_SHARE,
  findCountry,
  findNiche,
} from "../src/lib/rpmData.ts";

const VIEW_COUNTS = [100_000, 1_000_000, 10_000_000];
const REFERENCE_MONETIZATION = 90;

function run({ monthlyViews, country, niche, contentType }) {
  return calculateEarnings({
    monthlyViews,
    country,
    niche,
    contentType,
    currency: "USD",
    monetizedPercentage: REFERENCE_MONETIZATION,
    sponsorship: 0,
    affiliate: 0,
    membership: 0,
  });
}

const SCENARIOS = [
  { label: "US · Finance · Long", country: "US", niche: "finance", contentType: "long" },
  { label: "US · Business · Long", country: "US", niche: "business", contentType: "long" },
  { label: "US · Tech · Long", country: "US", niche: "tech", contentType: "long" },
  { label: "US · Gaming · Long", country: "US", niche: "gaming", contentType: "long" },
  { label: "US · Music · Long", country: "US", niche: "music", contentType: "long" },
  { label: "US · Kids · Long", country: "US", niche: "kids", contentType: "long" },
  { label: "GB · Tech · Long", country: "GB", niche: "tech", contentType: "long" },
  { label: "DE · Finance · Long", country: "DE", niche: "finance", contentType: "long" },
  { label: "IN · General · Long", country: "IN", niche: "other", contentType: "long" },
  { label: "BR · Entertainment · Long", country: "BR", niche: "entertainment", contentType: "long" },
  { label: "US · Finance · Shorts", country: "US", niche: "finance", contentType: "shorts" },
  { label: "US · General · Shorts", country: "US", niche: "other", contentType: "shorts" },
  { label: "US · Music · Shorts", country: "US", niche: "music", contentType: "shorts" },
  { label: "IN · General · Shorts", country: "IN", niche: "other", contentType: "shorts" },
  { label: "US · Tech · Mixed (60/40)", country: "US", niche: "tech", contentType: "mixed" },
];

const money = (n) =>
  n >= 100_000
    ? `$${(n / 1000).toFixed(0)}k`
    : n >= 1_000
      ? `$${(n / 1000).toFixed(1)}k`
      : `$${n.toFixed(n >= 10 ? 0 : 2)}`;

console.log(
  `Band factors: conservative=${BAND_FACTORS.conservative}x, expected=${BAND_FACTORS.expected}x, optimistic=${BAND_FACTORS.optimistic}x`,
);
console.log(
  `Mixed blend:  ${(MIXED_LONG_SHARE * 100).toFixed(0)}% long / ${(MIXED_SHORTS_SHARE * 100).toFixed(0)}% shorts`,
);
console.log("");
console.log(
  `Assumed monetizedPercentage = ${REFERENCE_MONETIZATION} (the reference). At this`,
);
console.log("value the formula collapses to YouTube's canonical views / 1000 × RPM.");
console.log("USD, no sponsorship / affiliate / membership added.");
console.log("");

// Print country + niche detail table
console.log("=== RPM inputs used ===");
console.log("Country                | Long-form baseRpm | Shorts baseRpm");
for (const id of ["US", "GB", "DE", "IN", "BR", "OTHER"]) {
  const c = findCountry(id);
  console.log(
    `${c.label.padEnd(22)} | $${c.baseRpm.toString().padEnd(16)} | $${c.shortsRpm}`,
  );
}
console.log("");
console.log("Niche                                | Long-form mult | Shorts mult");
for (const id of [
  "finance",
  "business",
  "tech",
  "education",
  "other",
  "entertainment",
  "gaming",
  "music",
  "kids",
]) {
  const n = findNiche(id);
  console.log(
    `${n.label.padEnd(36)} | ${n.rpmMultiplier.toFixed(2).padEnd(14)} | ${n.shortsRpmMultiplier.toFixed(2)}`,
  );
}
console.log("");

console.log("=== Expected monthly earnings (before sponsorship/affiliate) ===");
console.log("Scenario                          | 100k views | 1M views | 10M views");
console.log("─".repeat(80));
for (const s of SCENARIOS) {
  const cells = VIEW_COUNTS.map((v) => {
    const r = run({ ...s, monthlyViews: v });
    return money(r.expected.monthly).padStart(10);
  });
  console.log(`${s.label.padEnd(33)} | ${cells.join(" | ")}`);
}

console.log("");
console.log(
  "=== Conservative → Optimistic band spread (US Tech Long-form, 1M views) ===",
);
const uTech = run({
  monthlyViews: 1_000_000,
  country: "US",
  niche: "tech",
  contentType: "long",
});
console.log(`Conservative (× 0.6): ${money(uTech.low.monthly)}`);
console.log(`Expected     (× 1.0): ${money(uTech.expected.monthly)}`);
console.log(`Optimistic   (× 1.5): ${money(uTech.high.monthly)}`);
console.log(
  `Ratio check:          low/exp = ${(uTech.low.monthly / uTech.expected.monthly).toFixed(3)}, high/exp = ${(uTech.high.monthly / uTech.expected.monthly).toFixed(3)}`,
);
