import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Ensure the API key is set so `assertKey` doesn't reject early.
beforeEach(() => {
  process.env.YOUTUBE_API_KEY = "test-key";
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function loadYoutube() {
  // Fresh module each call so caches don't leak across tests.
  vi.resetModules();
  const mod = await import("../youtube");
  const cacheMod = await import("../cache");
  cacheMod.searchCache.clear();
  cacheMod.channelCache.clear();
  cacheMod.videosCache.clear();
  return mod;
}

interface MockResponse {
  ok?: boolean;
  status?: number;
  body: unknown;
}

type FetchFn = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

function mockFetchSequence(responses: MockResponse[]) {
  let i = 0;
  const impl: FetchFn = async () => {
    const r = responses[Math.min(i, responses.length - 1)];
    i++;
    return {
      ok: r.ok ?? true,
      status: r.status ?? 200,
      async json() {
        return r.body;
      },
    } as unknown as Response;
  };
  const fetchMock = vi.fn<FetchFn>(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const CHANNEL_ITEM = {
  id: "UC_xxxxxxxxxxxxxxxxxxxxxx",
  snippet: {
    title: "Test Channel",
    description: "Hello world",
    customUrl: "@testchannel",
    publishedAt: "2020-01-01T00:00:00Z",
    country: "US",
    thumbnails: { high: { url: "https://cdn/test.jpg", width: 240, height: 240 } },
  },
  statistics: {
    viewCount: "1000000",
    subscriberCount: "50000",
    videoCount: "42",
  },
  contentDetails: {
    relatedPlaylists: { uploads: "UU_xxxxxxxxxxxxxxxxxxxxxx" },
  },
};

describe("youtube service", () => {
  describe("getChannelById", () => {
    it("maps a channel with public statistics", async () => {
      mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { getChannelById } = await loadYoutube();
      const channel = await getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx");
      expect(channel).not.toBeNull();
      expect(channel!.title).toBe("Test Channel");
      expect(channel!.handle).toBe("@testchannel");
      expect(channel!.subscriberCount).toBe(50000);
      expect(channel!.hiddenSubscriberCount).toBe(false);
      expect(channel!.uploadsPlaylistId).toBe("UU_xxxxxxxxxxxxxxxxxxxxxx");
    });

    it("handles hidden subscriber counts", async () => {
      mockFetchSequence([
        {
          ok: true,
          body: {
            items: [
              {
                ...CHANNEL_ITEM,
                statistics: {
                  ...CHANNEL_ITEM.statistics,
                  hiddenSubscriberCount: true,
                  subscriberCount: undefined,
                },
              },
            ],
          },
        },
      ]);
      const { getChannelById } = await loadYoutube();
      const channel = await getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx");
      expect(channel!.subscriberCount).toBeNull();
      expect(channel!.hiddenSubscriberCount).toBe(true);
    });

    it("handles missing statistics gracefully", async () => {
      mockFetchSequence([
        {
          ok: true,
          body: {
            items: [
              {
                ...CHANNEL_ITEM,
                statistics: undefined,
              },
            ],
          },
        },
      ]);
      const { getChannelById } = await loadYoutube();
      const channel = await getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx");
      expect(channel!.subscriberCount).toBe(0);
      expect(channel!.viewCount).toBe(0);
      expect(channel!.videoCount).toBe(0);
    });

    it("returns null when the channel is not found", async () => {
      mockFetchSequence([{ ok: true, body: { items: [] } }]);
      const { getChannelById } = await loadYoutube();
      expect(await getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx")).toBeNull();
    });

    it("throws QUOTA_EXCEEDED on 403 quotaExceeded", async () => {
      mockFetchSequence([
        {
          ok: false,
          status: 403,
          body: { error: { errors: [{ reason: "quotaExceeded" }] } },
        },
      ]);
      const { getChannelById, YouTubeApiError } = await loadYoutube();
      await expect(
        getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toBeInstanceOf(YouTubeApiError);
      try {
        await getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx");
      } catch (err) {
        expect((err as { code: string }).code).toBe("QUOTA_EXCEEDED");
        expect((err as { status: number }).status).toBe(429);
      }
    });

    it("throws INVALID_API_KEY on 400 badRequest/keyInvalid", async () => {
      mockFetchSequence([
        {
          ok: false,
          status: 400,
          body: { error: { errors: [{ reason: "keyInvalid" }] } },
        },
      ]);
      const { getChannelById } = await loadYoutube();
      await expect(
        getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toMatchObject({ code: "INVALID_API_KEY" });
    });

    it("throws UPSTREAM_UNAVAILABLE on 5xx", async () => {
      mockFetchSequence([{ ok: false, status: 500, body: {} }]);
      const { getChannelById } = await loadYoutube();
      await expect(
        getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toMatchObject({ code: "UPSTREAM_UNAVAILABLE", status: 502 });
    });

    it("throws MISSING_API_KEY if the env var is empty", async () => {
      delete process.env.YOUTUBE_API_KEY;
      mockFetchSequence([{ ok: true, body: {} }]);
      const { getChannelById } = await loadYoutube();
      await expect(
        getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toMatchObject({ code: "MISSING_API_KEY" });
    });

    it("throws NETWORK_ERROR if fetch itself rejects", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new Error("boom");
        }),
      );
      const { getChannelById } = await loadYoutube();
      await expect(
        getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toMatchObject({ code: "NETWORK_ERROR" });
    });

    it("throws UPSTREAM_TIMEOUT if fetch aborts", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          throw err;
        }),
      );
      const { getChannelById } = await loadYoutube();
      await expect(
        getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toMatchObject({ code: "UPSTREAM_TIMEOUT" });
    });

    it("does NOT include the API key in error messages", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new Error("network");
        }),
      );
      const { getChannelById } = await loadYoutube();
      try {
        await getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx");
      } catch (err) {
        expect((err as Error).message).not.toContain("test-key");
      }
    });
  });

  describe("getChannelByHandle", () => {
    it("resolves a handle via channels.list(forHandle)", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { getChannelByHandle } = await loadYoutube();
      const channel = await getChannelByHandle("MrBeast");
      expect(channel).not.toBeNull();
      expect(channel!.title).toBe("Test Channel");
      // Verify it used forHandle parameter, not search
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl] = fetchMock.mock.calls[0];
      expect(String(calledUrl)).toContain("channels");
      expect(String(calledUrl)).toContain("forHandle");
      expect(String(calledUrl)).not.toContain("/search");
    });

    it("returns null when handle is not found", async () => {
      mockFetchSequence([{ ok: true, body: { items: [] } }]);
      const { getChannelByHandle } = await loadYoutube();
      expect(await getChannelByHandle("nonexistent")).toBeNull();
    });

    it("caches handle lookups", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { getChannelByHandle } = await loadYoutube();
      await getChannelByHandle("MrBeast");
      await getChannelByHandle("MrBeast");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("resolveChannelFromInput (searchChannels)", () => {
    it("resolves @MrBeast using channels.list(forHandle) — NOT search.list", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { searchChannels } = await loadYoutube();
      const results = await searchChannels("@MrBeast");
      expect(results).toHaveLength(1);
      expect(results[0].channelId).toBe("UC_xxxxxxxxxxxxxxxxxxxxxx");
      // Verify no search.list calls
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl] = fetchMock.mock.calls[0];
      expect(String(calledUrl)).toContain("/channels?");
      expect(String(calledUrl)).toContain("forHandle");
      expect(String(calledUrl)).not.toContain("/search");
    });

    it("resolves a handle URL using channels.list(forHandle)", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { searchChannels } = await loadYoutube();
      const results = await searchChannels("https://youtube.com/@MrBeast");
      expect(results).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl] = fetchMock.mock.calls[0];
      expect(String(calledUrl)).toContain("forHandle");
      expect(String(calledUrl)).not.toContain("/search");
    });

    it("resolves a channel URL using channels.list(id)", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { searchChannels } = await loadYoutube();
      const results = await searchChannels(
        "https://www.youtube.com/channel/UC_xxxxxxxxxxxxxxxxxxxxxx",
      );
      expect(results).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl] = fetchMock.mock.calls[0];
      expect(String(calledUrl)).toContain("/channels?");
      expect(String(calledUrl)).toContain("id=UC_xxxxxxxxxxxxxxxxxxxxxx");
      expect(String(calledUrl)).not.toContain("/search");
    });

    it("resolves a raw channel ID using channels.list(id)", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { searchChannels } = await loadYoutube();
      const results = await searchChannels("UC_xxxxxxxxxxxxxxxxxxxxxx");
      expect(results).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl] = fetchMock.mock.calls[0];
      expect(String(calledUrl)).toContain("/channels?");
      expect(String(calledUrl)).not.toContain("/search");
    });

    it("rejects plain 'MrBeast' — NEVER calls search.list", async () => {
      const fetchMock = mockFetchSequence([]);
      const { searchChannels } = await loadYoutube();
      await expect(searchChannels("MrBeast")).rejects.toMatchObject({
        code: "UNSUPPORTED_INPUT",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rejects 'hjbhj' — NEVER calls search.list", async () => {
      const fetchMock = mockFetchSequence([]);
      const { searchChannels } = await loadYoutube();
      await expect(searchChannels("hjbhj")).rejects.toMatchObject({
        code: "UNSUPPORTED_INPUT",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns [] when handle is not found (no error)", async () => {
      mockFetchSequence([{ ok: true, body: { items: [] } }]);
      const { searchChannels } = await loadYoutube();
      expect(await searchChannels("@nonexistentchannel123")).toEqual([]);
    });

    it("cached requests produce no additional YouTube calls", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { searchChannels } = await loadYoutube();
      await searchChannels("@MrBeast");
      await searchChannels("@MrBeast");
      await searchChannels("@MrBeast");
      // Only 1 upstream call despite 3 invocations
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("simultaneous identical requests perform one upstream lookup", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { searchChannels } = await loadYoutube();
      // Fire 3 concurrent requests for the same input
      const [r1, r2, r3] = await Promise.all([
        searchChannels("@MrBeast"),
        searchChannels("@MrBeast"),
        searchChannels("@MrBeast"),
      ]);
      expect(r1).toEqual(r2);
      expect(r2).toEqual(r3);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("getRecentVideos", () => {
    it("maps playlist items + video details (batched)", async () => {
      mockFetchSequence([
        {
          ok: true,
          body: {
            items: [
              { contentDetails: { videoId: "vid1" } },
              { contentDetails: { videoId: "vid2" } },
            ],
          },
        },
        {
          ok: true,
          body: {
            items: [
              {
                id: "vid1",
                snippet: {
                  title: "One",
                  description: "",
                  publishedAt: "2025-01-01T00:00:00Z",
                  thumbnails: {},
                },
                contentDetails: { duration: "PT5M" },
                statistics: {
                  viewCount: "1000",
                  likeCount: "10",
                  commentCount: "2",
                },
              },
              {
                id: "vid2",
                snippet: {
                  title: "Short",
                  description: "",
                  publishedAt: "2025-01-02T00:00:00Z",
                  thumbnails: {},
                },
                contentDetails: { duration: "PT45S" },
                statistics: undefined,
              },
            ],
          },
        },
      ]);
      const { getRecentVideos } = await loadYoutube();
      const videos = await getRecentVideos("UU_xxxxxxxxxxxxxxxxxxxxxx", 12);
      expect(videos).toHaveLength(2);
      expect(videos[0].viewCount).toBe(1000);
      expect(videos[0].isShort).toBe(false);
      expect(videos[1].isShort).toBe(true);
      expect(videos[1].viewCount).toBe(0); // statistics missing
      expect(videos[1].url).toContain("shorts/");
    });

    it("videos.list is batched (one call for multiple IDs)", async () => {
      const fetchMock = mockFetchSequence([
        {
          ok: true,
          body: {
            items: [
              { contentDetails: { videoId: "vid1" } },
              { contentDetails: { videoId: "vid2" } },
              { contentDetails: { videoId: "vid3" } },
            ],
          },
        },
        {
          ok: true,
          body: {
            items: [
              {
                id: "vid1",
                snippet: { title: "V1", description: "", publishedAt: "2025-01-01T00:00:00Z", thumbnails: {} },
                contentDetails: { duration: "PT5M" },
                statistics: { viewCount: "100" },
              },
              {
                id: "vid2",
                snippet: { title: "V2", description: "", publishedAt: "2025-01-01T00:00:00Z", thumbnails: {} },
                contentDetails: { duration: "PT3M" },
                statistics: { viewCount: "200" },
              },
              {
                id: "vid3",
                snippet: { title: "V3", description: "", publishedAt: "2025-01-01T00:00:00Z", thumbnails: {} },
                contentDetails: { duration: "PT10M" },
                statistics: { viewCount: "300" },
              },
            ],
          },
        },
      ]);
      const { getRecentVideos } = await loadYoutube();
      const videos = await getRecentVideos("UU_xxxxxxxxxxxxxxxxxxxxxx", 12);
      expect(videos).toHaveLength(3);
      // Verify exactly 2 fetch calls: 1 playlistItems + 1 videos (batched)
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const [videosUrl] = fetchMock.mock.calls[1];
      expect(String(videosUrl)).toContain("videos");
      expect(String(videosUrl)).toContain("id=vid1%2Cvid2%2Cvid3");
    });

    it("skips missing videos (deleted / private)", async () => {
      mockFetchSequence([
        {
          ok: true,
          body: {
            items: [
              { contentDetails: { videoId: "vid1" } },
              { contentDetails: { videoId: "vid2" } },
            ],
          },
        },
        {
          ok: true,
          body: {
            // vid2 missing entirely (deleted / private)
            items: [
              {
                id: "vid1",
                snippet: {
                  title: "One",
                  description: "",
                  publishedAt: "2025-01-01T00:00:00Z",
                  thumbnails: {},
                },
                contentDetails: { duration: "PT5M" },
                statistics: { viewCount: "1000" },
              },
            ],
          },
        },
      ]);
      const { getRecentVideos } = await loadYoutube();
      const videos = await getRecentVideos("UU_xxxxxxxxxxxxxxxxxxxxxx");
      expect(videos).toHaveLength(1);
      expect(videos[0].videoId).toBe("vid1");
    });

    it("returns [] on an empty playlist", async () => {
      mockFetchSequence([{ ok: true, body: { items: [] } }]);
      const { getRecentVideos } = await loadYoutube();
      expect(await getRecentVideos("UU_xxxxxxxxxxxxxxxxxxxxxx")).toEqual([]);
    });
  });
});
