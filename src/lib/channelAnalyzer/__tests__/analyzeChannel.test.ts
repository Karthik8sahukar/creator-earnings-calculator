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

  it("maps 5xx / network / timeout errors to 'upstream-unavailable'", async () => {
    for (const code of [
      "UPSTREAM_UNAVAILABLE",
      "UPSTREAM_TIMEOUT",
      "NETWORK_ERROR",
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

  it("maps FORBIDDEN to 'not-configured' (403 that isn't quota/bad-key)", async () => {
    const { analyzeChannel } = await loadAnalyzer({
      getChannelById: vi.fn(async () => {
        const { YouTubeApiError: E } = await import("../../errors");
        throw new E(502, "FORBIDDEN", "refused");
      }),
    });
    const result = await analyzeChannel("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(result.fallbackReason).toBe("not-configured");
  });

  it("maps UPSTREAM_ERROR / MALFORMED_UPSTREAM to 'unknown-error' — not upstream-unavailable", async () => {
    // These codes are for genuinely unexpected response shapes (see
    // src/lib/youtube.ts) — the user should NOT be told to "try
    // again shortly" for something that's likely a bug we should
    // investigate.
    for (const code of ["UPSTREAM_ERROR", "MALFORMED_UPSTREAM"]) {
      vi.resetModules();
      const { analyzeChannel } = await loadAnalyzer({
        getChannelById: vi.fn(async () => {
          const { YouTubeApiError: E } = await import("../../errors");
          throw new E(
            502,
            code,
            "The YouTube API returned an unexpected response.",
          );
        }),
      });
      const result = await analyzeChannel("UCX6OQ3DkcsbYNE6H8uQQuVA");
      expect(result.fallbackReason, `for code ${code}`).toBe("unknown-error");
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

  // ─── Regression: PR #16 review feedback ─────────────────────────
  //
  // A random text query such as "hjbhj" was mapping to a scary
  // "unexpected response" banner instead of a clean "channel not
  // found". These tests lock down the taxonomy the product spec
  // requires.

  it("random-text with an empty search response maps to not-found (not unknown/unavailable)", async () => {
    // YouTube returned HTTP 200 with `items: []` — a SUCCESS with
    // no match. This must map to `not-found`, never `unknown-error`
    // or `upstream-unavailable`.
    const searchChannels = vi.fn(async () => []);
    const getChannelById = vi.fn();
    const { analyzeChannel } = await loadAnalyzer({
      searchChannels,
      getChannelById,
    });
    const result = await analyzeChannel("hjbhj");
    expect(result.status).toBe("error");
    expect(result.fallbackReason).toBe("not-found");
    expect(searchChannels).toHaveBeenCalledWith("hjbhj");
    expect(getChannelById).not.toHaveBeenCalled();
  });

  it("random-text with low-signal matches maps to not-found (no substring match)", async () => {
    // YouTube's search endpoint is very lenient — a typo like
    // "hjbhj" can surface unrelated channels. Rendering one of
    // those as "your analyzed channel" would be misleading, so
    // we require a title/handle substring match before trusting
    // the top result.
    const searchChannels = vi.fn(async () => [
      {
        channelId: "UCUNRELATED",
        title: "Cooking with Grandma",
        handle: "@grandmacooks",
        description: "",
        thumbnail: "",
        subscriberCount: 12_345,
        hiddenSubscriberCount: false,
      },
    ]);
    const getChannelById = vi.fn();
    const { analyzeChannel } = await loadAnalyzer({
      searchChannels,
      getChannelById,
    });
    const result = await analyzeChannel("hjbhj");
    expect(result.status).toBe("error");
    expect(result.fallbackReason).toBe("not-found");
    // We must NOT have called getChannelById on an unrelated match.
    expect(getChannelById).not.toHaveBeenCalled();
  });

  it("empty items response is NOT treated as an unknown-error", async () => {
    // A `[]` result is a successful response — mock youtube.ts is
    // returning what a well-formed 200-with-no-results would.
    const searchChannels = vi.fn(async () => []);
    const { analyzeChannel } = await loadAnalyzer({ searchChannels });
    const result = await analyzeChannel("nonexistentchannel12345");
    expect(result.fallbackReason).not.toBe("unknown-error");
    expect(result.fallbackReason).not.toBe("upstream-unavailable");
    expect(result.fallbackReason).toBe("not-found");
  });

  it("malformed channel-id-like input maps to 'invalid-input' (no upstream call)", async () => {
    const searchChannels = vi.fn();
    const getChannelById = vi.fn();
    const { analyzeChannel } = await loadAnalyzer({
      searchChannels,
      getChannelById,
    });
    // Each string starts with UC and uses the channel-id charset,
    // so the user's intent was unambiguously "a channel id" — but
    // the length falls outside the strict [22, 42] range.
    for (const raw of [
      "UC123",
      "UCTooShort",
      "UC-still-too-short-",
      "UCabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ",
    ]) {
      const result = await analyzeChannel(raw);
      expect(result.status, `for ${raw}`).toBe("error");
      expect(result.fallbackReason, `for ${raw}`).toBe("invalid-input");
    }
    // Malformed inputs never reach the upstream.
    expect(searchChannels).not.toHaveBeenCalled();
    expect(getChannelById).not.toHaveBeenCalled();
  });

  it("YouTube URL with no channel identifier maps to 'invalid-input'", async () => {
    const searchChannels = vi.fn();
    const getChannelById = vi.fn();
    const { analyzeChannel } = await loadAnalyzer({
      searchChannels,
      getChannelById,
    });
    for (const raw of [
      "https://www.youtube.com/",
      "https://youtube.com/watch?v=abc123",
      "https://www.youtube.com/results?search_query=foo",
    ]) {
      const result = await analyzeChannel(raw);
      expect(result.status, `for ${raw}`).toBe("error");
      expect(result.fallbackReason, `for ${raw}`).toBe("invalid-input");
    }
    expect(searchChannels).not.toHaveBeenCalled();
  });

  it("MALFORMED_UPSTREAM (bad JSON) maps to unknown-error", async () => {
    // Genuinely broken upstream JSON should hit the unknown-error
    // bucket — matches the spec's "truly unexpected response shapes"
    // taxonomy.
    const { analyzeChannel } = await loadAnalyzer({
      getChannelById: vi.fn(async () => {
        const { YouTubeApiError: E } = await import("../../errors");
        throw new E(
          502,
          "MALFORMED_UPSTREAM",
          "The YouTube API returned a malformed response.",
        );
      }),
    });
    const result = await analyzeChannel("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(result.fallbackReason).toBe("unknown-error");
  });

  it("a valid @handle with a plausible search hit still returns analyzer results", async () => {
    // Guard: the new confidence-filter must NOT block real handle
    // lookups (this is the exact-match path).
    const searchChannels = vi.fn(async () => [
      {
        channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
        title: "MrBeast",
        handle: "@MrBeast",
        description: "",
        thumbnail: "",
        subscriberCount: 200_000_000,
        hiddenSubscriberCount: false,
      },
    ]);
    const getChannelById = vi.fn(async () => CHANNEL);
    const getRecentVideos = vi.fn(async () => VIDEO_SAMPLE);
    const { analyzeChannel } = await loadAnalyzer({
      searchChannels,
      getChannelById,
      getRecentVideos,
    });
    const result = await analyzeChannel("@MrBeast");
    expect(result.status).toBe("ok");
    expect(result.analysis).not.toBeNull();
    expect(result.analysis?.channel.channelId).toBe(CHANNEL.channelId);
  });

  it("a well-known name query with a substring match still resolves", async () => {
    // The confidence filter accepts a substring match on title.
    // "kurzgesagt" → "Kurzgesagt – In a Nutshell" is the canonical
    // test — a real-world lookup we don't want to regress.
    const searchChannels = vi.fn(async () => [
      {
        channelId: "UCsXVk37bltHxD1rDPwtNM8Q",
        title: "Kurzgesagt – In a Nutshell",
        handle: "@kurzgesagt",
        description: "",
        thumbnail: "",
        subscriberCount: 21_000_000,
        hiddenSubscriberCount: false,
      },
    ]);
    const getChannelById = vi.fn(async () => CHANNEL);
    const { analyzeChannel } = await loadAnalyzer({
      searchChannels,
      getChannelById,
    });
    const result = await analyzeChannel("kurzgesagt");
    expect(result.status).toBe("ok");
    expect(getChannelById).toHaveBeenCalledWith("UCsXVk37bltHxD1rDPwtNM8Q");
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
