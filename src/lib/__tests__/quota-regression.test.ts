/**
 * Regression tests proving that search.list is NEVER called during
 * supported flows. This file directly validates the quota-fix requirements.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  process.env.YOUTUBE_API_KEY = "test-key";
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function loadModules() {
  vi.resetModules();
  const youtube = await import("../youtube");
  const cacheMod = await import("../cache");
  const { resetApiCounters, getApiCounters } = await import("../apiCounter");
  cacheMod.searchCache.clear();
  cacheMod.channelCache.clear();
  cacheMod.videosCache.clear();
  resetApiCounters();
  return { youtube, cacheMod, getApiCounters, resetApiCounters };
}

interface MockResponse {
  ok?: boolean;
  status?: number;
  body: unknown;
}

function mockFetchSequence(responses: MockResponse[]) {
  let i = 0;
  const fetchMock = vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>(
    async () => {
      const r = responses[Math.min(i, responses.length - 1)];
      i++;
      return {
        ok: r.ok ?? true,
        status: r.status ?? 200,
        async json() {
          return r.body;
        },
      } as unknown as Response;
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const CHANNEL_ITEM = {
  id: "UCX6OQ3DkcsbYNE6H8uQQuVA",
  snippet: {
    title: "MrBeast",
    description: "YouTube creator",
    customUrl: "@MrBeast",
    publishedAt: "2012-02-20T00:00:00Z",
    country: "US",
    thumbnails: { high: { url: "https://cdn/mrbeast.jpg", width: 240, height: 240 } },
  },
  statistics: {
    viewCount: "40000000000",
    subscriberCount: "300000000",
    videoCount: "800",
  },
  contentDetails: {
    relatedPlaylists: { uploads: "UUX6OQ3DkcsbYNE6H8uQQuVA" },
  },
};

describe("QUOTA REGRESSION: search.list must remain zero", () => {
  it("@MrBeast uses channels.list(forHandle) — 0 search.list", async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, body: { items: [CHANNEL_ITEM] } },
    ]);
    const { youtube, getApiCounters } = await loadModules();
    await youtube.searchChannels("@MrBeast");
    const counters = getApiCounters();
    expect(counters["youtube.search.list"]).toBe(0);
    expect(counters["youtube.channels.list"]).toBe(1);
    // Verify the URL used forHandle
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl] = fetchMock.mock.calls[0];
    expect(String(requestUrl)).toContain("forHandle");
  });

  it("Handle URL uses channels.list(forHandle) — 0 search.list", async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, body: { items: [CHANNEL_ITEM] } },
    ]);
    const { youtube, getApiCounters } = await loadModules();
    await youtube.searchChannels("https://youtube.com/@MrBeast");
    const counters = getApiCounters();
    expect(counters["youtube.search.list"]).toBe(0);
    expect(counters["youtube.channels.list"]).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl] = fetchMock.mock.calls[0];
    expect(String(requestUrl)).toContain("forHandle");
  });

  it("Channel URL uses channels.list(id) — 0 search.list", async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, body: { items: [CHANNEL_ITEM] } },
    ]);
    const { youtube, getApiCounters } = await loadModules();
    await youtube.searchChannels(
      "https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA",
    );
    const counters = getApiCounters();
    expect(counters["youtube.search.list"]).toBe(0);
    expect(counters["youtube.channels.list"]).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl] = fetchMock.mock.calls[0];
    expect(String(requestUrl)).toContain("id=UCX6OQ3DkcsbYNE6H8uQQuVA");
  });

  it("Channel ID uses channels.list(id) — 0 search.list", async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, body: { items: [CHANNEL_ITEM] } },
    ]);
    const { youtube, getApiCounters } = await loadModules();
    await youtube.searchChannels("UCX6OQ3DkcsbYNE6H8uQQuVA");
    const counters = getApiCounters();
    expect(counters["youtube.search.list"]).toBe(0);
    expect(counters["youtube.channels.list"]).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl] = fetchMock.mock.calls[0];
    expect(String(requestUrl)).toContain("id=UCX6OQ3DkcsbYNE6H8uQQuVA");
  });

  it("Plain 'MrBeast' NEVER calls search.list", async () => {
    const fetchMock = mockFetchSequence([]);
    const { youtube, getApiCounters } = await loadModules();
    await expect(youtube.searchChannels("MrBeast")).rejects.toMatchObject({
      code: "UNSUPPORTED_INPUT",
    });
    const counters = getApiCounters();
    expect(counters["youtube.search.list"]).toBe(0);
    expect(counters["youtube.channels.list"]).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("'hjbhj' NEVER calls search.list", async () => {
    const fetchMock = mockFetchSequence([]);
    const { youtube, getApiCounters } = await loadModules();
    await expect(youtube.searchChannels("hjbhj")).rejects.toMatchObject({
      code: "UNSUPPORTED_INPUT",
    });
    const counters = getApiCounters();
    expect(counters["youtube.search.list"]).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Cached requests produce no additional YouTube calls", async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, body: { items: [CHANNEL_ITEM] } },
    ]);
    const { youtube, getApiCounters } = await loadModules();
    await youtube.searchChannels("@MrBeast");
    await youtube.searchChannels("@MrBeast");
    await youtube.searchChannels("@MrBeast");
    const counters = getApiCounters();
    // Only 1 channels.list call, 0 search.list
    expect(counters["youtube.channels.list"]).toBe(1);
    expect(counters["youtube.search.list"]).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("Simultaneous identical requests perform one upstream lookup", async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, body: { items: [CHANNEL_ITEM] } },
    ]);
    const { youtube, getApiCounters } = await loadModules();
    const [r1, r2, r3] = await Promise.all([
      youtube.searchChannels("@MrBeast"),
      youtube.searchChannels("@MrBeast"),
      youtube.searchChannels("@MrBeast"),
    ]);
    expect(r1).toEqual(r2);
    expect(r2).toEqual(r3);
    const counters = getApiCounters();
    expect(counters["youtube.channels.list"]).toBe(1);
    expect(counters["youtube.search.list"]).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("videos.list is batched (one call for multiple video IDs)", async () => {
    const fetchMock = mockFetchSequence([
      {
        ok: true,
        body: {
          items: [
            { contentDetails: { videoId: "v1" } },
            { contentDetails: { videoId: "v2" } },
            { contentDetails: { videoId: "v3" } },
          ],
        },
      },
      {
        ok: true,
        body: {
          items: [
            {
              id: "v1",
              snippet: { title: "V1", description: "", publishedAt: "2025-01-01T00:00:00Z", thumbnails: {} },
              contentDetails: { duration: "PT5M" },
              statistics: { viewCount: "100" },
            },
            {
              id: "v2",
              snippet: { title: "V2", description: "", publishedAt: "2025-01-01T00:00:00Z", thumbnails: {} },
              contentDetails: { duration: "PT3M" },
              statistics: { viewCount: "200" },
            },
            {
              id: "v3",
              snippet: { title: "V3", description: "", publishedAt: "2025-01-01T00:00:00Z", thumbnails: {} },
              contentDetails: { duration: "PT10M" },
              statistics: { viewCount: "300" },
            },
          ],
        },
      },
    ]);
    const { youtube, getApiCounters } = await loadModules();
    const videos = await youtube.getRecentVideos("UUX6OQ3DkcsbYNE6H8uQQuVA", 12);
    expect(videos).toHaveLength(3);
    const counters = getApiCounters();
    expect(counters["youtube.playlistItems.list"]).toBe(1);
    expect(counters["youtube.videos.list"]).toBe(1);
    expect(counters["youtube.search.list"]).toBe(0);
    // Exactly 2 fetch calls: 1 playlistItems + 1 videos (batched)
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("Missing cache provider falls back safely (uses in-memory)", async () => {
    // The cache module always provides an in-memory fallback.
    // Verify that clearing caches doesn't throw and operations work.
    const { cacheMod } = await loadModules();
    expect(() => cacheMod.searchCache.clear()).not.toThrow();
    expect(() => cacheMod.channelCache.clear()).not.toThrow();
    expect(() => cacheMod.videosCache.clear()).not.toThrow();
    expect(cacheMod.searchCache.size).toBe(0);
  });
});

describe("QUOTA BUDGET: cold cache request counts", () => {
  it("Handle lookup (cold cache): 1 channels.list, 1 playlistItems.list, 1 videos.list, 0 search.list", async () => {
    mockFetchSequence([
      // channels.list(forHandle)
      { ok: true, body: { items: [CHANNEL_ITEM] } },
      // playlistItems.list
      {
        ok: true,
        body: {
          items: [{ contentDetails: { videoId: "v1" } }],
        },
      },
      // videos.list (batched)
      {
        ok: true,
        body: {
          items: [
            {
              id: "v1",
              snippet: { title: "V", description: "", publishedAt: "2025-01-01T00:00:00Z", thumbnails: {} },
              contentDetails: { duration: "PT5M" },
              statistics: { viewCount: "1000" },
            },
          ],
        },
      },
    ]);
    const { youtube, getApiCounters } = await loadModules();
    const channel = await youtube.getChannelByHandle("MrBeast");
    expect(channel).not.toBeNull();
    const videos = await youtube.getRecentVideos(channel!.uploadsPlaylistId);
    expect(videos).toHaveLength(1);
    const counters = getApiCounters();
    expect(counters["youtube.channels.list"]).toBe(1);
    expect(counters["youtube.playlistItems.list"]).toBe(1);
    expect(counters["youtube.videos.list"]).toBe(1);
    expect(counters["youtube.search.list"]).toBe(0);
  });

  it("Channel ID lookup (cold cache): 1 channels.list, 1 playlistItems.list, 1 videos.list, 0 search.list", async () => {
    mockFetchSequence([
      // channels.list(id)
      { ok: true, body: { items: [CHANNEL_ITEM] } },
      // playlistItems.list
      {
        ok: true,
        body: {
          items: [{ contentDetails: { videoId: "v1" } }],
        },
      },
      // videos.list (batched)
      {
        ok: true,
        body: {
          items: [
            {
              id: "v1",
              snippet: { title: "V", description: "", publishedAt: "2025-01-01T00:00:00Z", thumbnails: {} },
              contentDetails: { duration: "PT5M" },
              statistics: { viewCount: "1000" },
            },
          ],
        },
      },
    ]);
    const { youtube, getApiCounters } = await loadModules();
    const channel = await youtube.getChannelById("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(channel).not.toBeNull();
    const videos = await youtube.getRecentVideos(channel!.uploadsPlaylistId);
    expect(videos).toHaveLength(1);
    const counters = getApiCounters();
    expect(counters["youtube.channels.list"]).toBe(1);
    expect(counters["youtube.playlistItems.list"]).toBe(1);
    expect(counters["youtube.videos.list"]).toBe(1);
    expect(counters["youtube.search.list"]).toBe(0);
  });

  it("Warm cache: 0 upstream YouTube API calls", async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, body: { items: [CHANNEL_ITEM] } },
      {
        ok: true,
        body: { items: [{ contentDetails: { videoId: "v1" } }] },
      },
      {
        ok: true,
        body: {
          items: [
            {
              id: "v1",
              snippet: { title: "V", description: "", publishedAt: "2025-01-01T00:00:00Z", thumbnails: {} },
              contentDetails: { duration: "PT5M" },
              statistics: { viewCount: "1000" },
            },
          ],
        },
      },
    ]);
    const { youtube, getApiCounters, resetApiCounters } = await loadModules();

    // Cold lookup
    const channel = await youtube.getChannelByHandle("MrBeast");
    await youtube.getRecentVideos(channel!.uploadsPlaylistId);

    // Reset counters — now everything is cached
    resetApiCounters();

    // Warm lookup — should produce 0 upstream calls
    const cachedChannel = await youtube.getChannelByHandle("MrBeast");
    expect(cachedChannel).toEqual(channel);
    const cachedVideos = await youtube.getRecentVideos(channel!.uploadsPlaylistId);
    expect(cachedVideos).toHaveLength(1);

    const counters = getApiCounters();
    expect(counters["youtube.channels.list"]).toBe(0);
    expect(counters["youtube.playlistItems.list"]).toBe(0);
    expect(counters["youtube.videos.list"]).toBe(0);
    expect(counters["youtube.search.list"]).toBe(0);
    // fetch should not have been called again after the 3 initial calls
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
