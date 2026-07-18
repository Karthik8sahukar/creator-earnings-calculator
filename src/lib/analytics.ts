/**
 * Provider-neutral, opt-in product analytics.
 *
 * DEFAULT BEHAVIOUR: analytics are DISABLED. The default implementation
 * is a no-op that never contacts any third party and never sets a
 * cookie. That is why the app does not ship with a cookie banner.
 *
 * To enable analytics later:
 *
 *   1. Set `NEXT_PUBLIC_ANALYTICS_ENABLED=1` in your environment.
 *      (This is only a signal — no provider auto-loads. It is what
 *      `isAnalyticsEnabled()` returns, so guards can decide whether
 *      to load a heavier client bundle.)
 *   2. Create a small bootstrap module — e.g. `analytics.provider.ts`
 *      — that calls `setAnalytics({ track(event) { ... } })` at boot,
 *      forwarding to your provider (Plausible, PostHog, Umami, …).
 *   3. If your provider requires a cookie banner, add one guarded on
 *      `isAnalyticsEnabled()`. The abstraction here does not itself
 *      require or set cookies.
 *
 * WHAT WE ALLOW:
 *   - `search.submitted`             (search happened; queryLength only)
 *   - `channel.selected`             (public channel id)
 *   - `calculator.assumption_changed` (field name only; no value)
 *   - `share.link_copied`            (target of the copy button)
 *   - `share.native_shared`
 *   - `share.social_opened`          ({ target: "x"|"linkedin"|"whatsapp" })
 *   - `additional_calculator.opened` (kind of calc)
 *   - `instagram_calculator.opened`
 *   - `instagram_calculator.completed`     (no raw earnings values)
 *   - `instagram_calculator.share_link_created`
 *   - `instagram_calculator.currency_changed`
 *   - `instagram_calculator.results_copied`
 *   - `instagram_calculator.advanced_opened`
 *
 * WHAT WE NEVER SEND:
 *   - The YouTube API key.
 *   - Raw search text (only queryLength; never the query itself).
 *   - Full IP addresses (impossible from this abstraction anyway).
 *   - Anything that could be considered private user information.
 *
 * The strong typing on `AnalyticsEvent` is intentional: any event that
 * isn't in the union above will fail to compile, so we can't
 * accidentally ship a new field that leaks user text.
 */

// ---------- Public event vocabulary ----------

export type AnalyticsEvent =
  | { name: "search.submitted"; queryLength: number; resultCount?: number }
  | {
      name: "channel.selected";
      channelId: string;
      source?: "search" | "recent" | "direct";
    }
  | { name: "calculator.assumption_changed"; field: string }
  | {
      name: "share.link_copied";
      // Where in the app the copy button was fired from. Extend this
      // union when you add a new share surface — the compile error
      // that follows is the point.
      target: "calculator" | "share_section" | "blog_article";
    }
  | { name: "share.native_shared" }
  | {
      name: "share.social_opened";
      target: "x" | "linkedin" | "whatsapp";
    }
  | {
      name: "additional_calculator.opened";
      kind: "rpm" | "cpm" | "shorts" | "sponsorship";
    }
  // ─── Instagram Money Calculator ────────────────────────────────
  //
  // The Instagram calculator DELIBERATELY does not report raw
  // earnings. Its analytics carry only structural fields — never
  // dollar amounts — so we can measure engagement with the tool
  // without leaking a user's private income estimate.
  | { name: "instagram_calculator.opened" }
  | {
      name: "instagram_calculator.completed";
      /** Which monetization streams were enabled. Booleans only. */
      streams: {
        posts: boolean;
        reels: boolean;
        stories: boolean;
        affiliate: boolean;
        subscriptions: boolean;
      };
      /** Bucketed follower size — a coarse label, never the raw count. */
      followerBucket: "nano" | "micro" | "mid" | "macro" | "mega";
    }
  | { name: "instagram_calculator.share_link_created" }
  | { name: "instagram_calculator.currency_changed"; currency: string }
  | { name: "instagram_calculator.results_copied" }
  | { name: "instagram_calculator.advanced_opened" };

export type AnalyticsEventName = AnalyticsEvent["name"];

// ---------- Abstraction ----------

export interface AnalyticsClient {
  track(event: AnalyticsEvent): void;
  /** Optional identify hook — most providers use it. No-op default. */
  identify?(id: string, traits?: Record<string, unknown>): void;
}

const noopAnalytics: AnalyticsClient = {
  track() {
    /* no-op */
  },
};

let active: AnalyticsClient = noopAnalytics;

/** Get the currently-installed analytics client. */
export function getAnalytics(): AnalyticsClient {
  return active;
}

/**
 * Install a client at boot. Passing `null` restores the no-op default
 * (useful in tests).
 */
export function setAnalytics(next: AnalyticsClient | null): void {
  active = next ?? noopAnalytics;
}

/**
 * Whether product analytics are configured to be enabled. The default
 * is `false`. Consumers should NOT run any tracking side effects (or
 * show a consent UI) when this returns `false`.
 */
export function isAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "1";
}

// ---------- Redaction ----------

/**
 * Keys that are never allowed to be attached to an analytics event,
 * even indirectly. Compared case-insensitively.
 *
 * NB: The `AnalyticsEvent` union is already strict — but this is
 * defense-in-depth for anyone constructing an event dynamically.
 */
const SENSITIVE_FIELDS = new Set(
  [
    "apiKey",
    "api_key",
    "youtubeApiKey",
    "youtube_api_key",
    "key",
    "token",
    "authorization",
    "cookie",
    "password",
    "secret",
    "email",
    "phone",
    "ip",
    "userAgent",
    "referer",
    // Never send raw search text.
    "query",
    "q",
    "queryText",
    "search",
  ].map((s) => s.toLowerCase()),
);

const KEY_LIKE_PATTERN = /AIza[0-9A-Za-z_-]{20,}/g;

function scrub(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[REDACTED]";
  if (value == null) return value;
  if (typeof value === "string") {
    return value.replace(KEY_LIKE_PATTERN, "[REDACTED]");
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.has(k.toLowerCase())) {
        out[k] = "[REDACTED]";
        continue;
      }
      out[k] = scrub(v, depth + 1);
    }
    return out;
  }
  return "[REDACTED]";
}

// ---------- Public track() ----------

/**
 * Track a product event. Safe to call from anywhere: when analytics
 * are disabled the call is a no-op. All fields are scrubbed for
 * accidental secrets before reaching the provider.
 */
export function track(event: AnalyticsEvent): void {
  const scrubbed = scrub(event) as AnalyticsEvent;
  try {
    active.track(scrubbed);
  } catch {
    // A broken provider must never take down the UI.
  }
}
