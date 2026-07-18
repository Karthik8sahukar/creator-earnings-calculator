#!/usr/bin/env node
/**
 * Merge Instagram-visibility UI keys into every locale bundle.
 *
 * These are the strings that surface the Instagram Money Calculator
 * across the homepage, header and mobile navigation without requiring
 * a user to open the Calculators dropdown:
 *
 *   • `nav.instagramCalculator` / `nav.instagramCalculatorAria`
 *     — the short header link.
 *   • `popularCalculators.openCta` — the "Open" CTA that now renders
 *     visibly on each popular-calculator card.
 *   • `popularCalculators.cards.instagram.description` — updated per
 *     spec so the card explicitly lists monetization streams.
 *   • `creatorPlatforms.*` — the new platform-picker section that
 *     appears beneath Popular Calculators on the homepage.
 *
 * English (en) is the source of truth. Non-English locales get the
 * same English strings for now so no translation keys are rendered
 * raw. Professional translations can be layered on later.
 *
 * The script is idempotent: running it twice produces identical
 * output. It deep-merges INTO existing files, so unrelated existing
 * keys stay untouched.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const messagesDir = path.join(__dirname, "..", "messages");

const LOCALES = ["en", "hi", "es", "pt", "de", "fr", "ja"];

function deepMerge(target, source) {
  if (source === null || typeof source !== "object") return source;
  if (target === null || typeof target !== "object") return { ...source };
  const out = { ...target };
  for (const [k, v] of Object.entries(source)) out[k] = deepMerge(target?.[k], v);
  return out;
}

async function main() {
  const enPath = path.join(messagesDir, "en.json");
  const en = JSON.parse(await fs.readFile(enPath, "utf8"));

  // Everything below is copied verbatim from en.json — English is the
  // authoritative source for these strings.
  const additions = {
    nav: {
      instagramCalculator: en.nav?.instagramCalculator ?? "Instagram Calculator",
      instagramCalculatorAria:
        en.nav?.instagramCalculatorAria ?? "Instagram Money Calculator",
    },
    popularCalculators: {
      openCta: en.popularCalculators?.openCta ?? "Open",
      cards: {
        instagram: {
          title:
            en.popularCalculators?.cards?.instagram?.title ??
            "Instagram Money Calculator",
          description:
            en.popularCalculators?.cards?.instagram?.description ??
            "Estimate Instagram earnings from sponsored posts, Reels, Stories, affiliate income, engagement, reach, niche, and audience market.",
        },
      },
    },
    creatorPlatforms: en.creatorPlatforms,
  };

  if (!additions.creatorPlatforms) {
    throw new Error("Expected creatorPlatforms namespace in en.json");
  }

  for (const locale of LOCALES) {
    const filepath = path.join(messagesDir, `${locale}.json`);
    const existing = JSON.parse(await fs.readFile(filepath, "utf8"));
    const merged = deepMerge(existing, additions);
    const output = JSON.stringify(merged, null, 2) + "\n";
    await fs.writeFile(filepath, output, "utf8");
    process.stdout.write(`  updated ${locale}.json\n`);
  }
  process.stdout.write("done.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
