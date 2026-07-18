#!/usr/bin/env node
/**
 * Merge Instagram Money Calculator UI message keys into every locale
 * bundle.
 *
 * Behaviour:
 *   • English (en) is the source of truth and is copied verbatim from
 *     the existing en.json — nothing here overwrites hand-authored
 *     English copy.
 *   • Non-English locales get the SAME English strings so the UI
 *     never renders raw translation keys. Professional translations
 *     can be layered on later without changing the code.
 *   • Idempotent — running twice produces identical output.
 *   • Preserves deep-merge behaviour, so unrelated existing keys are
 *     untouched.
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
  const enRaw = await fs.readFile(enPath, "utf8");
  const en = JSON.parse(enRaw);
  const ig = en.instagramCalculator;
  if (!ig) {
    throw new Error("Expected instagramCalculator namespace in en.json");
  }

  // Also carry forward the small nav/hub additions that the new
  // calculator depends on so a stale locale file never leaves the
  // header dropdown missing an entry.
  const additions = {
    footer: {
      instagramCalculator: en.footer?.instagramCalculator ?? "Instagram Money Calculator",
    },
    calculatorsMenu: {
      instagram: en.calculatorsMenu?.instagram ?? {
        label: "Instagram Money Calculator",
        description: "Estimate Instagram creator earnings.",
      },
    },
    popularCalculators: {
      cards: {
        instagram: en.popularCalculators?.cards?.instagram ?? {
          title: "Instagram Money Calculator",
          description:
            "Estimate Instagram creator earnings from reach, reels, stories and engagement.",
        },
      },
    },
    instagramCalculator: ig,
  };

  for (const locale of LOCALES) {
    const filepath = path.join(messagesDir, `${locale}.json`);
    const raw = await fs.readFile(filepath, "utf8");
    const existing = JSON.parse(raw);
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
