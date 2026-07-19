import { NextResponse } from "next/server";
import { z } from "zod";

import { serverEnv } from "./env.server";
import { reportException } from "./errorReporter";
import { YouTubeApiError } from "./errors";
import {
  currentContext,
  logRequestSummary,
  markClient,
  markRateLimit,
  withContext,
  type RequestContext,
} from "./observability";
import { apiLimiter, identifyClient } from "./rateLimit";

/**
 * Common response helpers for API routes.
 *
 * The important invariant here is that we NEVER include:
 *   - The YouTube API key
 *   - Raw upstream response bodies
 *   - Stack traces
 *   - Internal file paths
 *   - Any environment variable
 *
 * in the JSON we return to the client. Only stable public codes and
 * short, user-safe messages are exposed.
 */

/**
 * Stable public error codes. Anything not in this set is rewritten to
 * a safe generic before being returned to the client, so we can never
 * accidentally leak an internal-looking code.
 */
const SAFE_CODES = new Set([
  "INVALID_QUERY",
  "NOT_FOUND",
  "QUOTA_EXCEEDED",
  "RATE_LIMITED",
  "UPSTREAM_TIMEOUT",
  "UPSTREAM_UNAVAILABLE",
  "UPSTREAM_ERROR",
  "MALFORMED_UPSTREAM",
  "NETWORK_ERROR",
  "FORBIDDEN",
  "INVALID_API_KEY",
  "MISSING_API_KEY",
  "KEY_RESTRICTED",
  "API_DISABLED",
  "BAD_REQUEST",
  "YOUTUBE_API_ERROR",
  "INTERNAL_ERROR",
]);

/**
 * Build the canonical error response envelope used by every API route.
 *
 * Shape:
 *   { "success": false, "error": { "code": "…", "message": "…" } }
 *
 * A separate `error` string field is intentionally NOT included at the
 * top level — the nested object is the single source of truth, so the
 * frontend can rely on `body.error.code` and `body.error.message`.
 */
function errorEnvelope(code: string, message: string) {
  return { success: false as const, error: { code, message } };
}

export function safeErrorResponse(err: unknown): NextResponse {
  if (err instanceof YouTubeApiError) {
    const code = SAFE_CODES.has(err.code) ? err.code : "YOUTUBE_API_ERROR";
    return NextResponse.json(errorEnvelope(code, err.message), {
      status: err.status,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (err instanceof z.ZodError) {
    return NextResponse.json(
      errorEnvelope(
        "INVALID_QUERY",
        err.issues[0]?.message ?? "Invalid request",
      ),
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  // Anything reaching this branch is unexpected — report it (redacted)
  // and return a generic message. YouTubeApiError and ZodError above
  // are expected, classified responses and are NOT reported.
  const ctx = currentContext();
  reportException(err, {
    route: ctx?.route,
    cacheStatus: ctx?.cacheStatus,
    upstreamCategory: ctx?.upstreamCategory,
  });
  return NextResponse.json(
    errorEnvelope("INTERNAL_ERROR", "Unexpected server error."),
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * Apply rate limiting to a request. Returns a NextResponse (429) when
 * the caller is over budget, or null to indicate the request may proceed.
 */
export function applyRateLimit(request: Request): NextResponse | null {
  const clientId = identifyClient(request.headers, {
    trustProxy: serverEnv.trustProxy,
  });
  markClient(clientId);
  const result = apiLimiter.hit(clientId);

  const headers = new Headers({
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetMs / 1000)),
  });

  if (!result.allowed) {
    markRateLimit("blocked");
    headers.set("Retry-After", String(result.retryAfterSeconds));
    headers.set("Cache-Control", "no-store");
    return NextResponse.json(
      errorEnvelope(
        "RATE_LIMITED",
        "Too many requests. Please slow down and try again shortly.",
      ),
      { status: 429, headers },
    );
  }

  markRateLimit("allowed");
  // Attach rate limit headers to a sentinel we can return; but for our
  // callers we simply return null and let them build their own response.
  // Callers are expected to opt-in to attaching these headers if desired.
  return null;
}

/**
 * Wrap an API route handler with:
 *   - A per-request observability context (populated by lower layers)
 *   - A single summary log line at the end (status, duration, cache
 *     result, upstream category, rate-limit result, error code).
 *
 * Any unexpected exception is funnelled through `safeErrorResponse`
 * so the response body never leaks internals.
 *
 * The wrapper never records raw IP, user agent, or the full request URL.
 */
export function withRouteObservability(
  route: string,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  return withContext(route, async (ctx: RequestContext) => {
    let response: NextResponse;
    let errorCode: string | undefined;
    try {
      response = await handler();
    } catch (err) {
      response = safeErrorResponse(err);
    }

    try {
      // The response body always includes an error descriptor for
      // non-success paths. Read the new nested `error.code`, but also
      // accept the legacy flat `error: "CODE"` shape so old fixtures
      // and hand-written mocks keep working.
      if (response.status >= 400) {
        const cloned = response.clone();
        const parsed = (await cloned.json().catch(() => null)) as
          | { error?: string | { code?: string } }
          | null;
        if (parsed && typeof parsed.error === "string") {
          errorCode = parsed.error;
        } else if (parsed && parsed.error && typeof parsed.error === "object") {
          errorCode = parsed.error.code;
        }
      }
    } catch {
      // ignore — we still log the status
    }

    logRequestSummary({
      route: ctx.route,
      status: response.status,
      startedAt: ctx.startedAt,
      code: errorCode,
      cacheStatus: ctx.cacheStatus,
      upstreamCategory: ctx.upstreamCategory,
      rateLimit: ctx.rateLimit,
      clientId: ctx.clientId,
    });

    return response;
  });
}
