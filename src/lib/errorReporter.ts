/**
 * Provider-neutral error reporting abstraction.
 *
 * The default implementation is a no-op — we deliberately do NOT ship
 * with Sentry (or any other provider) enabled by default. When the team
 * chooses a provider, replace the reporter at boot:
 *
 *   ```ts
 *   // src/lib/errorReporter.provider.ts (server-only, imported once)
 *   import * as Sentry from "@sentry/nextjs";
 *   import { setErrorReporter } from "@/lib/errorReporter";
 *
 *   Sentry.init({ dsn: process.env.SENTRY_DSN });
 *
 *   setErrorReporter({
 *     captureException(error, context) {
 *       Sentry.captureException(error, { extra: context });
 *     },
 *     captureMessage(message, context) {
 *       Sentry.captureMessage(message, { extra: context });
 *     },
 *   });
 *   ```
 *
 * Whatever provider is chosen, callers should keep hitting
 * `reportException` and `reportMessage` — the abstraction never leaks.
 *
 * Rules for callers:
 *   - Report ONLY unexpected server-side errors. Expected validation
 *     failures (Zod) and classified upstream errors (YouTubeApiError)
 *     are NOT exceptions — they are normal responses.
 *   - Every field passed in `context` is redacted before it reaches the
 *     provider, using the same rules as the structured logger.
 */

import { redact } from "./logger";

export type ErrorContext = Record<string, unknown>;

export interface ErrorReporter {
  captureException(error: unknown, context?: ErrorContext): void;
  captureMessage(message: string, context?: ErrorContext): void;
}

const noopReporter: ErrorReporter = {
  captureException(): void {
    /* no-op */
  },
  captureMessage(): void {
    /* no-op */
  },
};

let active: ErrorReporter = noopReporter;

/** Get the currently-installed reporter. */
export function getErrorReporter(): ErrorReporter {
  return active;
}

/**
 * Install a reporter. Call once during app boot (server-only). Passing
 * `null` restores the no-op default (useful in tests).
 */
export function setErrorReporter(next: ErrorReporter | null): void {
  active = next ?? noopReporter;
}

/**
 * Public API — always redacts context before handing it to the
 * currently-installed provider.
 */
export function reportException(
  error: unknown,
  context?: ErrorContext,
): void {
  const safeContext = context ? (redact(context) as ErrorContext) : undefined;
  const safeError = redact(error) as unknown;
  try {
    active.captureException(safeError, safeContext);
  } catch {
    // A broken reporter must never take down the request path.
  }
}

export function reportMessage(
  message: string,
  context?: ErrorContext,
): void {
  const safeMessage = redact(message) as string;
  const safeContext = context ? (redact(context) as ErrorContext) : undefined;
  try {
    active.captureMessage(safeMessage, safeContext);
  } catch {
    // Same defensive posture as reportException.
  }
}
