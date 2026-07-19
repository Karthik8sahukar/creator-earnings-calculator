import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Manual-verification harness — mirrors the exact examples requested
 * on PR #16 review:
 *
 *   1. @MrBeast
 *   2. https://www.youtube.com/@MrBeast
 *   3. UCX6OQ3DkcsbYNE6H8uQQuVA
 *   4. hjbhj
 *   5. empty input
 *
 * The point of this file is to serve as a checked-in traceable record
 * of what each of those inputs produces, so future reviewers can
 * scan a single file to confirm the taxonomy still holds.
 */

const CHANNEL_MRBEAST: import("@/types/youtube").ChannelDetails = {
  channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
  title: "MrBeast",
  handle: "@MrBeast",
  description: "SUBSCRIBE FOR A COOKIE!",
  thumbnail: "https://yt3.googleusercontent.com/mrbeast.jpg",
  bannerUrl: null,
  subscriberCount: 200_000_000,
  hiddenSubscriberCount: false,
  viewCount: 40_000_000_000,
  videoCount: 800,
  publishedAt: "2012-02-20T00:00:00Z",
  country: "US",
  uploadsPlaylistId: "UUX6OQ3DkcsbYNE6H8uQQuVA",
  channelUrl: "https://www.youtube.com/@MrBeast",
  customUrl: "@MrBeast",
};

const MRBEAST_VIDEOS: import("@/types/youtube").VideoItem[] = [
  {
    videoId: "vid1",
    title: "$1 vs $1,000,000 Vacation",
    description: "",
    thumbnail: "",
    publishedAt: new Date().toISOString(),
    viewCount: 200_000_000,
    likeCount: 8_000_000,
    commentCount: 200_000,
    durationSeconds: 900,
    durationLabel: "15:00",
    isShort: false,
    url: "https://www.youtube.com/watch?v=vid1",
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
    getChannelById: mocks.getChannelById ?? vi.fn(),
    getRecentVideos: mocks.getRecentVideos ?? vi.fn(async () => []),
    searchChannels: mocks.searchChannels ?? vi.fn(async () => []),
  }));
  return import("../analyzeChannel");
}

describe("Channel Analyzer — manual verification of reviewer examples", () => {
  it("1. `@MrBeast` → ok, resolves via handle search", async () => {
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
    const getChannelById = vi.fn(async () => CHANNEL_MRBEAST);
    const getRecentVideos = vi.fn(async () => MRBEAST_VIDEOS);
    const { analyzeChannel } = await loadAnalyzer({
      searchChannels,
      getChannelById,
      getRecentVideos,
    });
    const r = await analyzeChannel("@MrBeast");
    expect(r.status).toBe("ok");
    expect(r.fallbackReason).toBeNull();
    expect(r.analysis?.channel.channelId).toBe("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(searchChannels).toHaveBeenCalledWith("@MrBeast");
  });

  it("2. `https://www.youtube.com/@MrBeast` → ok, resolves the same channel", async () => {
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
    const getChannelById = vi.fn(async () => CHANNEL_MRBEAST);
    const { analyzeChannel } = await loadAnalyzer({
      searchChannels,
      getChannelById,
      getRecentVideos: vi.fn(async () => MRBEAST_VIDEOS),
    });
    const r = await analyzeChannel("https://www.youtube.com/@MrBeast");
    expect(r.status).toBe("ok");
    expect(r.input.kind).toBe("handle");
    expect(r.input.value).toBe("MrBeast");
    expect(r.analysis?.channel.channelId).toBe("UCX6OQ3DkcsbYNE6H8uQQuVA");
  });

  it("3. `UCX6OQ3DkcsbYNE6H8uQQuVA` → ok, resolves via direct channel lookup (no search call)", async () => {
    const searchChannels = vi.fn();
    const getChannelById = vi.fn(async () => CHANNEL_MRBEAST);
    const { analyzeChannel } = await loadAnalyzer({
      searchChannels,
      getChannelById,
      getRecentVideos: vi.fn(async () => MRBEAST_VIDEOS),
    });
    const r = await analyzeChannel("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(r.status).toBe("ok");
    expect(r.input.kind).toBe("channelId");
    // Channel-id path never invokes search — proves the cache-friendly
    // fast path.
    expect(searchChannels).not.toHaveBeenCalled();
    expect(getChannelById).toHaveBeenCalledWith("UCX6OQ3DkcsbYNE6H8uQQuVA");
  });

  it("4. `hjbhj` → not-found (never surfaces 'The YouTube API returned an unexpected response.')", async () => {
    // Scenario A: YouTube returned empty items.
    {
      const searchChannels = vi.fn(async () => []);
      const { analyzeChannel } = await loadAnalyzer({ searchChannels });
      const r = await analyzeChannel("hjbhj");
      expect(r.status).toBe("error");
      expect(r.fallbackReason).toBe("not-found");
    }
    // Scenario B: YouTube returned tangentially-related items (a
    // typo query CAN surface unrelated channels). Still not-found.
    {
      vi.resetModules();
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
      const r = await analyzeChannel("hjbhj");
      expect(r.status).toBe("error");
      expect(r.fallbackReason).toBe("not-found");
      expect(getChannelById).not.toHaveBeenCalled();
    }
  });

  it("5. `''` (empty) → empty status, no upstream call", async () => {
    const searchChannels = vi.fn();
    const getChannelById = vi.fn();
    const { analyzeChannel } = await loadAnalyzer({
      searchChannels,
      getChannelById,
    });
    const r = await analyzeChannel("");
    expect(r.status).toBe("empty");
    expect(r.fallbackReason).toBe("empty-input");
    expect(searchChannels).not.toHaveBeenCalled();
    expect(getChannelById).not.toHaveBeenCalled();
  });
});
