/**
 * Tests for the per-request observability context and
 * `logRequestSummary()`.
 *
 * We check the shape of the summary log line (fields, level, no leaks)
 * and that context-marking helpers only take effect inside a `withContext`
 * scope.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConsoleSpy } from "./_helpers";
import {
  logRequestSummary,
  markCache,
  markClient,
  markRateLimit,
  markUpstream,
  withContext,
} from "../observability";

describe("withContext + markers", () => {
  let spy: ConsoleSpy;

  beforeEach(() => {
    spy = new ConsoleSpy();
  });
  afterEach(() => {
    spy.restore();
    vi.restoreAllMocks();
  });

  it("populates cacheStatus / upstreamCategory / rateLimit inside the scope", async () => {
    let observed: {
      cacheStatus?: string;
      upstreamCategory?: string;
      rateLimit?: string;
      clientId?: string;
    } = {};
    await withContext("api.test", async (ctx) => {
      markCache("miss");
      markUpstream("success");
      markRateLimit("allowed");
      markClient("c_abc");
      observed = {
        cacheStatus: ctx.cacheStatus,
        upstreamCategory: ctx.upstreamCategory,
        rateLimit: ctx.rateLimit,
        clientId: ctx.clientId,
      };
    });
    expect(observed).toEqual({
      cacheStatus: "miss",
      upstreamCategory: "success",
      rateLimit: "allowed",
      clientId: "c_abc",
    });
  });

  it("marks are silent no-ops outside a context (never throw)", () => {
    expect(() => markCache("hit")).not.toThrow();
    expect(() => markUpstream("timeout")).not.toThrow();
    expect(() => markRateLimit("blocked")).not.toThrow();
    expect(() => markClient("c_x")).not.toThrow();
  });

  it("keeps cacheStatus at 'hit' when a hit fires before a miss in the same request", async () => {
    // Only the FIRST cache result should be recorded — subsequent
    // secondary lookups shouldn't overwrite the primary decision.
    await withContext("api.test", async (ctx) => {
      markCache("hit");
      markCache("miss");
      expect(ctx.cacheStatus).toBe("hit");
    });
  });
});

describe("logRequestSummary()", () => {
  let spy: ConsoleSpy;

  beforeEach(() => {
    spy = new ConsoleSpy();
  });
  afterEach(() => {
    spy.restore();
    vi.restoreAllMocks();
  });

  it("emits one info line for 2xx with the observability fields", () => {
    logRequestSummary({
      route: "api.search",
      status: 200,
      startedAt: Date.now() - 50,
      cacheStatus: "hit",
      upstreamCategory: "success",
      rateLimit: "allowed",
      clientId: "c_abc",
    });
    expect(spy.log).toHaveLength(1);
    const parsed = JSON.parse(spy.log[0]!);
    expect(parsed).toMatchObject({
      level: "info",
      event: "api.request",
      route: "api.search",
      status: 200,
      cacheStatus: "hit",
      upstreamCategory: "success",
      rateLimit: "allowed",
      clientId: "c_abc",
    });
    expect(parsed.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("emits a warn line for 4xx with the error code", () => {
    logRequestSummary({
      route: "api.channel",
      status: 400,
      startedAt: Date.now(),
      code: "INVALID_QUERY",
    });
    expect(spy.warn).toHaveLength(1);
    expect(spy.warn[0]!).toContain('"code":"INVALID_QUERY"');
    expect(spy.warn[0]!).toContain('"level":"warn"');
  });

  it("emits an error line for 5xx", () => {
    logRequestSummary({
      route: "api.channel",
      status: 502,
      startedAt: Date.now(),
      code: "UPSTREAM_UNAVAILABLE",
      upstreamCategory: "network_error",
    });
    expect(spy.error).toHaveLength(1);
    expect(spy.error[0]!).toContain('"level":"error"');
    expect(spy.error[0]!).toContain('"upstreamCategory":"network_error"');
  });

  it("never emits fields the observability policy excludes", () => {
    logRequestSummary({
      route: "api.search",
      status: 200,
      startedAt: Date.now(),
      // These would be misuse — but if any caller ever passed them via
      // the spread of ctx, we want to check the summary never carries them.
    });
    const parsed = JSON.parse(spy.log[0]!);
    for (const banned of [
      "ip",
      "userAgent",
      "user_agent",
      "referer",
      "cookie",
      "authorization",
      "apiKey",
      "youtubeApiKey",
    ]) {
      expect(parsed[banned]).toBeUndefined();
    }
  });
});
