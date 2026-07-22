import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the YouTube service so no real API calls are ever issued.
vi.mock("../youtube", () => ({
  getChannelById: vi.fn(),
  getChannelByHandle: vi.fn(),
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

describe("resolveCreatorAvatar", () => {
  beforeEach(() => {
    vi.mocked(youtube.getChannelById).mockReset();
    vi.mocked(youtube.getChannelByHandle).mockReset();
    vi.mocked(youtube.searchChannels).mockReset();
  });

  it("uses getChannelById directly when channelId is set (never calls search)", async () => {
    vi.mocked(youtube.getChannelById).mockResolvedValueOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      CHANNEL_STUB as any,
    );
    const url = await resolveCreatorAvatar(
      makeCreator({ channelId: "UCTEST1" }),
    );
    expect(url).toBe("https://yt3.ggpht.com/example-high.jpg");
    expect(youtube.searchChannels).not.toHaveBeenCalled();
    expect(youtube.getChannelByHandle).not.toHaveBeenCalled();
    expect(youtube.getChannelById).toHaveBeenCalledTimes(1);
    expect(youtube.getChannelById).toHaveBeenCalledWith("UCTEST1");
  });

  it("returns null immediately when channelId is empty (no API call)", async () => {
    const url = await resolveCreatorAvatar(makeCreator());
    expect(url).toBeNull();
    expect(youtube.searchChannels).not.toHaveBeenCalled();
    expect(youtube.getChannelByHandle).not.toHaveBeenCalled();
    expect(youtube.getChannelById).not.toHaveBeenCalled();
  });

  it("returns null for unverified creator (never throws)", async () => {
    // Even if some mock were to throw, the function should not reach it
    expect(await resolveCreatorAvatar(makeCreator())).toBeNull();
    expect(youtube.getChannelByHandle).not.toHaveBeenCalled();
  });

  it("returns null when getChannelById returns empty thumbnail", async () => {
    vi.mocked(youtube.getChannelById).mockResolvedValueOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { ...CHANNEL_STUB, thumbnail: "" } as any,
    );
    expect(await resolveCreatorAvatar(makeCreator({ channelId: "UCTEST1" }))).toBeNull();
  });
});

describe("getCreatorAvatars", () => {
  beforeEach(() => {
    vi.mocked(youtube.getChannelById).mockReset();
    vi.mocked(youtube.getChannelByHandle).mockReset();
    vi.mocked(youtube.searchChannels).mockReset();
  });

  it("returns an entry for every creator, even when some fail", async () => {
    // Creator with channelId resolves, creator without channelId returns null
    vi.mocked(youtube.getChannelById).mockImplementation(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { ...CHANNEL_STUB, thumbnail: "https://yt3.ggpht.com/alpha.jpg" } as any;
    });

    const creators = [
      makeCreator({ slug: "alpha", channelId: "UCALPHA1234567890123456" }),
      makeCreator({ slug: "beta", channelId: "" }), // unverified — returns null
    ];
    const map = await getCreatorAvatars(creators);

    expect(map).toEqual({
      alpha: "https://yt3.ggpht.com/alpha.jpg",
      beta: null,
    });
  });

  it("dispatches requests in parallel", async () => {
    // Set up slow-resolving fixtures. If the helper serialized
    // requests, total wall time would be ~= 4 * delay.
    const delay = 40;
    vi.mocked(youtube.getChannelById).mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, delay));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return CHANNEL_STUB as any;
    });

    const creators = [
      makeCreator({ slug: "a", channelId: "UCA1234567890123456789a" }),
      makeCreator({ slug: "b", channelId: "UCB1234567890123456789b" }),
      makeCreator({ slug: "c", channelId: "UCC1234567890123456789c" }),
      makeCreator({ slug: "d", channelId: "UCD1234567890123456789d" }),
    ];

    const start = Date.now();
    const map = await getCreatorAvatars(creators);
    const elapsed = Date.now() - start;

    expect(Object.keys(map)).toEqual(["a", "b", "c", "d"]);
    // Parallel: elapsed should be closer to `delay` than to `4 * delay`.
    expect(elapsed).toBeLessThan(delay * 3);
  });

  it("returns an empty map for an empty input", async () => {
    const map = await getCreatorAvatars([]);
    expect(map).toEqual({});
    expect(youtube.searchChannels).not.toHaveBeenCalled();
    expect(youtube.getChannelById).not.toHaveBeenCalled();
    expect(youtube.getChannelByHandle).not.toHaveBeenCalled();
  });

  it("creator avatar resolution NEVER calls search.list or getChannelByHandle", async () => {
    vi.mocked(youtube.getChannelById).mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      CHANNEL_STUB as any,
    );

    const creators = [
      makeCreator({ slug: "a", channelId: "UC1234567890123456789012" }),
      makeCreator({ slug: "b" }), // unverified — no API call
    ];
    await getCreatorAvatars(creators);

    expect(youtube.searchChannels).not.toHaveBeenCalled();
    expect(youtube.getChannelByHandle).not.toHaveBeenCalled();
    // Only getChannelById should have been called (for creator "a")
    expect(youtube.getChannelById).toHaveBeenCalledTimes(1);
  });
});
