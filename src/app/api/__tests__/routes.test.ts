import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { YouTubeApiError } from "@/lib/errors";

/**
 * Integration tests: we hit the route handlers directly with mocked
 * youtube service calls. Rate limiter state is cleared between tests.
 */

const searchChannels = vi.fn();
const getChannelById = vi.fn();
const getRecentVideos = vi.fn();
const resolveChannelFromInput = vi.fn();

vi.mock("@/lib/youtube", () => ({
  // Re-export the same error class so `instanceof` checks succeed in
  // `safeErrorResponse`. Vitest resolves imports of "@/lib/errors" to the
  // same module regardless of who imports it, so this works.
  YouTubeApiError,
  searchChannels: (...args: unknown[]) => searchChannels(...args),
  resolveChannelFromInput: (...args: unknown[]) => resolveChannelFromInput(...args),
  getChannelById: (...args: unknown[]) => getChannelById(...args),
  getRecentVideos: (...args: unknown[]) => getRecentVideos(...args),
}));

// Load routes once so all handlers share the same rate-limiter instance
// we can clear between tests.
import { GET as searchGET } from "../search/route";
import { GET as channelGET } from "../channel/route";
import { GET as videosGET } from "../videos/route";
import { apiLimiter } from "@/lib/rateLimit";

beforeEach(() => {
  process.env.YOUTUBE_API_KEY = "test-key";
  searchChannels.mockReset();
  resolveChannelFromInput.mockReset();
  getChannelById.mockReset();
  getRecentVideos.mockReset();
  apiLimiter.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------- /api/search ----------
describe("GET /api/search", () => {
  it("returns 400 when q is missing or blank", async () => {
    const res = await searchGET(new Request("http://x/api/search"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("INVALID_QUERY");
  });

  it("returns 400 when q is too long", async () => {
    const q = "a".repeat(200);
    const res = await searchGET(new Request(`http://x/api/search?q=${q}`));
    expect(res.status).toBe(400);
  });

  it("returns results on success", async () => {
    resolveChannelFromInput.mockResolvedValueOnce([
      {
        channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
        title: "T",
        handle: "@t",
        description: "",
        thumbnail: "",
        subscriberCount: 100,
        hiddenSubscriberCount: false,
      },
    ]);
    const res = await searchGET(new Request("http://x/api/search?q=@test"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0].title).toBe("T");
  });

  it("returns 400 UNSUPPORTED_INPUT for plain text queries", async () => {
    resolveChannelFromInput.mockRejectedValueOnce(
      new YouTubeApiError(
        400,
        "UNSUPPORTED_INPUT",
        "Enter a valid YouTube @handle, channel URL, or channel ID.",
      ),
    );
    const res = await searchGET(new Request("http://x/api/search?q=MrBeast"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("UNSUPPORTED_INPUT");
    expect(body.message).toContain("@handle");
  });

  it("maps QUOTA_EXCEEDED to 429", async () => {
    resolveChannelFromInput.mockRejectedValueOnce(
      new YouTubeApiError(429, "QUOTA_EXCEEDED", "Quota"),
    );
    const res = await searchGET(new Request("http://x/api/search?q=@test"));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("QUOTA_EXCEEDED");
  });

  it("maps UPSTREAM_UNAVAILABLE to 502", async () => {
    resolveChannelFromInput.mockRejectedValueOnce(
      new YouTubeApiError(502, "UPSTREAM_UNAVAILABLE", "Down"),
    );
    const res = await searchGET(new Request("http://x/api/search?q=@test"));
    expect(res.status).toBe(502);
  });

  it("does not leak generic error internals in the message", async () => {
    resolveChannelFromInput.mockRejectedValueOnce(
      new Error("/etc/passwd is not accessible: leaked path"),
    );
    const res = await searchGET(new Request("http://x/api/search?q=@test"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("INTERNAL_ERROR");
    expect(body.message).not.toContain("/etc/passwd");
    expect(body.message).not.toContain("leaked");
  });

  it("does not leak the API key on network errors", async () => {
    resolveChannelFromInput.mockRejectedValueOnce(
      new YouTubeApiError(
        504,
        "UPSTREAM_TIMEOUT",
        "The YouTube API took too long to respond.",
      ),
    );
    const res = await searchGET(new Request("http://x/api/search?q=@test"));
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("test-key");
  });

  it("rate limits repeated requests and returns Retry-After", async () => {
    resolveChannelFromInput.mockResolvedValue([]);
    // Default limiter is 60/min. Hammer past the limit.
    let sawRateLimit = false;
    for (let i = 0; i < 65; i++) {
      const res = await searchGET(new Request("http://x/api/search?q=@test"));
      if (res.status === 429) {
        sawRateLimit = true;
        const body = await res.json();
        expect(body.error).toBe("RATE_LIMITED");
        expect(res.headers.get("Retry-After")).not.toBeNull();
        break;
      }
    }
    expect(sawRateLimit).toBe(true);
  });
});

// ---------- /api/channel ----------
describe("GET /api/channel", () => {
  it("returns 400 when channelId is invalid", async () => {
    const res = await channelGET(
      new Request("http://x/api/channel?channelId=bad"),
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when channel is not found", async () => {
    getChannelById.mockResolvedValueOnce(null);
    const res = await channelGET(
      new Request("http://x/api/channel?channelId=UCX6OQ3DkcsbYNE6H8uQQuVA"),
    );
    expect(res.status).toBe(404);
  });

  it("returns the channel on success", async () => {
    getChannelById.mockResolvedValueOnce({
      channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
      title: "T",
    });
    const res = await channelGET(
      new Request("http://x/api/channel?channelId=UCX6OQ3DkcsbYNE6H8uQQuVA"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
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
  });

  it("returns the video list on success", async () => {
    getRecentVideos.mockResolvedValueOnce([{ videoId: "v1" }]);
    const res = await videosGET(
      new Request(
        "http://x/api/videos?playlistId=UUX6OQ3DkcsbYNE6H8uQQuVA&limit=5",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.videos).toEqual([{ videoId: "v1" }]);
  });

  it("caps limit at 50 even when large values are provided", async () => {
    getRecentVideos.mockResolvedValueOnce([]);
    const res = await videosGET(
      new Request(
        "http://x/api/videos?playlistId=UUX6OQ3DkcsbYNE6H8uQQuVA&limit=9999",
      ),
    );
    expect(res.status).toBe(200);
    expect(getRecentVideos).toHaveBeenCalledWith(
      "UUX6OQ3DkcsbYNE6H8uQQuVA",
      50,
    );
  });
});
