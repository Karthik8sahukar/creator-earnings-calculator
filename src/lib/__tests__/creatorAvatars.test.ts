import { beforeEach, describe, expect, it, vi } from "vitest";

import { YouTubeApiError } from "../errors";

// Mock the YouTube service so no real API calls are ever issued.
vi.mock("../youtube", () => ({
  getChannelById: vi.fn(),
  getRecentVideos: vi.fn(),
  searchChannels: vi.fn(),
}));

// Import after the mock so the helper picks up the mocked service.
import {
  _resolveCreatorAvatarForTests as resolveCreatorAvatar,
  getCreatorAvatars,
} from "../creatorAvatars";
import type { Creator } from "../creators";
import * as youtube from "../youtube";

function makeCreator(overrides: Partial<Creator> = {}): Creator {
  return {
    slug: "test",
    displayName: "Test Creator",
    youtubeHandle: "@testcreator",
    channelId: "",
    country: "USA",
    countryCode: "US",
    category: "Entertainment",
    description: "",
    relatedCreators: [],
    ...overrides,
  };
}

const CHANNEL_STUB = {
  channelId: "UCTEST1",
  title: "Test",
  handle: "@testcreator",
  description: "",
  thumbnail: "https://yt3.ggpht.com/example-high.jpg",
  bannerUrl: null,
  subscriberCount: 1,
  hiddenSubscriberCount: false,
  viewCount: 1,
  videoCount: 1,
  publishedAt: "2020-01-01T00:00:00Z",
  country: "US",
  uploadsPlaylistId: "UU1",
  channelUrl: "https://youtube.com/@testcreator",
  customUrl: "@testcreator",
};

const SEARCH_HIT = {
  channelId: "UCTEST1",
  title: "Test",
  handle: "@testcreator",
  description: "",
  thumbnail: "https://yt3.ggpht.com/example-search.jpg",
  subscriberCount: 1,
  hiddenSubscriberCount: false,
};

describe("resolveCreatorAvatar", () => {
  beforeEach(() => {
    vi.mocked(youtube.getChannelById).mockReset();
    vi.mocked(youtube.searchChannels).mockReset();
  });

  it("uses getChannelById directly when channelId is set (skips search)", async () => {
    vi.mocked(youtube.getChannelById).mockResolvedValueOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      CHANNEL_STUB as any,
    );
    const url = await resolveCreatorAvatar(
      makeCreator({ channelId: "UCTEST1" }),
    );
    expect(url).toBe("https://yt3.ggpht.com/example-high.jpg");
    expect(youtube.searchChannels).not.toHaveBeenCalled();
    expect(youtube.getChannelById).toHaveBeenCalledTimes(1);
    expect(youtube.getChannelById).toHaveBeenCalledWith("UCTEST1");
  });

  it("falls back to searchChannels when channelId is empty", async () => {
    vi.mocked(youtube.searchChannels).mockResolvedValueOnce([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      SEARCH_HIT as any,
    ]);
    const url = await resolveCreatorAvatar(makeCreator());
    expect(url).toBe("https://yt3.ggpht.com/example-search.jpg");
    // Never re-hits getChannelById — the search result already
    // carries the thumbnail we need (saves one API unit + one round
    // trip per creator).
    expect(youtube.getChannelById).not.toHaveBeenCalled();
  });

  it("prefers an exact handle match over the top search result", async () => {
    vi.mocked(youtube.searchChannels).mockResolvedValueOnce([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { ...SEARCH_HIT, handle: "@unrelated", thumbnail: "https://x.test/wrong.jpg" } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { ...SEARCH_HIT, handle: "@testcreator", thumbnail: "https://x.test/correct.jpg" } as any,
    ]);
    const url = await resolveCreatorAvatar(makeCreator());
    expect(url).toBe("https://x.test/correct.jpg");
  });

  it("returns null when search returns no results", async () => {
    vi.mocked(youtube.searchChannels).mockResolvedValueOnce([]);
    expect(await resolveCreatorAvatar(makeCreator())).toBeNull();
  });

  it("returns null (never throws) on any YouTubeApiError", async () => {
    vi.mocked(youtube.searchChannels).mockRejectedValueOnce(
      new YouTubeApiError(429, "QUOTA_EXCEEDED", "quota"),
    );
    expect(await resolveCreatorAvatar(makeCreator())).toBeNull();
  });

  it("returns null when the resolved thumbnail is empty", async () => {
    vi.mocked(youtube.searchChannels).mockResolvedValueOnce([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { ...SEARCH_HIT, thumbnail: "" } as any,
    ]);
    expect(await resolveCreatorAvatar(makeCreator())).toBeNull();
  });
});

describe("getCreatorAvatars", () => {
  beforeEach(() => {
    vi.mocked(youtube.getChannelById).mockReset();
    vi.mocked(youtube.searchChannels).mockReset();
  });

  it("returns an entry for every creator, even when some fail", async () => {
    // Two creators: the first resolves cleanly, the second throws.
    vi.mocked(youtube.searchChannels).mockImplementation(async (q: string) => {
      if (q === "@alpha") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [{ ...SEARCH_HIT, handle: "@alpha", thumbnail: "https://yt3.ggpht.com/alpha.jpg" } as any];
      }
      throw new YouTubeApiError(429, "QUOTA_EXCEEDED", "quota");
    });

    const creators = [
      makeCreator({ slug: "alpha", youtubeHandle: "@alpha" }),
      makeCreator({ slug: "beta", youtubeHandle: "@beta" }),
    ];
    const map = await getCreatorAvatars(creators);

    expect(map).toEqual({
      alpha: "https://yt3.ggpht.com/alpha.jpg",
      beta: null,
    });
  });

  it("dispatches requests in parallel", async () => {
    // Set up two slow-resolving fixtures. If the helper serialized
    // requests, total wall time would be ~= 2 * delay; parallel runs
    // in ~= 1 * delay. We give plenty of slack for the test runner.
    const delay = 40;
    vi.mocked(youtube.searchChannels).mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, delay));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return [SEARCH_HIT as any];
    });

    const creators = [
      makeCreator({ slug: "a" }),
      makeCreator({ slug: "b" }),
      makeCreator({ slug: "c" }),
      makeCreator({ slug: "d" }),
    ];

    const start = Date.now();
    const map = await getCreatorAvatars(creators);
    const elapsed = Date.now() - start;

    expect(Object.keys(map)).toEqual(["a", "b", "c", "d"]);
    // Parallel: elapsed should be closer to `delay` than to
    // `4 * delay`. Assert a generous bound to keep the test stable.
    expect(elapsed).toBeLessThan(delay * 3);
  });

  it("returns an empty map for an empty input", async () => {
    const map = await getCreatorAvatars([]);
    expect(map).toEqual({});
    expect(youtube.searchChannels).not.toHaveBeenCalled();
    expect(youtube.getChannelById).not.toHaveBeenCalled();
  });
});
