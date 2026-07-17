/**
 * Tests for the product analytics abstraction.
 *
 * Contract:
 *   - The default is a no-op — no calls, no side effects.
 *   - `isAnalyticsEnabled()` reflects `NEXT_PUBLIC_ANALYTICS_ENABLED`.
 *   - `setAnalytics()` swaps the provider; `setAnalytics(null)` restores no-op.
 *   - `track()` scrubs the event payload before it reaches the provider,
 *     so raw search text, API keys, and PII-like fields never leave the
 *     abstraction.
 *   - A broken provider cannot bubble exceptions to the caller.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAnalytics,
  isAnalyticsEnabled,
  setAnalytics,
  track,
  type AnalyticsClient,
  type AnalyticsEvent,
} from "../analytics";

describe("default analytics", () => {
  afterEach(() => {
    setAnalytics(null);
    delete process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;
    vi.restoreAllMocks();
  });

  it("is a no-op that never throws", () => {
    const r = getAnalytics();
    expect(() =>
      r.track({ name: "search.submitted", queryLength: 5 }),
    ).not.toThrow();
  });

  it("isAnalyticsEnabled() is false unless the flag is set", () => {
    delete process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;
    expect(isAnalyticsEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "1";
    expect(isAnalyticsEnabled()).toBe(true);
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "true";
    expect(isAnalyticsEnabled()).toBe(false); // strictly "1"
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "0";
    expect(isAnalyticsEnabled()).toBe(false);
  });
});

describe("track() with an installed provider", () => {
  let captured: AnalyticsEvent[];
  let client: AnalyticsClient;

  beforeEach(() => {
    captured = [];
    client = {
      track(event) {
        captured.push(event);
      },
    };
    setAnalytics(client);
  });
  afterEach(() => {
    setAnalytics(null);
    vi.restoreAllMocks();
  });

  it("forwards typed events unchanged when safe", () => {
    track({ name: "search.submitted", queryLength: 12, resultCount: 3 });
    track({
      name: "channel.selected",
      channelId: "UCXXXXXXXXXXXXXXXXXXXXXX",
      source: "search",
    });
    track({ name: "share.social_opened", target: "x" });

    expect(captured).toEqual([
      { name: "search.submitted", queryLength: 12, resultCount: 3 },
      {
        name: "channel.selected",
        channelId: "UCXXXXXXXXXXXXXXXXXXXXXX",
        source: "search",
      },
      { name: "share.social_opened", target: "x" },
    ]);
  });

  it("scrubs a Google-style key that appears inside a string field", () => {
    // Force a raw payload through to simulate a caller misuse. This
    // exercises the scrub layer — the type system alone would have
    // prevented this at compile time.
    const dodgy = {
      name: "channel.selected",
      channelId:
        "UCXXXXXXXXXXXXXXXXXXXXXX AIzaSyC-abcdefghijklmnopqrstuvwxyz1234",
      source: "search",
    } as unknown as AnalyticsEvent;
    track(dodgy);
    const sent = captured[0] as {
      channelId: string;
    };
    expect(sent.channelId).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/);
    expect(sent.channelId).toContain("[REDACTED]");
  });

  it("scrubs any accidental sensitive keys attached to the event", () => {
    const dodgy = {
      name: "search.submitted",
      queryLength: 5,
      // These are NOT part of the AnalyticsEvent union but a caller
      // may still smuggle them through with a cast — defense-in-depth
      // ensures they're wiped before the provider sees them.
      query: "how to make money on youtube",
      email: "user@example.com",
      apiKey: "AIzaSyC-abcdefghijklmnopqrstuvwxyz1234",
      ip: "203.0.113.9",
    } as unknown as AnalyticsEvent;
    track(dodgy);
    const sent = captured[0] as Record<string, unknown>;
    expect(sent.query).toBe("[REDACTED]");
    expect(sent.email).toBe("[REDACTED]");
    expect(sent.apiKey).toBe("[REDACTED]");
    expect(sent.ip).toBe("[REDACTED]");
    // The non-sensitive typed fields survive.
    expect(sent.queryLength).toBe(5);
  });

  it("swallows exceptions thrown by the provider", () => {
    setAnalytics({
      track() {
        throw new Error("provider broken");
      },
    });
    expect(() =>
      track({ name: "search.submitted", queryLength: 1 }),
    ).not.toThrow();
  });

  it("setAnalytics(null) restores the no-op", () => {
    track({ name: "search.submitted", queryLength: 1 });
    expect(captured).toHaveLength(1);
    setAnalytics(null);
    track({ name: "search.submitted", queryLength: 2 });
    expect(captured).toHaveLength(1);
  });

  it("never sends raw search text via the allowed 'search.submitted' event", () => {
    // The AnalyticsEvent union only allows `queryLength`. This test
    // encodes the intent: we track the length, not the text.
    track({ name: "search.submitted", queryLength: 42 });
    const sent = captured[0] as Record<string, unknown>;
    expect(sent.queryLength).toBe(42);
    expect(sent.query).toBeUndefined();
    expect(sent.q).toBeUndefined();
    expect(sent.text).toBeUndefined();
  });
});
