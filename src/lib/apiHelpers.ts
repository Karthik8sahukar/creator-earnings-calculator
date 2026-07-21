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
  "UNSUPPORTED_INPUT",
  "INTERNAL_ERROR",
]);

export function safeErrorResponse(err: unknown): NextResponse {
  if (err instanceof YouTubeApiError) {
    const code = SAFE_CODES.has(err.code) ? err.code : "UPSTREAM_ERROR";
    return NextResponse.json(
      { error: code, message: err.message },
      { status: err.status },
    );
  }
  if (err instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: "INVALID_QUERY",
        message: err.issues[0]?.message ?? "Invalid request",
      },
      { status: 400 },
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
    { error: "INTERNAL_ERROR", message: "Unexpected server error." },
    { status: 500 },
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
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        message:
          "Too many requests. Please slow down and try again shortly.",
      },
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
      // The response body always includes `error` for non-success paths.
      if (response.status >= 400) {
        const cloned = response.clone();
        const parsed = (await cloned.json().catch(() => null)) as
          | { error?: string }
          | null;
        errorCode = parsed?.error;
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
