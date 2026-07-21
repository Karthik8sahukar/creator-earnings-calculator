import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { YouTubeApiError } from "@/lib/errors";

/**
 * Integration tests: we hit the route handlers directly with mocked
 * youtube service calls. Rate limiter state is cleared between tests.
 *
 * Every route uses the canonical envelope:
 *   Success: { success: true, <data> }
 *   Error  : { success: false, error: { code, message } }
 */

const searchChannels = vi.fn();
const getChannelById = vi.fn();
const getRecentVideos = vi.fn();
const isSearchCached = vi.fn().mockReturnValue(false);

vi.mock("@/lib/youtube", () => ({
  // Re-export the same error class so `instanceof` checks succeed in
  // `safeErrorResponse`. Vitest resolves imports of "@/lib/errors" to the
  // same module regardless of who imports it, so this works.
  YouTubeApiError,
  searchChannels: (...args: unknown[]) => searchChannels(...args),
  getChannelById: (...args: unknown[]) => getChannelById(...args),
  getRecentVideos: (...args: unknown[]) => getRecentVideos(...args),
  isSearchCached: (...args: unknown[]) => isSearchCached(...args),
  searchCacheKeyFor: (raw: string) => `test:${raw}`,
}));

// Load routes once so all handlers share the same rate-limiter instance
// we can clear between tests.
import { GET as searchGET } from "../search/route";
import { GET as channelGET } from "../channel/route";
import { GET as videosGET } from "../videos/route";
import { apiLimiter, searchLimiter } from "@/lib/rateLimit";

