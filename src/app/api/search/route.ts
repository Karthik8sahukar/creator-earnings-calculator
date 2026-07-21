import { NextResponse } from "next/server";

import {
  applyRateLimit,
  safeErrorResponse,
  withRouteObservability,
} from "@/lib/apiHelpers";
import { markCache, markRateLimit } from "@/lib/observability";
import {
  identifyClient,
  searchLimiter,
  SEARCH_RATE_LIMIT_MAX,
  SEARCH_RATE_LIMIT_WINDOW_MS,
} from "@/lib/rateLimit";
import { searchQuerySchema } from "@/lib/schemas";
import { serverEnv } from "@/lib/env.server";
import { isSearchCached, searchChannels } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=<query>
 *
 * Response envelope:
 *   Success: { success: true, results: ChannelSearchResult[] }
 *   Error  : { success: false, error: { code, message } }
 *
 * Quota-efficiency layer:
 *
 *   1. We peek the in-process cache BEFORE any rate limiting. A cache
 *      hit costs zero YouTube quota, so it makes no sense to spend a
 *      strict-limiter token on it — repeated identical queries from
 *      one user are effectively free.
 *
 *   2. On a cache miss we apply the STRICTER `searchLimiter` (10 unique
 *      searches per minute per client) in addition to the general
 *      `applyRateLimit` (60/min by default). Only unique upstream
 *      calls count against this budget.
 *
 * `Cache-Control: no-store` remains on the response — the in-process
 * cache is the authoritative caching layer, and we intentionally keep
 * shared caches (CDNs, browsers, proxies) out of the loop so a stale
 * response never poisons another user.
 */
export async function GET(request: Request) {
  return withRouteObservability("api.search", async () => {
    // ---- General per-client API rate limit (existing) ----
    const limited = applyRateLimit(request);
    if (limited) return limited;

    // ---- Validate the query ----
    const url = new URL(request.url);
    const parsed = searchQuerySchema.safeParse({
      q: url.searchParams.get("q") ?? "",
    });
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_QUERY",
            message:
              parsed.error.issues[0]?.message ?? "Please enter a search query.",
          },
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    // ---- Peek the cache: hits do NOT consume the strict budget ----
    const cached = isSearchCached(parsed.data.q);
    if (cached) {
      markCache("hit");
    } else {
      // Only unique upstream searches consume tokens from the strict
      // search limiter. A user repeatedly hitting "Enter" on the same
      // query is served entirely from cache.
      const clientId = identifyClient(request.headers, {
        trustProxy: serverEnv.trustProxy,
      });
      const decision = searchLimiter.hit(clientId);
      if (!decision.allowed) {
        markRateLimit("blocked");
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message:
                "Too many unique searches. Please wait a moment and try again.",
            },
          },
          {
            status: 429,
            headers: {
              "Cache-Control": "no-store",
              "Retry-After": String(decision.retryAfterSeconds),
              "X-RateLimit-Limit": String(SEARCH_RATE_LIMIT_MAX),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Window": String(SEARCH_RATE_LIMIT_WINDOW_MS),
            },
          },
        );
      }
    }

    try {
      const results = await searchChannels(parsed.data.q);
      return NextResponse.json(
        { success: true, results },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (err) {
      return safeErrorResponse(err);
    }
  });
}
