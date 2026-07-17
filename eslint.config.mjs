import path from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";

/**
 * ESLint flat config.
 *
 * We keep the official Next.js presets (`next/core-web-vitals` +
 * `next/typescript`) via `FlatCompat`, plus the project's own rule
 * overrides that were previously in `.eslintrc.json`.
 *
 * Run with `eslint .` (see `package.json`), not the deprecated
 * `next lint`.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  {
    // Global ignores — generated / vendored / build outputs.
    ignores: [
      ".next/**",
      "out/**",
      "coverage/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "playwright-report/**",
      "test-results/**",
      ".vercel/**",
      "next-env.d.ts",
    ],
  },

  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    // Project-wide overrides. Preserved from `.eslintrc.json` — we
    // deliberately do not silently drop any rule that was disabled
    // before, and we do not disable rules "to make CI pass".
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off",
    },
  },

  {
    // The e2e directory (Playwright) is *not* Next.js code. It runs
    // under node with its own execution model.
    files: ["e2e/**/*.{ts,tsx,js,mjs}"],
    rules: {
      // Playwright pages/console/env are fine — the linter's app-specific
      // hooks-rule sometimes over-flags helper functions here.
      "react-hooks/rules-of-hooks": "off",
    },
  },

  {
    // Config files are node scripts, not app code.
    files: [
      "*.config.{js,mjs,ts,cjs}",
      "vitest.setup.ts",
      "playwright.config.ts",
    ],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
    },
  },
];

export default config;
