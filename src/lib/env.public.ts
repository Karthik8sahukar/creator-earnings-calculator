/**
 * Public environment configuration.
 *
 * Values here are read from `NEXT_PUBLIC_*` variables, which Next.js
 * inlines into client bundles at build time. This module is therefore
 * safe to import from client or server code — but it MUST NOT contain
 * anything secret.
 *
 * Validation uses Zod so misconfiguration is caught at boot with a
 * clear error, rather than surfacing later as mysterious runtime bugs.
 */

import { z } from "zod";

const RAW = {
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NODE_ENV: process.env.NODE_ENV,
} as const;

const isProduction = RAW.NODE_ENV === "production";

const siteUrlSchema = isProduction
  ? z
      .string({
        required_error:
          "NEXT_PUBLIC_SITE_URL must be set to an absolute URL in production.",
      })
      .url("NEXT_PUBLIC_SITE_URL must be a valid absolute URL in production.")
  : z.string().url().or(z.string().length(0)).optional();

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_NAME: z
    .string()
    .min(1)
    .default("Creator Earnings Calculator"),
  NEXT_PUBLIC_SITE_URL: siteUrlSchema,
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
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

const parsed = publicSchema.safeParse(RAW);

if (!parsed.success) {
  const details = formatIssuesForDev(parsed.error);
  // Log but do not include env values. Fail fast: this is a boot-time
  // misconfiguration that would otherwise cause opaque failures later.
  console.error(
    `Invalid public environment configuration.\n${details}\n` +
      `See .env.example for the expected variables.`,
  );
  throw new Error("Invalid public environment configuration.");
}

const data = parsed.data;

const normalizedSiteUrl = (
  data.NEXT_PUBLIC_SITE_URL && data.NEXT_PUBLIC_SITE_URL.length > 0
    ? data.NEXT_PUBLIC_SITE_URL
    : "http://localhost:3000"
).replace(/\/$/, "");

export const publicEnv = Object.freeze({
  siteName: data.NEXT_PUBLIC_SITE_NAME,
  siteUrl: normalizedSiteUrl,
  nodeEnv: data.NODE_ENV,
  isProduction: data.NODE_ENV === "production",
  isDevelopment: data.NODE_ENV === "development",
  isTest: data.NODE_ENV === "test",
});

export type PublicEnv = typeof publicEnv;
