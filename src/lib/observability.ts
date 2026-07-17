/**
 * Per-request observability context.
 *
 * We use `AsyncLocalStorage` so nested async code (the cache layer, the
 * YouTube client) can annotate the current request with metadata like
 * `cacheStatus` and `upstreamCategory` without threading arguments
 * through everything.
 *
 * The route helpers (`withRouteObservability`) run the handler inside
 * a fresh context and emit exactly one summary log line per request.
 * Individual layers just call `markCache` / `markUpstream`.
 */

import { AsyncLocalStorage } from "node:async_hooks";

import { logger } from "./logger";

export type UpstreamCategory =
  | "success"
  | "quota_exceeded"
  | "timeout"
  | "network_error"
  | "not_found"
  | "invalid_key"
  | "missing_key"
  | "malformed_response"
  | "upstream_error"
  | "forbidden";

export interface RequestContext {
  route: string;
  startedAt: number;
  cacheStatus?: "hit" | "miss";
  upstreamCategory?: UpstreamCategory;
  rateLimit?: "allowed" | "blocked";
  clientId?: string;
}

const store = new AsyncLocalStorage<RequestContext>();

/** Run the given async function inside a fresh request context. */
export function withContext<T>(
  route: string,
  fn: (ctx: RequestContext) => Promise<T>,
): Promise<T> {
  const ctx: RequestContext = {
    route,
    startedAt: Date.now(),
  };
  return store.run(ctx, () => fn(ctx));
}

/** Return the current request context, or undefined outside one. */
export function currentContext(): RequestContext | undefined {
  return store.getStore();
}

/** Note that a cache lookup for this request was a hit or miss. */
export function markCache(status: "hit" | "miss"): void {
  const ctx = store.getStore();
  if (ctx && ctx.cacheStatus === undefined) {
    ctx.cacheStatus = status;
  }
}

/** Note the classified upstream outcome for this request. */
export function markUpstream(category: UpstreamCategory): void {
  const ctx = store.getStore();
  if (ctx) ctx.upstreamCategory = category;
}

/** Note whether the request was allowed or blocked by the rate limiter. */
export function markRateLimit(status: "allowed" | "blocked"): void {
  const ctx = store.getStore();
  if (ctx) ctx.rateLimit = status;
}

/** Note an anonymized client id (already hashed). Never a raw IP. */
export function markClient(id: string): void {
  const ctx = store.getStore();
  if (ctx) ctx.clientId = id;
}

/**
 * Emit exactly one summary log line for the finished request. The
 * fields written match the observability contract: route, status,
 * durationMs, cacheStatus, upstreamCategory, rateLimit, error code.
 *
 * IMPORTANT: this must never receive raw IPs, user-agent strings, or
 * upstream request URLs. Those are excluded by construction.
 */
export function logRequestSummary(fields: {
  route: string;
  status: number;
  startedAt: number;
  code?: string;
  cacheStatus?: "hit" | "miss";
  upstreamCategory?: UpstreamCategory;
  rateLimit?: "allowed" | "blocked";
  clientId?: string;
}): void {
  const durationMs = Date.now() - fields.startedAt;
  const level: "info" | "warn" | "error" =
    fields.status >= 500 ? "error" : fields.status >= 400 ? "warn" : "info";
  logger[level]("api.request", {
    route: fields.route,
    status: fields.status,
    durationMs,
    code: fields.code,
    cacheStatus: fields.cacheStatus,
    upstreamCategory: fields.upstreamCategory,
    rateLimit: fields.rateLimit,
    clientId: fields.clientId,
  });
}
