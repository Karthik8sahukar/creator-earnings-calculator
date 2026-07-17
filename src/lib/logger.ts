/**
 * Small, provider-neutral structured logger for server-side code.
 *
 * The goal is that every log line is:
 *   - JSON on one line (easy to ship to Loki, Datadog, CloudWatch, etc.)
 *   - Free of secrets (see `redact()`)
 *   - Enriched with the fields required by the observability contract
 *     (route, HTTP status, duration, cache result, upstream category)
 *
 * The default implementation writes to `console`. To swap the backend
 * (Sentry breadcrumbs, Datadog, Axiom, Pino, ...) implement `Logger`
 * and call `setLogger(myLogger)` at boot from a server module.
 *
 * ANYTHING that could contain a secret is redacted BEFORE the sink
 * sees it. Callers should still avoid passing raw request URLs or
 * headers — but the redaction layer is our defense-in-depth.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

export interface Logger {
  debug(event: string, fields?: LogFields): void;
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
  child(bindings: LogFields): Logger;
}

// ---------- Redaction ----------

/**
 * Header names that must never appear in logs even in dev.
 * Compared case-insensitively.
 */
const SENSITIVE_HEADER_KEYS = new Set(
  [
    "authorization",
    "proxy-authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "api-key",
    "x-auth-token",
    "x-goog-api-key",
    "x-forwarded-for",
    "x-real-ip",
    "user-agent",
    "referer",
  ].map((k) => k.toLowerCase()),
);

/** Object keys that must be redacted regardless of value. */
const SENSITIVE_FIELD_KEYS = new Set(
  [
    "apiKey",
    "api_key",
    "youtubeApiKey",
    "youtube_api_key",
    "YOUTUBE_API_KEY",
    "key",
    "secret",
    "password",
    "token",
    "authorization",
    "ip",
    "userAgent",
    "user_agent",
    "userAgent",
    "referer",
    "cookie",
  ].map((k) => k.toLowerCase()),
);

/**
 * Value patterns we redact wherever they appear. These catch cases
 * where a secret was formatted into a larger string (e.g. a URL that
 * still contains `key=AIza…` even after best-effort scrubbing).
 */
const REDACT_VALUE_PATTERNS: RegExp[] = [
  // Google-style API keys.
  /AIza[0-9A-Za-z_-]{20,}/g,
  // `key=<something>` inside a URL. Keep the parameter name so callers
  // can still tell one existed, but zap the value.
  /([?&](?:key|api_key|apikey)=)[^&#\s]+/gi,
  // Bearer tokens.
  /(Bearer\s+)[A-Za-z0-9._~+/\-]{6,}=?/gi,
];

const REDACTED = "[REDACTED]";
const MAX_DEPTH = 8;

/**
 * Recursively redact secrets from a value. Never mutates its input.
 */
export function redact<T>(value: T): T {
  return redactImpl(value, 0, new WeakSet()) as T;
}

function redactImpl(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (depth > MAX_DEPTH) return REDACTED;
  if (value == null) return value;

  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    if (seen.has(value)) return REDACTED;
    seen.add(value);
    return value.map((v) => redactImpl(v, depth + 1, seen));
  }

  if (value instanceof Error) {
    // Don't include stack in dev unless someone explicitly opts in via
    // fields.stack; the shape is safe (name + code + message).
    const err = value as Error & { code?: string };
    return {
      name: err.name,
      code: err.code,
      message: redactString(err.message ?? ""),
    };
  }

  if (typeof value === "object") {
    if (seen.has(value as object)) return REDACTED;
    seen.add(value as object);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_FIELD_KEYS.has(k.toLowerCase())) {
        out[k] = REDACTED;
        continue;
      }
      out[k] = redactImpl(v, depth + 1, seen);
    }
    return out;
  }

  // Functions, symbols, bigints etc. — drop from logs entirely.
  return REDACTED;
}

function redactString(input: string): string {
  let out = input;
  for (const pattern of REDACT_VALUE_PATTERNS) {
    // Some patterns use capture groups to keep param names.
    out = out.replace(pattern, (match, prefix) => {
      if (prefix) return `${prefix}${REDACTED}`;
      return REDACTED;
    });
  }
  return out;
}

/**
 * Given a Headers object, return a safe-to-log summary that:
 *   - Drops sensitive headers entirely
 *   - Truncates surviving values
 */
export function summarizeHeaders(headers: Headers): Record<string, string> {
  const summary: Record<string, string> = {};
  headers.forEach((value, key) => {
    if (SENSITIVE_HEADER_KEYS.has(key.toLowerCase())) return;
    summary[key] =
      value.length > 128 ? `${value.slice(0, 128)}…` : value;
  });
  return summary;
}

// ---------- Default console-backed logger ----------

function shouldPrintDebug(): boolean {
  // Only in explicit debug mode. Never in production.
  return process.env.NODE_ENV !== "production" && process.env.LOG_DEBUG === "1";
}

function serialize(level: LogLevel, event: string, fields: LogFields): string {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...redact(fields),
  };
  try {
    return JSON.stringify(payload);
  } catch {
    // Fallback if fields contain something JSON.stringify can't handle.
    return JSON.stringify({
      ts: payload.ts,
      level,
      event,
      msg: "log payload was not serializable",
    });
  }
}

class ConsoleLogger implements Logger {
  private readonly bindings: LogFields;
  constructor(bindings: LogFields = {}) {
    this.bindings = bindings;
  }
  private merged(fields?: LogFields): LogFields {
    return fields ? { ...this.bindings, ...fields } : { ...this.bindings };
  }
  debug(event: string, fields?: LogFields): void {
    if (!shouldPrintDebug()) return;
    console.log(serialize("debug", event, this.merged(fields)));
  }
  info(event: string, fields?: LogFields): void {
    console.log(serialize("info", event, this.merged(fields)));
  }
  warn(event: string, fields?: LogFields): void {
    console.warn(serialize("warn", event, this.merged(fields)));
  }
  error(event: string, fields?: LogFields): void {
    console.error(serialize("error", event, this.merged(fields)));
  }
  child(bindings: LogFields): Logger {
    return new ConsoleLogger({ ...this.bindings, ...bindings });
  }
}

let activeLogger: Logger = new ConsoleLogger();

/** Get the currently-installed logger. */
export function getLogger(): Logger {
  return activeLogger;
}

/** Swap the backing logger. Call once during app boot. */
export function setLogger(next: Logger): void {
  activeLogger = next;
}

/** Convenience — a default logger you can just import. */
export const logger: Logger = {
  debug: (e, f) => getLogger().debug(e, f),
  info: (e, f) => getLogger().info(e, f),
  warn: (e, f) => getLogger().warn(e, f),
  error: (e, f) => getLogger().error(e, f),
  child: (b) => getLogger().child(b),
};
