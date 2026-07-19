/**
 * Server-only environment configuration.
 *
 * `import "server-only"` guarantees that if a client component
 * accidentally imports this module the build fails — the API key,
 * timeouts, rate-limit and trust-proxy settings never reach the browser.
 *
 * Validation uses Zod so misconfiguration surfaces at boot with a
 * clear error rather than a confusing runtime failure. The error text
 * intentionally does NOT include raw values (they could be secrets).
 *
 * We deliberately allow `YOUTUBE_API_KEY` to be absent at parse time
 * so that:
 *   - `next build` succeeds without a real key (build must never hit
 *     the YouTube API).
 *   - The API route wrapper (`src/lib/youtube.ts`) surfaces a specific
 *     `MISSING_API_KEY` error to the client at request time, which is
 *     mapped through our safe error handler.
 */

import "server-only";

import { z } from "zod";

const RAW = {
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  YOUTUBE_TIMEOUT_MS: process.env.YOUTUBE_TIMEOUT_MS,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  TRUST_PROXY: process.env.TRUST_PROXY,
} as const;

/**
 * A string-or-undefined that coerces empty strings to undefined, then
 * pipes through an inner schema that provides defaults and bounds.
 */
function intFromEnv(opts: {
  defaultValue: number;
  min: number;
  max: number;
}) {
  return z
    .union([z.string(), z.undefined()])
    .transform((v) => {
      if (v === undefined) return opts.defaultValue;
      const trimmed = v.trim();
      if (trimmed === "") return opts.defaultValue;
      const n = Number(trimmed);
      return Number.isFinite(n) ? Math.trunc(n) : Number.NaN;
    })
    .pipe(
      z
        .number({ invalid_type_error: "must be an integer" })
        .int()
        .min(opts.min)
        .max(opts.max),
    );
}

/**
 * A boolean env flag. Truthy values: `1`, `true`, `yes`, `on`.
 * Anything else (including missing) is false.
 */
const booleanFromEnv = z
  .union([z.string(), z.undefined()])
  .transform((v) => {
    if (v === undefined) return false;
    const s = v.trim().toLowerCase();
    return s === "1" || s === "true" || s === "yes" || s === "on";
  });

const serverSchema = z.object({
  YOUTUBE_API_KEY: z
    .union([z.string(), z.undefined()])
    .transform((v) => (v ?? "").trim()),
  YOUTUBE_TIMEOUT_MS: intFromEnv({
    defaultValue: 8000,
    min: 100,
    max: 60_000,
  }),
  RATE_LIMIT_MAX: intFromEnv({
    defaultValue: 60,
    min: 1,
    max: 10_000,
  }),
  RATE_LIMIT_WINDOW_MS: intFromEnv({
    defaultValue: 60_000,
    min: 1_000,
    max: 3_600_000,
  }),
  TRUST_PROXY: booleanFromEnv,
});

/**
 * Turn a Zod parse failure into a developer-friendly message that
 * NEVER contains raw values (which could include secrets).
 */
function formatIssuesForDev(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

const parsed = serverSchema.safeParse(RAW);

if (!parsed.success) {
  const details = formatIssuesForDev(parsed.error);
  console.error(
    `Invalid server environment configuration.\n${details}\n` +
      `See .env.example for the expected variables.`,
  );
  throw new Error("Invalid server environment configuration.");
}

// Warn (never fatal) if the operator misconfigured the API key with a
// `NEXT_PUBLIC_` prefix. That prefix inlines the value into every
// client bundle Next.js builds — leaking a server secret to the
// browser. Detecting this at boot means the mistake surfaces on the
// very first deployment log, not later in a security review.
if (typeof process.env.NEXT_PUBLIC_YOUTUBE_API_KEY === "string") {
  console.warn(
    "NEXT_PUBLIC_YOUTUBE_API_KEY is set. The YouTube API key MUST be a server-only variable named `YOUTUBE_API_KEY`. " +
      "The `NEXT_PUBLIC_` prefix inlines its value into every client bundle. Remove that variable in your hosting provider (e.g. Vercel → Project → Settings → Environment Variables) and set `YOUTUBE_API_KEY` instead.",
  );
}

const data = parsed.data;

export const serverEnv = Object.freeze({
  /** May be empty at build time; runtime code throws MISSING_API_KEY. */
  youtubeApiKey: data.YOUTUBE_API_KEY,
  youtubeTimeoutMs: data.YOUTUBE_TIMEOUT_MS,
  rateLimitMax: data.RATE_LIMIT_MAX,
  rateLimitWindowMs: data.RATE_LIMIT_WINDOW_MS,
  trustProxy: data.TRUST_PROXY,
});

export type ServerEnv = typeof serverEnv;

/**
 * Structured readiness view — safe to expose from `/api/health`.
 * Never leak the key itself; only "configured or not".
 */
export function isYoutubeApiConfigured(): boolean {
  return serverEnv.youtubeApiKey.length > 0;
}
