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
  // Explicit generic so `mock.calls[i][0]` types as a URL string —
  // tests below inspect the outgoing URL to prove endpoint routing.
  const fetchMock = vi.fn<
    (input: string | URL, init?: RequestInit) => Promise<Response>
  >(async () => {
    const r = responses[Math.min(i, responses.length - 1)];
    i++;
    const serialized = JSON.stringify(r.body);
    return {
      ok: r.ok ?? true,
      status: r.status ?? 200,
      async json() {
        return r.body;
      },
      async text() {
        return serialized;
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

    it("throws INVALID_API_KEY on 400 keyInvalid", async () => {
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

    it("throws INVALID_API_KEY on 403 keyInvalid", async () => {
      mockFetchSequence([
        {
          ok: false,
          status: 403,
          body: { error: { errors: [{ reason: "keyInvalid" }] } },
        },
      ]);
      const { getChannelById } = await loadYoutube();
      await expect(
        getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toMatchObject({ code: "INVALID_API_KEY" });
    });

    it("throws KEY_RESTRICTED when the key has an ipRefererBlocked restriction", async () => {
      mockFetchSequence([
        {
          ok: false,
          status: 403,
          body: { error: { errors: [{ reason: "ipRefererBlocked" }] } },
        },
      ]);
      const { getChannelById } = await loadYoutube();
      await expect(
        getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toMatchObject({ code: "KEY_RESTRICTED", status: 500 });
    });

    it("throws API_DISABLED when YouTube Data API v3 is not enabled", async () => {
      mockFetchSequence([
        {
          ok: false,
          status: 403,
          body: {
            error: {
              status: "PERMISSION_DENIED",
              errors: [{ reason: "accessNotConfigured" }],
            },
          },
        },
      ]);
      const { getChannelById } = await loadYoutube();
      await expect(
        getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toMatchObject({ code: "API_DISABLED", status: 500 });
    });

    it("throws API_DISABLED when Google returns SERVICE_DISABLED as status", async () => {
      // Some Google responses only expose the enum in `error.status`
      // without an `errors[0].reason`. Verify we still classify correctly.
      mockFetchSequence([
        {
          ok: false,
          status: 403,
          body: {
            error: {
              status: "SERVICE_DISABLED",
              message: "YouTube Data API v3 has not been used…",
            },
          },
        },
      ]);
      const { getChannelById } = await loadYoutube();
      await expect(
        getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toMatchObject({ code: "API_DISABLED" });
    });

    it("throws BAD_REQUEST on 400 invalidArgument (no longer the confusing 'unexpected response')", async () => {
      mockFetchSequence([
        {
          ok: false,
          status: 400,
          body: { error: { errors: [{ reason: "invalidArgument" }] } },
        },
      ]);
      const { getChannelById } = await loadYoutube();
      const rejected = getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx");
      await expect(rejected).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(rejected).rejects.toThrow(
        /rejected this request|try a different search term/i,
      );
    });

    it("returns YOUTUBE_API_ERROR (not the old 'unexpected response') for unknown status shapes", async () => {
      // Simulate a broken edge proxy that returns HTML on a non-2xx.
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
          ok: false,
          status: 418, // teapot — not one of our explicit branches
          async text() {
            return "<html>not json</html>";
          },
          async json() {
            throw new Error("not json");
          },
        }) as unknown as Response),
      );
      const { getChannelById } = await loadYoutube();
      const rejected = getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx");
      await expect(rejected).rejects.toMatchObject({
        code: "YOUTUBE_API_ERROR",
      });
      await expect(rejected).rejects.toThrow(
        /temporarily unavailable/i,
      );
    });

    it("throws UPSTREAM_UNAVAILABLE on 5xx", async () => {
      mockFetchSequence([{ ok: false, status: 500, body: {} }]);
      const { getChannelById } = await loadYoutube();
      await expect(
        getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toMatchObject({ code: "UPSTREAM_UNAVAILABLE", status: 502 });
    });

    it("throws MALFORMED_UPSTREAM on a 200 with a body that isn't valid JSON", async () => {
      // Simulate an edge / gateway returning HTML with a 200 status.
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
          ok: true,
          status: 200,
          async json() {
            throw new SyntaxError("Unexpected token < in JSON");
          },
          async text() {
            return "<html>not json</html>";
          },
        }) as unknown as Response),
      );
      const { getChannelById } = await loadYoutube();
      await expect(
        getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toMatchObject({ code: "MALFORMED_UPSTREAM", status: 502 });
    });

    it("throws MISSING_API_KEY if the env var is empty", async () => {
      delete process.env.YOUTUBE_API_KEY;
      mockFetchSequence([{ ok: true, body: {} }]);
      const { getChannelById } = await loadYoutube();
      await expect(
        getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toMatchObject({ code: "MISSING_API_KEY" });
    });

    it("MISSING_API_KEY message tells the operator how to fix it", async () => {
      delete process.env.YOUTUBE_API_KEY;
      mockFetchSequence([{ ok: true, body: {} }]);
      const { getChannelById } = await loadYoutube();
      try {
        await getChannelById("UC_xxxxxxxxxxxxxxxxxxxxxx");
      } catch (err) {
        expect((err as Error).message).toMatch(/YOUTUBE_API_KEY/);
      }
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

  // -----------------------------------------------------------------
  // Quota-efficiency contracts
  //
  // These tests are the safety net for the biggest cause of quota
  // exhaustion in this app. Each one guards a specific low-cost path
  // that MUST be preferred over the expensive `search.list` endpoint
  // (100 quota units).
  // -----------------------------------------------------------------
  describe("searchChannels — quota-efficient routing", () => {
    it("routes a raw UC… channel id to channels.list (1 unit), NEVER search.list (100 units)", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { searchChannels } = await loadYoutube();
      const results = await searchChannels("UC_xxxxxxxxxxxxxxxxxxxxxx");

      expect(results).toHaveLength(1);
      expect(results[0].channelId).toBe("UC_xxxxxxxxxxxxxxxxxxxxxx");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain("/channels?");
      expect(url).not.toContain("/search?");
      expect(url).toContain("id=UC_xxxxxxxxxxxxxxxxxxxxxx");
    });

    it("routes a /channel/UC… YouTube URL to channels.list, NEVER search.list", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { searchChannels } = await loadYoutube();
      const results = await searchChannels(
        "https://www.youtube.com/channel/UC_xxxxxxxxxxxxxxxxxxxxxx",
      );
      expect(results).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain("/channels?");
      expect(url).not.toContain("/search?");
    });

    it("routes an @handle to channels.list?forHandle (1 unit), NEVER search.list (100 units)", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { searchChannels } = await loadYoutube();
      const results = await searchChannels("@MrBeast");
      expect(results).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain("/channels?");
      expect(url).not.toContain("/search?");
      // The API takes forHandle=<handle> (with or without @); we send @.
      expect(url).toContain("forHandle=%40mrbeast");
    });

    it("routes youtube.com/@handle to channels.list?forHandle, NEVER search.list", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { searchChannels } = await loadYoutube();
      await searchChannels("https://www.youtube.com/@MrBeast");
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain("/channels?");
      expect(url).not.toContain("/search?");
    });

    it("only uses search.list when the input is plain text", async () => {
      const fetchMock = mockFetchSequence([
        // search.list response — channel-search item shape.
        {
          ok: true,
          body: {
            items: [
              {
                id: { kind: "youtube#channel", channelId: "UC_x" },
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
        // channels.list enrichment
        { ok: true, body: { items: [{ ...CHANNEL_ITEM, id: "UC_x" }] } },
      ]);
      const { searchChannels } = await loadYoutube();
      await searchChannels("mr beast");
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0][0]).toContain("/search?");
      expect(fetchMock.mock.calls[1][0]).toContain("/channels?");
    });

    it("normalizes 'Mr Beast', 'mr beast' and '  mr   beast  ' to the same cache key", async () => {
      const fetchMock = mockFetchSequence([
        {
          ok: true,
          body: {
            items: [
              {
                id: { kind: "youtube#channel", channelId: "UC_x" },
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
        { ok: true, body: { items: [{ ...CHANNEL_ITEM, id: "UC_x" }] } },
      ]);
      const { searchChannels } = await loadYoutube();
      await searchChannels("Mr Beast");
      // A shallow-differing query MUST hit the cache — no extra fetches.
      await searchChannels("mr beast");
      await searchChannels("  mr   beast  ");
      // Only the first search burned quota (2 fetches: search + enrich).
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("exposes isSearchCached() as a peek without side effects", async () => {
      mockFetchSequence([
        {
          ok: true,
          body: {
            items: [
              {
                id: { kind: "youtube#channel", channelId: "UC_x" },
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
        { ok: true, body: { items: [{ ...CHANNEL_ITEM, id: "UC_x" }] } },
      ]);
      const { searchChannels, isSearchCached } = await loadYoutube();
      expect(isSearchCached("Mr Beast")).toBe(false);
      await searchChannels("Mr Beast");
      // Any normalized form of the same query is a cache hit.
      expect(isSearchCached("mr beast")).toBe(true);
      expect(isSearchCached("  MR   BEAST  ")).toBe(true);
      expect(isSearchCached("someone else")).toBe(false);
    });
  });

  describe("getChannelByHandle", () => {
    it("uses channels.list?forHandle= (never search.list)", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { getChannelByHandle } = await loadYoutube();
      const details = await getChannelByHandle("testchannel");
      expect(details).not.toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain("/channels?");
      expect(url).toContain("forHandle=%40testchannel");
      expect(url).not.toContain("/search?");
    });

    it("strips a leading @ and lowercases before caching", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { getChannelByHandle } = await loadYoutube();
      await getChannelByHandle("@TestChannel");
      await getChannelByHandle("testchannel");
      // Second call hits the cache — no extra fetch.
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("returns null when the handle has no matching channel", async () => {
      mockFetchSequence([{ ok: true, body: { items: [] } }]);
      const { getChannelByHandle } = await loadYoutube();
      expect(await getChannelByHandle("nobody")).toBeNull();
    });

    it("returns null for an empty handle without calling the API", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const { getChannelByHandle } = await loadYoutube();
      expect(await getChannelByHandle("")).toBeNull();
      expect(await getChannelByHandle("   ")).toBeNull();
      expect(await getChannelByHandle("@")).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("cross-populates the channel-id cache so a subsequent getChannelById is free", async () => {
      const fetchMock = mockFetchSequence([
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { getChannelByHandle, getChannelById } = await loadYoutube();
      const byHandle = await getChannelByHandle("testchannel");
      expect(byHandle).not.toBeNull();
      // Now looking up by the discovered channel id must be a cache hit.
      const byId = await getChannelById(byHandle!.channelId);
      expect(byId).toEqual(byHandle);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("quota circuit breaker", () => {
    it("opens on QUOTA_EXCEEDED and short-circuits further calls WITHOUT invoking fetch", async () => {
      const fetchMock = mockFetchSequence([
        // First fetch: quota exceeded.
        {
          ok: false,
          status: 403,
          body: { error: { errors: [{ reason: "quotaExceeded" }] } },
        },
        // If the circuit breaker weren't opened, the second call would
        // reach this response. We use ok:true here to detect leakage:
        // if the test still ends up calling fetch a second time, it
        // will get a success and the assertion below will fail.
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { getChannelById, _quotaCircuitBreakerForTests } =
        await loadYoutube();
      _quotaCircuitBreakerForTests.reset();

      // First call trips the breaker.
      await expect(
        getChannelById("UC_first"),
      ).rejects.toMatchObject({ code: "QUOTA_EXCEEDED" });
      expect(_quotaCircuitBreakerForTests.isOpen()).toBe(true);

      // Second call is short-circuited: fetch must NOT be called again.
      await expect(
        getChannelById("UC_second"),
      ).rejects.toMatchObject({ code: "QUOTA_EXCEEDED" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("blocks EVERY call during the cooldown window without hitting fetch", async () => {
      const fetchMock = mockFetchSequence([
        // If any call leaks past the breaker, we return success so the
        // test can detect the leak (via the final assertion).
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { getChannelById, _quotaCircuitBreakerForTests } =
        await loadYoutube();
      _quotaCircuitBreakerForTests.reset();
      _quotaCircuitBreakerForTests.trip();

      // Ten rapid calls during the cooldown window.
      for (let i = 0; i < 10; i++) {
        await expect(
          getChannelById(`UC_${i.toString().padStart(22, "0")}`),
        ).rejects.toMatchObject({ code: "QUOTA_EXCEEDED" });
      }
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("permits exactly one probe request after the cooldown elapses", async () => {
      const fetchMock = mockFetchSequence([
        // The one probe that gets through: succeed and close the breaker.
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { getChannelById, _quotaCircuitBreakerForTests } =
        await loadYoutube();
      _quotaCircuitBreakerForTests.reset();
      _quotaCircuitBreakerForTests.trip();
      // Simulate cooldown elapsing.
      _quotaCircuitBreakerForTests.ageBy(
        _quotaCircuitBreakerForTests.cooldownMs + 1,
      );
      // The next call is the probe — it MUST reach the upstream.
      const details = await getChannelById("UC_probe1111111111111111");
      expect(details).not.toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      // Success -> breaker is fully closed.
      expect(_quotaCircuitBreakerForTests.isOpen()).toBe(false);
      expect(_quotaCircuitBreakerForTests.isHalfOpen()).toBe(false);
    });

    it("re-arms the breaker when the probe request also gets QUOTA_EXCEEDED", async () => {
      const fetchMock = mockFetchSequence([
        // The probe itself gets QUOTA_EXCEEDED — breaker must re-open.
        {
          ok: false,
          status: 403,
          body: { error: { errors: [{ reason: "quotaExceeded" }] } },
        },
        // If a second call sneaks past the re-armed breaker, this
        // success would surface it. The assertion count catches that.
        { ok: true, body: { items: [CHANNEL_ITEM] } },
      ]);
      const { getChannelById, _quotaCircuitBreakerForTests } =
        await loadYoutube();
      _quotaCircuitBreakerForTests.reset();
      _quotaCircuitBreakerForTests.trip();
      _quotaCircuitBreakerForTests.ageBy(
        _quotaCircuitBreakerForTests.cooldownMs + 1,
      );

      // Probe fails with quota.
      await expect(
        getChannelById("UC_probe1111111111111111"),
      ).rejects.toMatchObject({ code: "QUOTA_EXCEEDED" });
      // The next call happens WITHIN the new cooldown window - must
      // NOT call fetch again.
      await expect(
        getChannelById("UC_after11111111111111"),
      ).rejects.toMatchObject({ code: "QUOTA_EXCEEDED" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(_quotaCircuitBreakerForTests.isOpen()).toBe(true);
    });

    it("releases the probe slot on non-quota upstream failures so the next caller can retry", async () => {
      const fetchMock = mockFetchSequence([
        // Probe gets a 500 (transient upstream problem) - probe is
        // released, breaker stays open (still within its own cooldown
        // for this scenario), and the next real call after cooldown
        // can probe again.
        { ok: false, status: 500, body: {} },
      ]);
      const { getChannelById, _quotaCircuitBreakerForTests } =
        await loadYoutube();
      _quotaCircuitBreakerForTests.reset();
      _quotaCircuitBreakerForTests.trip();
      _quotaCircuitBreakerForTests.ageBy(
        _quotaCircuitBreakerForTests.cooldownMs + 1,
      );
      await expect(
        getChannelById("UC_probe1111111111111111"),
      ).rejects.toMatchObject({ code: "UPSTREAM_UNAVAILABLE" });
      // After a non-quota failure, isHalfOpen must be false (probe
      // slot released) so subsequent callers aren't left stuck.
      expect(_quotaCircuitBreakerForTests.isHalfOpen()).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
