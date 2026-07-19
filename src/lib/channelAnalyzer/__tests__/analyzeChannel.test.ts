import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Error-handling tests for the analyzer orchestrator.
 *
 * `analyzeChannel` is designed to never throw — every upstream
 * failure should map to a structured `AnalyzerFallbackReason`. This
 * file verifies each mapping by mocking the underlying YouTube
 * helpers.
 *
 * We use per-test `vi.doMock` so each scenario can install a fresh
 * mock and re-import the module. `vi.resetModules()` between tests
 * guarantees no state leaks.
 */

const CHANNEL: import("@/types/youtube").ChannelDetails = {
  channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
  title: "Test Channel",
  handle: "@testchannel",
  description: "",
  thumbnail: "",
  bannerUrl: null,
  subscriberCount: 100_000,
  hiddenSubscriberCount: false,
  viewCount: 1_000_000,
  videoCount: 50,
  publishedAt: "2020-01-01T00:00:00Z",
  country: "US",
  uploadsPlaylistId: "UUX6OQ3DkcsbYNE6H8uQQuVA",
  channelUrl: "https://www.youtube.com/@testchannel",
  customUrl: "@testchannel",
};

const VIDEO_SAMPLE: import("@/types/youtube").VideoItem[] = [
  {
    videoId: "v1",
    title: "Big One",
    description: "",
    thumbnail: "",
    publishedAt: new Date().toISOString(),
    viewCount: 100_000,
    likeCount: 5_000,
    commentCount: 300,
    durationSeconds: 600,
    durationLabel: "10:00",
    isShort: false,
    url: "https://youtube.com/watch?v=v1",
  },
  {
    videoId: "v2",
    title: "Medium",
    description: "",
    thumbnail: "",
    publishedAt: new Date().toISOString(),
    viewCount: 50_000,
    likeCount: 2_000,
    commentCount: 150,
    durationSeconds: 45,
    durationLabel: "0:45",
    isShort: true,
    url: "https://youtube.com/shorts/v2",
  },
];

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.doUnmock("../../youtube");
  vi.restoreAllMocks();
});

async function loadAnalyzer(mocks: {
  getChannelById?: unknown;
  getRecentVideos?: unknown;
  searchChannels?: unknown;
}) {
  const { YouTubeApiError } = await import("../../errors");
  vi.doMock("../../youtube", () => ({
    YouTubeApiError,
    getChannelById:
      mocks.getChannelById ?? vi.fn(async () => CHANNEL),
    getRecentVideos:
      mocks.getRecentVideos ?? vi.fn(async () => VIDEO_SAMPLE),
    searchChannels: mocks.searchChannels ?? vi.fn(async () => []),
  }));
  const mod = await import("../analyzeChannel");
  return { ...mod, YouTubeApiError };
}