beforeEach(() => {
  process.env.YOUTUBE_API_KEY = "test-key";
  searchChannels.mockReset();
  getChannelById.mockReset();
  getRecentVideos.mockReset();
  isSearchCached.mockReset().mockReturnValue(false);
  apiLimiter.clear();
  searchLimiter.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------- /api/search ----------
describe("GET /api/search", () => {
  it("returns 400 with INVALID_QUERY when q is missing or blank", async () => {
    const res = await searchGET(new Request("http://x/api/search"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_QUERY");
  });

  it("returns 400 when q is too long", async () => {
    const q = "a".repeat(200);
    const res = await searchGET(new Request(`http://x/api/search?q=${q}`));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_QUERY");
  });

  it("returns wrapped results on success", async () => {
    searchChannels.mockResolvedValueOnce([
      {
        channelId: "UC_xxxxxxxxxxxxxxxxxxxxxx",
        title: "T",
        handle: "@t",
        description: "",
        thumbnail: "",
        subscriberCount: 100,
        hiddenSubscriberCount: false,
      },
    ]);
    const res = await searchGET(new Request("http://x/api/search?q=test"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].title).toBe("T");
  });

  it("returns an empty results array (success=true) when nothing matches", async () => {
    searchChannels.mockResolvedValueOnce([]);
    const res = await searchGET(
      new Request("http://x/api/search?q=nothingxyz"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.results).toEqual([]);
  });

  it("relays a channel result with hiddenSubscriberCount=true (no subscriberCount) intact", async () => {
    searchChannels.mockResolvedValueOnce([
      {
        channelId: "UC_xxxxxxxxxxxxxxxxxxxxxx",
        title: "Hidden Channel",
        handle: null,
        description: "",
        thumbnail: "",
        subscriberCount: null,
        hiddenSubscriberCount: true,
      },
    ]);
    const res = await searchGET(new Request("http://x/api/search?q=hidden"));
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.results[0].hiddenSubscriberCount).toBe(true);
    expect(body.results[0].subscriberCount).toBeNull();
  });

  it("maps QUOTA_EXCEEDED to 429", async () => {
    searchChannels.mockRejectedValueOnce(
      new YouTubeApiError(429, "QUOTA_EXCEEDED", "Quota"),
    );
    const res = await searchGET(new Request("http://x/api/search?q=test"));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("QUOTA_EXCEEDED");
  });

  it("maps INVALID_API_KEY (403) to a 500 with a clear operator message", async () => {
    searchChannels.mockRejectedValueOnce(
      new YouTubeApiError(
        500,
        "INVALID_API_KEY",
        "The server's YouTube API key is invalid.",
      ),
    );
    const res = await searchGET(new Request("http://x/api/search?q=test"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_API_KEY");
    expect(body.error.message.toLowerCase()).toContain("invalid");
  });

  it("maps API_DISABLED to a 500 with a clear operator message", async () => {
    searchChannels.mockRejectedValueOnce(
      new YouTubeApiError(
        500,
        "API_DISABLED",
        "The YouTube Data API v3 is not enabled for the server's Google Cloud project.",
      ),
    );
    const res = await searchGET(new Request("http://x/api/search?q=test"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("API_DISABLED");
  });

  it("maps MISSING_API_KEY to a 500 with a specific operator message", async () => {
    searchChannels.mockRejectedValueOnce(
      new YouTubeApiError(
        500,
        "MISSING_API_KEY",
        "The server is missing its YouTube API configuration. Set the YOUTUBE_API_KEY environment variable on the server and redeploy.",
      ),
    );
    const res = await searchGET(new Request("http://x/api/search?q=test"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("MISSING_API_KEY");
    expect(body.error.message).toContain("YOUTUBE_API_KEY");
  });

  it("maps UPSTREAM_UNAVAILABLE to 502", async () => {
    searchChannels.mockRejectedValueOnce(
      new YouTubeApiError(502, "UPSTREAM_UNAVAILABLE", "Down"),
    );
    const res = await searchGET(new Request("http://x/api/search?q=test"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error.code).toBe("UPSTREAM_UNAVAILABLE");
  });

  it("maps a MALFORMED_UPSTREAM error to a 502 with a friendly message", async () => {
    searchChannels.mockRejectedValueOnce(
      new YouTubeApiError(
        502,
        "MALFORMED_UPSTREAM",
        "The YouTube API returned an unreadable response. Please try again shortly.",
      ),
    );
    const res = await searchGET(new Request("http://x/api/search?q=test"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error.code).toBe("MALFORMED_UPSTREAM");
    // The message must NEVER be the old confusing 'unexpected response' text
    expect(body.error.message.toLowerCase()).not.toContain(
      "unexpected response",
    );
  });

  it("does NOT surface the confusing generic 'unexpected response' message for a plain Error", async () => {
    searchChannels.mockRejectedValueOnce(
      new Error("random internal problem"),
    );
    const res = await searchGET(new Request("http://x/api/search?q=test"));
    const body = await res.json();
    expect(body.error.message.toLowerCase()).not.toContain(
      "unexpected response",
    );
  });

  it("sets Cache-Control: no-store on the success response", async () => {
    searchChannels.mockResolvedValueOnce([]);
    const res = await searchGET(new Request("http://x/api/search?q=test"));
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("does not leak generic error internals in the message", async () => {
    searchChannels.mockRejectedValueOnce(
      new Error("/etc/passwd is not accessible: leaked path"),
    );
    const res = await searchGET(new Request("http://x/api/search?q=test"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).not.toContain("/etc/passwd");
    expect(body.error.message).not.toContain("leaked");
  });

  it("does not leak the API key on network errors", async () => {
    searchChannels.mockRejectedValueOnce(
      new YouTubeApiError(
        504,
        "UPSTREAM_TIMEOUT",
        "The YouTube API took too long to respond.",
      ),
    );
    const res = await searchGET(new Request("http://x/api/search?q=test"));
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("test-key");
  });

  it("rate limits repeated requests and returns Retry-After", async () => {
    searchChannels.mockResolvedValue([]);
    // Default limiter is 60/min. Hammer past the limit.
    let sawRateLimit = false;
    for (let i = 0; i < 65; i++) {
      const res = await searchGET(new Request("http://x/api/search?q=test"));
      if (res.status === 429) {
        sawRateLimit = true;
        const body = await res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("RATE_LIMITED");
        expect(res.headers.get("Retry-After")).not.toBeNull();
        break;
      }
    }
    expect(sawRateLimit).toBe(true);
  });

  it("skips the strict search rate limit for cache hits", async () => {
    // Simulate 20 identical requests. If they were cache hits, the
    // strict search limiter (10/min) would NEVER fire even though we
    // exceed its budget many times over.
    isSearchCached.mockReturnValue(true);
    searchChannels.mockResolvedValue([]);
    for (let i = 0; i < 20; i++) {
      const res = await searchGET(new Request("http://x/api/search?q=hit"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    }
  });

  it("applies the strict search rate limit ONLY on cache misses (blocks excessive unique searches)", async () => {
    // 15 distinct queries in a row on a cache miss. The strict limiter
    // is 10 unique searches per minute per client — request #11 must
    // be rate-limited with RATE_LIMITED (not the generic API limit).
    isSearchCached.mockReturnValue(false);
    searchChannels.mockResolvedValue([]);
    let firstBlockedAt = -1;
    let blockedBody: { success?: boolean; error?: { code?: string } } = {};
    for (let i = 0; i < 15; i++) {
      const res = await searchGET(
        new Request(`http://x/api/search?q=distinct${i}`),
      );
      if (res.status === 429) {
        firstBlockedAt = i;
        blockedBody = await res.json();
        break;
      }
    }
    expect(firstBlockedAt).toBeGreaterThanOrEqual(10);
    expect(firstBlockedAt).toBeLessThanOrEqual(11);
    expect(blockedBody.success).toBe(false);
    expect(blockedBody.error?.code).toBe("RATE_LIMITED");
  });

  it("passes a channelId-shaped query through to the service (which routes to channels.list, not search.list)", async () => {
    // The route trusts the service to pick the right endpoint. This
    // test asserts the query reaches searchChannels intact — the
    // service-level guarantee is covered by youtube.test.ts.
    searchChannels.mockResolvedValueOnce([]);
    await searchGET(
      new Request("http://x/api/search?q=UC_xxxxxxxxxxxxxxxxxxxxxx"),
    );
    expect(searchChannels).toHaveBeenCalledWith("UC_xxxxxxxxxxxxxxxxxxxxxx");
  });
});

// ---------- /api/channel ----------
describe("GET /api/channel", () => {
  it("returns 400 when channelId is invalid", async () => {
    const res = await channelGET(
      new Request("http://x/api/channel?channelId=bad"),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_QUERY");
  });

  it("returns 404 with a NOT_FOUND envelope when the channel does not exist", async () => {
    getChannelById.mockResolvedValueOnce(null);
    const res = await channelGET(
      new Request("http://x/api/channel?channelId=UC_xxxxxxxxxxxxxxxxxxxxxx"),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns the wrapped channel on success", async () => {
    getChannelById.mockResolvedValueOnce({
      channelId: "UC_xxxxxxxxxxxxxxxxxxxxxx",
      title: "T",
    });
    const res = await channelGET(
      new Request("http://x/api/channel?channelId=UC_xxxxxxxxxxxxxxxxxxxxxx"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.channel.title).toBe("T");
  });
});

// ---------- /api/videos ----------
describe("GET /api/videos", () => {
  it("returns 400 when playlistId is invalid", async () => {
    const res = await videosGET(
      new Request("http://x/api/videos?playlistId=nope"),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_QUERY");
  });

  it("returns the wrapped video list on success", async () => {
    getRecentVideos.mockResolvedValueOnce([{ videoId: "v1" }]);
    const res = await videosGET(
      new Request(
        "http://x/api/videos?playlistId=UU_xxxxxxxxxxxxxxxxxxxxxx&limit=5",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.videos).toEqual([{ videoId: "v1" }]);
  });

  it("caps limit at 50 even when large values are provided", async () => {
    getRecentVideos.mockResolvedValueOnce([]);
    const res = await videosGET(
      new Request(
        "http://x/api/videos?playlistId=UU_xxxxxxxxxxxxxxxxxxxxxx&limit=9999",
      ),
    );
    expect(res.status).toBe(200);
    expect(getRecentVideos).toHaveBeenCalledWith(
      "UU_xxxxxxxxxxxxxxxxxxxxxx",
      50,
    );
  });
});
