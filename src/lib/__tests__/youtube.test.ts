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

function mockFetchSequence(responses: MockResponse[]) {
  let i = 0;
  const fetchMock = vi.fn(async () => {
    const r = responses[Math.min(i, responses.length - 1)];
    i++;
    return {
      ok: r.ok ?? true,
      status: r.status ?? 200,
      async json() {
        return r.body;
      },
    } as unknown as Response;
  });
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

  describe("searchChannels", () => {
    it("resolves a raw channel id directly (single upstream call)", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { searchChannels } = await loadYoutube();
      const results = await searchChannels("UC_xxxxxxxxxxxxxxxxxxxxxx");
      expect(results).toHaveLength(1);
      expect(results[0].channelId).toBe("UC_xxxxxxxxxxxxxxxxxxxxxx");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("performs a name search + channel enrichment (two upstream calls)", async () => {
      const fetchMock = mockFetchSequence([
        {
          ok: true,
          body: {
            items: [
              {
                id: { channelId: "UC_xxxxxxxxxxxxxxxxxxxxxx" },
                snippet: {
                  title: "T",
                  description: "",
                  channelTitle: "T",
                  thumbnails: {},
                  publishedAt: "2020-01-01T00:00:00Z",
                },
              },
            ],
          },
        },
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { searchChannels } = await loadYoutube();
      const results = await searchChannels("test");
      expect(results).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("returns [] when search finds nothing", async () => {
      mockFetchSequence([{ ok: true, body: { items: [] } }]);
      const { searchChannels } = await loadYoutube();
      expect(await searchChannels("qwertyxyzzz")).toEqual([]);
    });

    // ─── Handle path (channels.list?forHandle=) ────────────────────
    //
    // The tests below verify the fix that avoids the 100-search-per-day
    // Search Queries quota bucket by resolving handles through the
    // general-quota `channels.list?forHandle=` endpoint. See the
    // docstring on `getChannelByHandle` for the quota model.

    it("resolves an @handle via channels.list?forHandle= (1 upstream call, no search.list)", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { searchChannels } = await loadYoutube();
      const results = await searchChannels("@testchannel");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [callArgs] = fetchMock.mock.calls as unknown as [[string]];
      const url = new URL(callArgs[0]);
      expect(url.pathname).toContain("/channels");
      expect(url.pathname).not.toContain("/search");
      expect(url.searchParams.get("forHandle")).toBe("@testchannel");
      // Two Search-Queries-quota params must NOT be present.
      expect(url.searchParams.get("q")).toBeNull();
      expect(url.searchParams.get("type")).toBeNull();

      expect(results).toHaveLength(1);
      expect(results[0].channelId).toBe("UC_xxxxxxxxxxxxxxxxxxxxxx");
      expect(results[0].handle).toBe("@testchannel");
    });
  });

  describe("getChannelByHandle", () => {
    it("hits channels.list with forHandle exactly once", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { getChannelByHandle } = await loadYoutube();
      const channel = await getChannelByHandle("@testchannel");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [callArgs] = fetchMock.mock.calls as unknown as [[string]];
      const url = new URL(callArgs[0]);
      expect(url.pathname).toContain("/channels");
      expect(url.searchParams.get("forHandle")).toBe("@testchannel");
      // Requesting the parts the profile page needs so a follow-up
      // `getChannelById` doesn't have to fetch again.
      const part = url.searchParams.get("part") ?? "";
      expect(part).toContain("snippet");
      expect(part).toContain("statistics");
      expect(part).toContain("contentDetails");

      expect(channel).not.toBeNull();
      expect(channel!.channelId).toBe("UC_xxxxxxxxxxxxxxxxxxxxxx");
      expect(channel!.title).toBe("Test Channel");
    });

    it("normalizes handles that lack the leading '@'", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { getChannelByHandle } = await loadYoutube();
      await getChannelByHandle("bareHandle");
      const [callArgs] = fetchMock.mock.calls as unknown as [[string]];
      const url = new URL(callArgs[0]);
      expect(url.searchParams.get("forHandle")).toBe("@bareHandle");
    });

    it("returns null when the API returns items: []", async () => {
      mockFetchSequence([{ ok: true, body: { items: [] } }]);
      const { getChannelByHandle } = await loadYoutube();
      expect(await getChannelByHandle("@nonexistent")).toBeNull();
    });

    it("propagates YouTubeApiError so callers can render initials fallback", async () => {
      // We simulate the exact quota-exhausted response the old
      // `search.list` path used to return in production. The caller
      // (`resolveCreatorAvatar` in `creatorAvatars.ts`) catches this
      // error and returns null, which the card renders as an initial
      // — see the `returns null (never throws) on any YouTubeApiError`
      // test in `creatorAvatars.test.ts` for the caller side.
      mockFetchSequence([
        {
          ok: false,
          status: 403,
          body: { error: { errors: [{ reason: "quotaExceeded" }] } },
        },
      ]);
      const { getChannelByHandle, YouTubeApiError } = await loadYoutube();
      await expect(getChannelByHandle("@test")).rejects.toBeInstanceOf(
        YouTubeApiError,
      );
      try {
        await getChannelByHandle("@test");
      } catch (err) {
        expect((err as { code: string }).code).toBe("QUOTA_EXCEEDED");
      }
    });

    it("seeds the channel:<id> cache — subsequent getChannelById is a free hit", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { getChannelByHandle, getChannelById } = await loadYoutube();

      // First call: real upstream fetch via forHandle.
      const byHandle = await getChannelByHandle("@testchannel");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(byHandle!.channelId).toBe("UC_xxxxxxxxxxxxxxxxxxxxxx");

      // Second call: same channelId; must be served from the cache
      // that `getChannelByHandle` seeded, with zero additional fetches.
      // This is why the fix costs 1 quota unit per creator instead of
      // 2 — the profile page's `resolveChannel()` calls both.
      const byId = await getChannelById(byHandle!.channelId);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(byId).toEqual(byHandle);
    });
  });

  describe("getRecentVideos", () => {
    it("maps playlist items + video details", async () => {
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
