/**
 * Tests for the /api/health endpoint.
 *
 * Health must:
 *   - Return HTTP 200 with a stable JSON shape.
 *   - Never call the YouTube API.
 *   - Never leak the API key, env values, stack traces, or file paths.
 *   - Report `youtubeApiConfigured: true` when a key is set and
 *     `false` when it isn't — but never the key itself.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

async function loadRoute() {
  vi.resetModules();
  return import("../health/route");
}

describe("GET /api/health", () => {
  beforeEach(() => {
    // Give env.server a clean slate for each test.
    for (const k of Object.keys(process.env)) {
      if (
        k === "YOUTUBE_API_KEY" ||
        k === "YOUTUBE_TIMEOUT_MS" ||
        k === "RATE_LIMIT_MAX" ||
        k === "RATE_LIMIT_WINDOW_MS" ||
        k === "TRUST_PROXY"
      ) {
        delete process.env[k];
      }
    }
  });

  afterEach(() => {
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, originalEnv);
    vi.restoreAllMocks();
  });

  it("responds with 200 and the expected JSON shape", async () => {
    const { GET } = await loadRoute();
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      status: "ok",
      service: "youtube-money-calculator",
      youtubeApiConfigured: false,
    });
    expect(typeof body.timestamp).toBe("string");
    // ISO 8601 with milliseconds & Z suffix.
    expect(String(body.timestamp)).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/,
    );
  });

  it("sets Cache-Control: no-store", async () => {
    const { GET } = await loadRoute();
    const res = await GET();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("reports youtubeApiConfigured=true when a key is present", async () => {
    process.env.YOUTUBE_API_KEY = "AIza-test-key";
    const { GET } = await loadRoute();
    const res = await GET();
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.youtubeApiConfigured).toBe(true);
    // The key must NOT be in the response — that would be a leak.
    const rawJson = JSON.stringify(body);
    expect(rawJson).not.toContain("AIza-test-key");
  });

  it("does not call the YouTube API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { GET } = await loadRoute();
    await GET();
    // Nothing outbound should have fired.
    const calls = fetchSpy.mock.calls.map((c) => String(c[0]));
    expect(
      calls.every((u) => !u.includes("googleapis.com")),
    ).toBe(true);
  });

  it("does not leak env values or stack info in the response body", async () => {
    process.env.YOUTUBE_API_KEY = "SECRET-DO-NOT-LEAK-abcdef";
    process.env.YOUTUBE_TIMEOUT_MS = "1234";
    process.env.RATE_LIMIT_MAX = "42";
    const { GET } = await loadRoute();
    const res = await GET();
    const body = await res.text();
    expect(body).not.toContain("SECRET-DO-NOT-LEAK-abcdef");
    expect(body).not.toContain("1234"); // no raw timeout value
    expect(body).not.toContain(":42,"); // no raw rate limit value adjacent to fields
    expect(body).not.toMatch(/at Object/); // no stack trace
    expect(body).not.toContain("/projects/"); // no filesystem paths
  });
});

describe("HEAD /api/health", () => {
  it("returns 200 with no body", async () => {
    const { HEAD } = await loadRoute();
    const res = await HEAD();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const text = await res.text();
    expect(text).toBe("");
  });
});
