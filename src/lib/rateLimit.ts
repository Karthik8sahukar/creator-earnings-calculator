/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Suitable for an MVP or a single-instance deployment. For distributed
 * deployments swap the internal Map for a Redis-based token store — the
 * public API doesn't need to change.
 *
 * We DO NOT blindly trust forwarded headers. We accept a proxy-provided
 * client identifier only when the caller explicitly opts in via a
 * `trustProxy` argument to `identifyClient`. The default is safer:
 * fall back to a coarse identifier (`unknown`) rather than let a random
 * `X-Forwarded-For` header shard the limiter.
 */

export interface RateLimitOptions {
  /** Max requests per window. */
  limit: number;
  /** Window duration in milliseconds. */
  windowMs: number;
  now?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Remaining tokens in the current window. */
  remaining: number;
  /** Milliseconds until the current window resets. */
  resetMs: number;
  /** Seconds to wait before retrying (only meaningful when !allowed). */
  retryAfterSeconds: number;
  limit: number;
}

interface Bucket {
  timestamps: number[];
}

export class SlidingWindowLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  constructor(opts: RateLimitOptions) {
    if (opts.limit <= 0) throw new Error("limit must be > 0");
    if (opts.windowMs <= 0) throw new Error("windowMs must be > 0");
    this.limit = opts.limit;
    this.windowMs = opts.windowMs;
    this.now = opts.now ?? Date.now;
  }

  /** Number of tracked identifiers (for tests and monitoring). */
  get bucketCount(): number {
    return this.buckets.size;
  }

  clear() {
    this.buckets.clear();
  }

  hit(clientId: string): RateLimitResult {
    const now = this.now();
    const windowStart = now - this.windowMs;

    let bucket = this.buckets.get(clientId);
    if (!bucket) {
      bucket = { timestamps: [] };
      this.buckets.set(clientId, bucket);
    }

    // Drop expired timestamps.
    while (bucket.timestamps.length > 0 && bucket.timestamps[0] <= windowStart) {
      bucket.timestamps.shift();
    }

    if (bucket.timestamps.length >= this.limit) {
      const oldest = bucket.timestamps[0];
      const resetMs = oldest + this.windowMs - now;
      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(resetMs, 0),
        retryAfterSeconds: Math.max(Math.ceil(resetMs / 1000), 1),
        limit: this.limit,
      };
    }

    bucket.timestamps.push(now);
    return {
      allowed: true,
      remaining: this.limit - bucket.timestamps.length,
      resetMs: this.windowMs,
      retryAfterSeconds: 0,
      limit: this.limit,
    };
  }
}

/**
 * Extract a stable-ish client identifier from request headers without
 * blindly trusting anything sent by the client.
 *
 * We only honour `x-forwarded-for` when the caller explicitly opts in
 * (`trustProxy: true`) — e.g. because they are running behind a known
 * reverse proxy. Otherwise we use `x-real-ip` when set by a trusted
 * platform, or fall back to a shared identifier.
 */
export function identifyClient(
  headers: Headers,
  opts: { trustProxy?: boolean } = {},
): string {
  if (opts.trustProxy) {
    const xff = headers.get("x-forwarded-for");
    if (xff) {
      // Take the first entry (client) and normalise.
      const first = xff.split(",")[0]?.trim();
      if (first) return anonymize(first);
    }
  }

  // Platform-provided (Vercel sets this from its own edge).
  const realIp = headers.get("x-real-ip");
  if (realIp) return anonymize(realIp.trim());

  // Last resort — we deliberately do NOT create a per-request random id
  // because that would defeat rate limiting entirely.
  return "anonymous";
}

/**
 * We identify the caller without ever storing the raw IP. A stable hash
 * is enough to bucket requests but doesn't linger as identifiable data.
 */
function anonymize(input: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `c_${h.toString(36)}`;
}

/** Default limiter used by API routes. Configurable via env. */
const DEFAULT_LIMIT = Number(process.env.RATE_LIMIT_MAX ?? 60);
const DEFAULT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);

export const apiLimiter = new SlidingWindowLimiter({
  limit: Number.isFinite(DEFAULT_LIMIT) && DEFAULT_LIMIT > 0 ? DEFAULT_LIMIT : 60,
  windowMs:
    Number.isFinite(DEFAULT_WINDOW_MS) && DEFAULT_WINDOW_MS > 0
      ? DEFAULT_WINDOW_MS
      : 60_000,
});
