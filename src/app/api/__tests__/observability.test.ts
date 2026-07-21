/**
 * End-to-end guard: hitting an API route MUST NEVER produce a log line
 * containing the YouTube API key or a raw upstream URL.
 *
 * We mock the YouTube service, force a real key value into env before
 * loading the route, and capture every console output during the
 * request. The captured strings are then scanned for the secret and
 * for known leak vectors.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { YouTubeApiError } from "@/lib/errors";

const REAL_KEY = "AIzaSyC-abcdefghijklmnopqrstuvwxyz1234";
const searchChannels = vi.fn();
const resolveChannelFromInput = vi.fn();
const getChannelById = vi.fn();

vi.mock("@/lib/youtube", () => ({
  YouTubeApiError,
  searchChannels: (...args: unknown[]) => searchChannels(...args),
  resolveChannelFromInput: (...args: unknown[]) => resolveChannelFromInput(...args),
  getChannelById: (...args: unknown[]) => getChannelById(...args),
  getRecentVideos: vi.fn(),
}));

import { ConsoleSpy } from "@/lib/__tests__/_helpers";
import { GET as searchGET } from "../search/route";
import { GET as channelGET } from "../channel/route";
import { apiLimiter } from "@/lib/rateLimit";

function assertNoLeak(all: string[]) {
  const joined = all.join("\n");
  expect(joined).not.toContain(REAL_KEY);
  // Google API-key pattern should never appear.
  expect(joined).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/);
  // Nor a request URL containing an unredacted key.
  expect(joined).not.toMatch(/key=AIza/);
  // Nor known sensitive header names as values.
  expect(joined.toLowerCase()).not.toContain("authorization: bearer");
}

describe("route observability logging", () => {
  let spy: ConsoleSpy;
  beforeEach(() => {
    process.env.YOUTUBE_API_KEY = REAL_KEY;
    apiLimiter.clear();
    spy = new ConsoleSpy();
    searchChannels.mockReset();
    resolveChannelFromInput.mockReset();
    getChannelById.mockReset();
  });
  afterEach(() => {
    spy.restore();
    vi.restoreAllMocks();
  });

  it("emits one api.request summary per successful search", async () => {
    resolveChannelFromInput.mockResolvedValueOnce([]);
    const res = await searchGET(new Request("http://x/api/search?q=@test"));
    expect(res.status).toBe(200);
    // At least one log line whose event is api.request.
    const summary = spy.log.find((l) => l.includes('"event":"api.request"'));
    expect(summary).toBeDefined();
    const parsed = JSON.parse(summary!);
    expect(parsed.route).toBe("api.search");
    expect(parsed.status).toBe(200);
    expect(typeof parsed.durationMs).toBe("number");
  });

  it("does not include the API key in the summary log", async () => {
    resolveChannelFromInput.mockResolvedValueOnce([]);
    await searchGET(new Request("http://x/api/search?q=@test"));
    assertNoLeak([...spy.log, ...spy.warn, ...spy.error]);
  });

  it("does not include the API key when an upstream error occurs", async () => {
    // Simulate a YouTubeApiError with a message that (hypothetically)
    // was built by a careless caller with the key embedded.
    resolveChannelFromInput.mockRejectedValueOnce(
      new YouTubeApiError(
        502,
        "UPSTREAM_UNAVAILABLE",
        `Upstream failed while calling https://googleapis.com/foo?key=${REAL_KEY}`,
      ),
    );
    const res = await searchGET(new Request("http://x/api/search?q=@test"));
    expect(res.status).toBe(502);
    assertNoLeak([...spy.log, ...spy.warn, ...spy.error]);
  });

  it("logs 4xx as warn with the safe code", async () => {
    const res = await searchGET(new Request("http://x/api/search"));
    expect(res.status).toBe(400);
    const summary = spy.warn.find((l) =>
      l.includes('"event":"api.request"'),
    );
    expect(summary).toBeDefined();
    const parsed = JSON.parse(summary!);
    expect(parsed.route).toBe("api.search");
    expect(parsed.status).toBe(400);
    expect(parsed.code).toBe("INVALID_QUERY");
  });

  it("records rateLimit=allowed on the successful path", async () => {
    getChannelById.mockResolvedValueOnce({
      channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
      title: "T",
      uploadsPlaylistId: "UUX6OQ3DkcsbYNE6H8uQQuVA",
    });
    const res = await channelGET(
      new Request(
        "http://x/api/channel?channelId=UCX6OQ3DkcsbYNE6H8uQQuVA",
      ),
    );
    expect(res.status).toBe(200);
    const summary = spy.log.find((l) => l.includes('"event":"api.request"'));
    const parsed = JSON.parse(summary!);
    expect(parsed.rateLimit).toBe("allowed");
  });

  it("records rateLimit=blocked when the limiter denies the request", async () => {
    resolveChannelFromInput.mockResolvedValue([]);
    // Blow past the default limit (60 in the test env unless overridden).
    let blockedSummary: Record<string, unknown> | undefined;
    for (let i = 0; i < 200; i++) {
      const res = await searchGET(new Request("http://x/api/search?q=@test"));
      if (res.status === 429) {
        const line = [...spy.log, ...spy.warn, ...spy.error]
          .reverse()
          .find((l) => l.includes('"event":"api.request"'));
        blockedSummary = JSON.parse(line!);
        break;
      }
    }
    expect(blockedSummary).toBeDefined();
    expect(blockedSummary!.status).toBe(429);
    expect(blockedSummary!.rateLimit).toBe("blocked");
    expect(blockedSummary!.code).toBe("RATE_LIMITED");
  });
});
