import { beforeEach, describe, expect, it, vi } from "vitest";

import { YouTubeApiError } from "../errors";

// Mock the YouTube service. Every test can override the mock return
// values inline via `vi.mocked(...).mockResolvedValueOnce(...)`.
vi.mock("../youtube", () => ({
  getChannelById: vi.fn(),
  getChannelByHandle: vi.fn(),
  getRecentVideos: vi.fn(),
  searchChannels: vi.fn(),
}));

// Import after the mock so the module gets the mocked youtube.
import { getCreatorProfile } from "../creatorProfile";
import { getCreatorBySlug } from "../creators";
import * as youtube from "../youtube";

function makeChannelFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    channelId: "UCTEST123",
    title: "Test Channel",
    handle: "@test",
    description: "",
    thumbnail: "",
    bannerUrl: null,
    subscriberCount: 1_000_000,
    hiddenSubscriberCount: false,
    viewCount: 1_000_000_000,
    videoCount: 500,
    publishedAt: "2020-01-01T00:00:00Z",
    country: "US",
    uploadsPlaylistId: "UUTEST123",
    channelUrl: "https://www.youtube.com/@test",
    customUrl: "@test",
    ...overrides,
  };
}

describe("getCreatorProfile — happy path", () => {
  beforeEach(() => {
    vi.mocked(youtube.getChannelById).mockReset();
    vi.mocked(youtube.getChannelByHandle).mockReset();
    vi.mocked(youtube.getRecentVideos).mockReset();
    vi.mocked(youtube.searchChannels).mockReset();
  });

  it("computes an earnings snapshot from live channel data", async () => {
    // MrBeast now has a channelId set, so it uses getChannelById directly
    vi.mocked(youtube.getChannelById).mockResolvedValueOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeChannelFixture() as any,
    );
    vi.mocked(youtube.getRecentVideos).mockResolvedValueOnce([]);

    const creator = getCreatorBySlug("mrbeast")!;
    const profile = await getCreatorProfile(creator);

    expect(profile.fallbackReason).toBeNull();
    expect(profile.channel.title).toBe("Test Channel");
    // Earnings snapshot should exist regardless of video sample.
    expect(profile.earnings.rpmExpected).toBeGreaterThan(0);
    expect(profile.earnings.cpmExpected).toBeGreaterThan(
      profile.earnings.rpmExpected,
    );
    // Monthly views inferred from viewCount / months since publish
    expect(profile.earnings.monthlyViews).toBeGreaterThan(0);
    expect(profile.earnings.earnings.expected.monthly).toBeGreaterThan(0);
    // search.list is NEVER called
    expect(youtube.searchChannels).not.toHaveBeenCalled();
  });

  it("uses channelId directly when provided (skips search and handle lookup)", async () => {
    const creator = {
      slug: "test",
      displayName: "Test",
      youtubeHandle: "@test",
      channelId: "UCTESTDIRECT",
      country: "USA",
      countryCode: "US" as const,
      category: "Gaming",
      nicheId: "gaming" as const,
      description: "",
      relatedCreators: [],
    };
    vi.mocked(youtube.getChannelById).mockResolvedValueOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeChannelFixture({ channelId: "UCTESTDIRECT" }) as any,
    );
    vi.mocked(youtube.getRecentVideos).mockResolvedValueOnce([]);

    const profile = await getCreatorProfile(creator);
    expect(youtube.searchChannels).not.toHaveBeenCalled();
    expect(youtube.getChannelByHandle).not.toHaveBeenCalled();
    expect(profile.channel.channelId).toBe("UCTESTDIRECT");
  });

  it("returns not-verified fallback when channelId is empty (no API call)", async () => {
    const creator = {
      slug: "test",
      displayName: "Test",
      youtubeHandle: "@TestHandle",
      channelId: "",
      country: "USA",
      countryCode: "US" as const,
      category: "Gaming",
      nicheId: "gaming" as const,
      description: "",
      relatedCreators: [],
    };

    const profile = await getCreatorProfile(creator);
    // No YouTube API methods should be called for unverified creators
    expect(youtube.searchChannels).not.toHaveBeenCalled();
    expect(youtube.getChannelByHandle).not.toHaveBeenCalled();
    expect(youtube.getChannelById).not.toHaveBeenCalled();
    expect(youtube.getRecentVideos).not.toHaveBeenCalled();
    // Should render static profile with not-verified fallback
    expect(profile.fallbackReason).toBe("not-verified");
    expect(profile.channel.title).toBe("Test");
    expect(profile.videos).toEqual([]);
  });
});

