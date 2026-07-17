/**
 * Tests for the structured logger + redaction.
 *
 * The contract we lock in:
 *   1. Google API keys never appear in a log line — even if they are
 *      passed inside URLs, headers, or arbitrary strings.
 *   2. `key=`, `api_key=`, and `apikey=` URL parameter *values* are
 *      redacted, but the parameter *name* is kept for observability.
 *   3. Object keys that look sensitive (apiKey, secret, token, etc.)
 *      are always redacted regardless of value.
 *   4. `summarizeHeaders()` drops sensitive HTTP headers wholesale.
 *   5. `Error` values are serialized to `{name, code, message}` and
 *      never carry their stack trace into the log.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ConsoleSpy,
  redact,
  summarizeHeaders,
} from "./_helpers";

import {
  getLogger,
  logger,
  setLogger,
  type Logger,
} from "../logger";

describe("redact()", () => {
  it("strips Google API keys anywhere in a string", () => {
    const url =
      "https://googleapis.com/youtube/v3/search?q=cats&key=AIzaSyC-abcdefghijklmnopqrstuvwxyz1234";
    const out = redact(url) as string;
    expect(out).not.toContain("AIzaSyC-abcdefghijklmnopqrstuvwxyz1234");
    expect(out).toContain("key=");
    expect(out).toContain("[REDACTED]");
  });

  it("redacts api_key= and apikey= query params too", () => {
    for (const name of ["api_key", "apikey"]) {
      const url = `https://example.com/x?${name}=super-secret-value&y=1`;
      const out = redact(url) as string;
      expect(out).not.toContain("super-secret-value");
      expect(out).toContain(`${name}=`);
    }
  });

  it("redacts Bearer tokens", () => {
    const s = "Authorization: Bearer aaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const out = redact(s) as string;
    expect(out).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("recursively redacts object keys that look sensitive", () => {
    const input = {
      route: "api.search",
      status: 200,
      apiKey: "AIzaTOPSECRET",
      nested: {
        token: "xyz",
        password: "letmein",
        safe: "yes",
      },
    };
    const out = redact(input) as Record<string, unknown>;
    expect(out.route).toBe("api.search");
    expect(out.status).toBe(200);
    expect(out.apiKey).toBe("[REDACTED]");
    const nested = out.nested as Record<string, unknown>;
    expect(nested.token).toBe("[REDACTED]");
    expect(nested.password).toBe("[REDACTED]");
    expect(nested.safe).toBe("yes");
  });

  it("normalizes Error values to a safe shape without stack traces", () => {
    const REAL_KEY = "AIzaSyC-abcdefghijklmnopqrstuvwxyz1234";
    const err = new Error(`boom /root/foo ${REAL_KEY}`);
    err.stack = "Error: boom\n  at Object.<anonymous> (/tmp/x.js:1:1)";
    const out = redact({ err } as unknown) as {
      err: Record<string, unknown>;
    };
    expect(out.err.stack).toBeUndefined();
    expect(String(out.err.message)).not.toContain(REAL_KEY);
    expect(out.err.name).toBe("Error");
  });

  it("handles null, undefined, and primitives", () => {
    expect(redact(null)).toBeNull();
    expect(redact(undefined)).toBeUndefined();
    expect(redact(42)).toBe(42);
    expect(redact(true)).toBe(true);
  });

  it("tolerates circular structures", () => {
    const a: Record<string, unknown> = { name: "x" };
    a.self = a;
    const out = redact(a) as Record<string, unknown>;
    expect(out.name).toBe("x");
    // The recursion breaker replaces the circular reference.
    expect(out.self).toBe("[REDACTED]");
  });

  it("returns [REDACTED] for functions and symbols in a payload", () => {
    const out = redact({
      fn: () => 1,
      sym: Symbol("nope"),
      big: BigInt(1),
    }) as Record<string, unknown>;
    for (const k of ["fn", "sym", "big"]) {
      expect(out[k]).toBe("[REDACTED]");
    }
  });
});

describe("summarizeHeaders()", () => {
  it("drops sensitive headers entirely", () => {
    const h = new Headers({
      Authorization: "Bearer XYZ",
      Cookie: "session=abc",
      "X-Api-Key": "AIzaSECRET",
      "X-Forwarded-For": "1.2.3.4, 5.6.7.8",
      "User-Agent": "MegaBrowser/9000",
      "Content-Type": "application/json",
      "X-Request-Id": "abc-123",
    });
    const summary = summarizeHeaders(h);
    for (const banned of [
      "authorization",
      "cookie",
      "x-api-key",
      "x-forwarded-for",
      "user-agent",
    ]) {
      expect(summary[banned]).toBeUndefined();
    }
    expect(summary["content-type"]).toBe("application/json");
    expect(summary["x-request-id"]).toBe("abc-123");
  });
});

describe("ConsoleLogger", () => {
  let spy: ConsoleSpy;

  beforeEach(() => {
    spy = new ConsoleSpy();
  });
  afterEach(() => {
    spy.restore();
    vi.restoreAllMocks();
  });

  it("emits one JSON line per call with ts/level/event", () => {
    logger.info("hello", { foo: "bar" });
    const line = spy.log[0]!;
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe("info");
    expect(parsed.event).toBe("hello");
    expect(parsed.foo).toBe("bar");
    expect(parsed.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("redacts secrets that sneak into fields", () => {
    logger.info("upstream", {
      requestUrl: "https://x/y?key=AIzaSyC-abcdefghijklmnopqrstuvwxyz1234",
      apiKey: "AIzaSECRET",
    });
    const line = spy.log[0]!;
    expect(line).not.toContain("AIzaSyC-abcdefghijklmnopqrstuvwxyz1234");
    expect(line).not.toContain("AIzaSECRET");
    // The parameter name is preserved for debuggability.
    expect(line).toContain("key=");
    const parsed = JSON.parse(line);
    expect(parsed.apiKey).toBe("[REDACTED]");
  });

  it("keeps child bindings on subsequent calls", () => {
    const child = logger.child({ route: "api.search" });
    child.info("done", { status: 200 });
    const line = spy.log[0]!;
    const parsed = JSON.parse(line);
    expect(parsed.route).toBe("api.search");
    expect(parsed.status).toBe(200);
  });

  it("routes warn+error to stderr channels (console.warn/console.error)", () => {
    logger.warn("uh", { a: 1 });
    logger.error("oh", { b: 2 });
    expect(spy.warn[0]).toContain('"level":"warn"');
    expect(spy.error[0]).toContain('"level":"error"');
  });

  it("does NOT emit debug in production or without LOG_DEBUG=1", () => {
    logger.debug("noisy", { x: 1 });
    expect(spy.log).toEqual([]);
  });
});

describe("setLogger()", () => {
  it("swaps the backing logger", () => {
    const captured: Array<[string, string, Record<string, unknown> | undefined]> = [];
    const fake: Logger = {
      debug: (e, f) => captured.push(["debug", e, f]),
      info: (e, f) => captured.push(["info", e, f]),
      warn: (e, f) => captured.push(["warn", e, f]),
      error: (e, f) => captured.push(["error", e, f]),
      child(bindings) {
        return {
          ...this,
          child: this.child.bind(this),
          info: (e, f) => captured.push(["info", e, { ...bindings, ...f }]),
        } as Logger;
      },
    };
    const previous = getLogger();
    try {
      setLogger(fake);
      logger.info("swapped", { ok: true });
      expect(captured[0]).toEqual(["info", "swapped", { ok: true }]);
    } finally {
      setLogger(previous);
    }
  });
});