describe("analyzeChannel — error handling", () => {
  it("returns empty status for whitespace-only input (no upstream call)", async () => {
    const getChannelById = vi.fn(async () => null);
    const { analyzeChannel } = await loadAnalyzer({ getChannelById });
    const result = await analyzeChannel("   ");
    expect(result.status).toBe("empty");
    expect(result.fallbackReason).toBe("empty-input");
    expect(result.analysis).toBeNull();
    expect(getChannelById).not.toHaveBeenCalled();
  });

  it("returns not-found when getChannelById resolves to null (channel id path)", async () => {
    const getChannelById = vi.fn(async () => null);
    const { analyzeChannel } = await loadAnalyzer({ getChannelById });
    const result = await analyzeChannel("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(result.status).toBe("error");
    expect(result.fallbackReason).toBe("not-found");
    expect(result.analysis).toBeNull();
    expect(getChannelById).toHaveBeenCalledWith("UCX6OQ3DkcsbYNE6H8uQQuVA");
  });

  it("returns not-found when a handle search yields no results", async () => {
    const searchChannels = vi.fn(async () => []);
    const getChannelById = vi.fn();
    const { analyzeChannel } = await loadAnalyzer({
      searchChannels,
      getChannelById,
    });
    const result = await analyzeChannel("@doesnotexist");
    expect(result.status).toBe("error");
    expect(result.fallbackReason).toBe("not-found");
    expect(searchChannels).toHaveBeenCalledWith("@doesnotexist");
    // Never bothered enriching if the search was empty.
    expect(getChannelById).not.toHaveBeenCalled();
  });

  it("maps MISSING_API_KEY to 'not-configured'", async () => {
    const { YouTubeApiError, analyzeChannel } = await loadAnalyzer({
      getChannelById: vi.fn(async () => {
        const { YouTubeApiError: E } = await import("../../errors");
        throw new E(500, "MISSING_API_KEY", "no key");
      }),
    });
    expect(YouTubeApiError).toBeTruthy();
    const result = await analyzeChannel("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(result.status).toBe("error");
    expect(result.fallbackReason).toBe("not-configured");
  });

  it("maps INVALID_API_KEY to 'not-configured'", async () => {
    const { analyzeChannel } = await loadAnalyzer({
      getChannelById: vi.fn(async () => {
        const { YouTubeApiError: E } = await import("../../errors");
        throw new E(500, "INVALID_API_KEY", "bad key");
      }),
    });
    const result = await analyzeChannel("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(result.fallbackReason).toBe("not-configured");
  });

  it("maps QUOTA_EXCEEDED to 'quota-exceeded'", async () => {
    const { analyzeChannel } = await loadAnalyzer({
      getChannelById: vi.fn(async () => {
        const { YouTubeApiError: E } = await import("../../errors");
        throw new E(429, "QUOTA_EXCEEDED", "quota exhausted");
      }),
    });
    const result = await analyzeChannel("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(result.fallbackReason).toBe("quota-exceeded");
  });

  it("maps UPSTREAM_UNAVAILABLE / TIMEOUT / NETWORK_ERROR to 'upstream-unavailable'", async () => {
    for (const code of [
      "UPSTREAM_UNAVAILABLE",
      "UPSTREAM_TIMEOUT",
      "NETWORK_ERROR",
      "UPSTREAM_ERROR",
      "MALFORMED_UPSTREAM",
      "FORBIDDEN",
    ]) {
      vi.resetModules();
      const { analyzeChannel } = await loadAnalyzer({
        getChannelById: vi.fn(async () => {
          const { YouTubeApiError: E } = await import("../../errors");
          throw new E(502, code, "upstream down");
        }),
      });
      const result = await analyzeChannel("UCX6OQ3DkcsbYNE6H8uQQuVA");
      expect(result.fallbackReason, `for code ${code}`).toBe(
        "upstream-unavailable",
      );
    }
  });

  it("maps YouTubeApiError.NOT_FOUND to 'not-found'", async () => {
    const { analyzeChannel } = await loadAnalyzer({
      getChannelById: vi.fn(async () => {
        const { YouTubeApiError: E } = await import("../../errors");
        throw new E(404, "NOT_FOUND", "no such channel");
      }),
    });
    const result = await analyzeChannel("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(result.fallbackReason).toBe("not-found");
  });

  it("maps a plain unrelated Error to 'unknown-error'", async () => {
    const { analyzeChannel } = await loadAnalyzer({
      getChannelById: vi.fn(async () => {
        throw new Error("something else");
      }),
    });
    const result = await analyzeChannel("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(result.fallbackReason).toBe("unknown-error");
  });

  it("still returns success when getRecentVideos fails softly", async () => {
    const { analyzeChannel } = await loadAnalyzer({
      getChannelById: vi.fn(async () => CHANNEL),
      getRecentVideos: vi.fn(async () => {
        const { YouTubeApiError: E } = await import("../../errors");
        throw new E(502, "UPSTREAM_UNAVAILABLE", "videos down");
      }),
    });
    const result = await analyzeChannel("UCX6OQ3DkcsbYNE6H8uQQuVA");
    // Channel card + zeroed derived metrics is preferable to killing
    // the whole page.
    expect(result.status).toBe("ok");
    expect(result.analysis?.videos).toEqual([]);
    expect(result.analysis?.engagement.sampleSize).toBe(0);
  });

  it("returns a fully-populated analysis on the happy path", async () => {
    const getChannelById = vi.fn(async () => CHANNEL);
    const getRecentVideos = vi.fn(async () => VIDEO_SAMPLE);
    const { analyzeChannel } = await loadAnalyzer({
      getChannelById,
      getRecentVideos,
    });
    const result = await analyzeChannel("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(result.status).toBe("ok");
    expect(result.fallbackReason).toBeNull();
    expect(result.analysis?.channel.channelId).toBe(CHANNEL.channelId);
    expect(result.analysis?.topVideos).toHaveLength(2);
    // topVideos is sorted by view count desc.
    expect(result.analysis?.topVideos[0].viewCount).toBeGreaterThanOrEqual(
      result.analysis?.topVideos[1].viewCount ?? 0,
    );
    expect(result.analysis?.revenue.currency).toBe("USD");
    expect(result.analysis?.engagement.sampleSize).toBe(2);
    expect(result.analysis?.growth.growthScore).toBeGreaterThanOrEqual(0);
    // Channel-id path issues exactly one channel call and one videos call.
    expect(getChannelById).toHaveBeenCalledTimes(1);
    expect(getRecentVideos).toHaveBeenCalledTimes(1);
  });

  it("prefers an exact @handle match from search results", async () => {
    const searchChannels = vi.fn(async () => [
      // "close but not exact" result comes first — the analyzer
      // should skip it in favour of the exact match.
      {
        channelId: "UCwrong",
        title: "wrong",
        handle: "@testchannelextra",
        description: "",
        thumbnail: "",
        subscriberCount: 0,
        hiddenSubscriberCount: false,
      },
      {
        channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
        title: "right",
        handle: "@TestChannel",
        description: "",
        thumbnail: "",
        subscriberCount: 100_000,
        hiddenSubscriberCount: false,
      },
    ]);
    const getChannelById = vi.fn(async () => CHANNEL);
    const { analyzeChannel } = await loadAnalyzer({
      searchChannels,
      getChannelById,
    });
    const result = await analyzeChannel("@testchannel");
    expect(result.status).toBe("ok");
    expect(getChannelById).toHaveBeenCalledWith(
      "UCX6OQ3DkcsbYNE6H8uQQuVA",
    );
  });
});