describe("getCreatorProfile — graceful fallback", () => {
  beforeEach(() => {
    vi.mocked(youtube.getChannelById).mockReset();
    vi.mocked(youtube.getChannelByHandle).mockReset();
    vi.mocked(youtube.getRecentVideos).mockReset();
    vi.mocked(youtube.searchChannels).mockReset();
  });

  it("falls back to placeholder data when the quota is exceeded", async () => {
    vi.mocked(youtube.getChannelById).mockRejectedValueOnce(
      new YouTubeApiError(429, "QUOTA_EXCEEDED", "quota exceeded"),
    );

    const creator = getCreatorBySlug("mrbeast")!;
    const profile = await getCreatorProfile(creator);

    expect(profile.fallbackReason).toBe("quota-exceeded");
    // Placeholder channel is derived from the creator record, not
    // fabricated live numbers.
    expect(profile.channel.title).toBe(creator.displayName);
    expect(profile.channel.subscriberCount).toBeNull();
    expect(profile.channel.hiddenSubscriberCount).toBe(true);
    // Earnings snapshot still renders — with zeros where we don't
    // have data — never throws.
    expect(profile.earnings.monthlyViews).toBe(0);
    expect(profile.earnings.earnings.expected.monthly).toBe(0);
  });

  it("maps MISSING_API_KEY to 'not-configured' fallback", async () => {
    vi.mocked(youtube.getChannelById).mockRejectedValueOnce(
      new YouTubeApiError(500, "MISSING_API_KEY", "not configured"),
    );
    const creator = getCreatorBySlug("mrbeast")!;
    const profile = await getCreatorProfile(creator);
    expect(profile.fallbackReason).toBe("not-configured");
  });

  it("maps UPSTREAM_UNAVAILABLE to 'upstream-unavailable'", async () => {
    vi.mocked(youtube.getChannelById).mockRejectedValueOnce(
      new YouTubeApiError(502, "UPSTREAM_UNAVAILABLE", "down"),
    );
    const profile = await getCreatorProfile(getCreatorBySlug("mrbeast")!);
    expect(profile.fallbackReason).toBe("upstream-unavailable");
  });

  it("maps a resolved-but-null channel to 'not-found'", async () => {
    vi.mocked(youtube.getChannelById).mockResolvedValueOnce(null);
    const profile = await getCreatorProfile(getCreatorBySlug("mrbeast")!);
    expect(profile.fallbackReason).toBe("not-found");
  });

  it("swallows a video-fetch error without crashing", async () => {
    vi.mocked(youtube.getChannelById).mockResolvedValueOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeChannelFixture() as any,
    );
    vi.mocked(youtube.getRecentVideos).mockRejectedValueOnce(
      new YouTubeApiError(429, "QUOTA_EXCEEDED", "quota"),
    );

    const profile = await getCreatorProfile(getCreatorBySlug("mrbeast")!);
    // Channel fetch succeeded, so fallbackReason stays null even
    // though the video fetch failed. The videos array is empty.
    expect(profile.fallbackReason).toBeNull();
    expect(profile.videos).toEqual([]);
  });

  it("sorts topVideos by view count descending", async () => {
    vi.mocked(youtube.getChannelById).mockResolvedValueOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeChannelFixture() as any,
    );
    vi.mocked(youtube.getRecentVideos).mockResolvedValueOnce([
      { videoId: "a", viewCount: 100, publishedAt: "2026-01-01T00:00:00Z" },
      { videoId: "b", viewCount: 900, publishedAt: "2026-02-01T00:00:00Z" },
      { videoId: "c", viewCount: 500, publishedAt: "2026-03-01T00:00:00Z" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const profile = await getCreatorProfile(getCreatorBySlug("mrbeast")!);
    expect(profile.topVideos.map((v) => v.videoId)).toEqual(["b", "c", "a"]);
  });
});
