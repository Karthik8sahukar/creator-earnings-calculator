import { NextResponse } from "next/server";
import { z } from "zod";

import { YouTubeApiError } from "./errors";
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
  // Deliberately generic: do not leak internal error text.
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
  const trustProxy = process.env.TRUST_PROXY === "1";
  const clientId = identifyClient(request.headers, { trustProxy });
  const result = apiLimiter.hit(clientId);

  const headers = new Headers({
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetMs / 1000)),
  });

  if (!result.allowed) {
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

  // Attach rate limit headers to a sentinel we can return; but for our
  // callers we simply return null and let them build their own response.
  // Callers are expected to opt-in to attaching these headers if desired.
  return null;
}
