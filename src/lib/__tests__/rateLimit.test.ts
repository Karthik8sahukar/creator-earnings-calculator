import { describe, expect, it } from "vitest";

import { SlidingWindowLimiter, identifyClient } from "../rateLimit";

function makeTimeSource() {
  let t = 0;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe("SlidingWindowLimiter", () => {
  it("allows requests under the limit", () => {
    const time = makeTimeSource();
    const l = new SlidingWindowLimiter({
      limit: 3,
      windowMs: 1000,
      now: time.now,
    });
    expect(l.hit("a").allowed).toBe(true);
    expect(l.hit("a").allowed).toBe(true);
    expect(l.hit("a").allowed).toBe(true);
  });

  it("blocks the 4th request when the limit is 3", () => {
    const time = makeTimeSource();
    const l = new SlidingWindowLimiter({
      limit: 3,
      windowMs: 1000,
      now: time.now,
    });
    l.hit("a");
    l.hit("a");
    l.hit("a");
    const blocked = l.hit("a");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after the window slides", () => {
    const time = makeTimeSource();
    const l = new SlidingWindowLimiter({
      limit: 2,
      windowMs: 1000,
      now: time.now,
    });
    l.hit("a");
    l.hit("a");
    expect(l.hit("a").allowed).toBe(false);
    time.advance(1200);
    expect(l.hit("a").allowed).toBe(true);
  });

  it("tracks separate buckets for different client ids", () => {
    const l = new SlidingWindowLimiter({ limit: 1, windowMs: 1000 });
    expect(l.hit("a").allowed).toBe(true);
    expect(l.hit("b").allowed).toBe(true);
    expect(l.hit("a").allowed).toBe(false);
  });

  it("reports remaining tokens correctly", () => {
    const l = new SlidingWindowLimiter({ limit: 3, windowMs: 1000 });
    expect(l.hit("x").remaining).toBe(2);
    expect(l.hit("x").remaining).toBe(1);
    expect(l.hit("x").remaining).toBe(0);
  });

  it("rejects invalid options", () => {
    expect(
      () => new SlidingWindowLimiter({ limit: 0, windowMs: 1000 }),
    ).toThrow();
    expect(
      () => new SlidingWindowLimiter({ limit: 1, windowMs: 0 }),
    ).toThrow();
  });
});

describe("identifyClient", () => {
  it("does not blindly trust x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4" });
    const id = identifyClient(headers);
    // Because trustProxy is not set, we must not derive the id from XFF.
    expect(id).toBe("anonymous");
  });

  it("uses x-forwarded-for when trustProxy is enabled", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4" });
    const id = identifyClient(headers, { trustProxy: true });
    expect(id).not.toBe("anonymous");
    expect(id).not.toContain("1.2.3.4"); // anonymized
  });

  it("picks the leftmost forwarded entry", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    const a = identifyClient(headers, { trustProxy: true });
    const b = identifyClient(
      new Headers({ "x-forwarded-for": "1.2.3.4" }),
      { trustProxy: true },
    );
    expect(a).toBe(b);
  });

  it("uses x-real-ip when present", () => {
    const headers = new Headers({ "x-real-ip": "9.9.9.9" });
    const id = identifyClient(headers);
    expect(id).not.toBe("anonymous");
    expect(id).not.toContain("9.9.9.9"); // anonymized
  });

  it("returns 'anonymous' when no useful header is present", () => {
    expect(identifyClient(new Headers())).toBe("anonymous");
  });
});
