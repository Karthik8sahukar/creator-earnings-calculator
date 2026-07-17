import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for /channel/[channelId] server component + generateMetadata.
 *
 * The heavy JSX rendering of ProfileCard / PerformanceCard / VideosGrid
 * is exercised in E2E — here we lock the contract that matters for
 * production:
 *
 *   - Invalid channel ids never leak into the app: `notFound()` fires.
 *   - Metadata does not claim earnings are official / endorsed.
 *   - Metadata omits secrets even when a valid channel is present.
 *   - A missing videos payload never blanks the page.
 */

import { YouTubeApiError } from "@/lib/errors";

const getChannelById = vi.fn();
const getRecentVideos = vi.fn();

vi.mock("@/lib/youtube", () => ({
  YouTubeApiError,
  getChannelById: (...args: unknown[]) => getChannelById(...args),
  getRecentVideos: (...args: unknown[]) => getRecentVideos(...args),
  searchChannels: vi.fn(),
}));

// Capture calls to `notFound()` — Next throws a special error at
// runtime; in the test we throw a sentinel we can assert on.
class NotFoundSentinel extends Error {
  constructor() {
    super("NEXT_NOT_FOUND");
    this.name = "NotFoundSentinel";
  }
}
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFoundSentinel();
  },
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const VALID_ID = "UCXXXXXXXXXXXXXXXXXXXXXX";

const validChannel = {
  channelId: VALID_ID,
  title: "Independent Creators",
  handle: "@indie",
  description: "A public YouTube channel.",
  thumbnail: "https://yt3.googleusercontent.com/example.jpg",
  bannerUrl: null,
  subscriberCount: 12345,
  hiddenSubscriberCount: false,
  viewCount: 6789012,
  videoCount: 200,
  publishedAt: "2018-01-01T00:00:00Z",
  country: "US",
  uploadsPlaylistId: "UUXXXXXXXXXXXXXXXXXXXXXX",
  channelUrl: `https://www.youtube.com/channel/${VALID_ID}`,
  customUrl: "@indie",
};

/**
 * Import the page module fresh with a controlled environment so
 * `publicConfig.siteUrl` reflects the test config.
 */
async function loadPage() {
  vi.resetModules();
  return import("../page");
}

/**
 * Recursively walk a React element tree looking for a prop key that
 * matches a predicate. Handles circular references introduced by
 * React internals.
 */
function findProp(
  node: unknown,
  test: (props: Record<string, unknown>) => boolean,
  seen = new WeakSet(),
): Record<string, unknown> | undefined {
  if (!node || typeof node !== "object") return undefined;
  if (seen.has(node as object)) return undefined;
  seen.add(node as object);

  const element = node as {
    props?: Record<string, unknown>;
    children?: unknown;
  };

  if (element.props && test(element.props)) return element.props;
  if (element.props) {
    const children = element.props.children;
    const list = Array.isArray(children) ? children : [children];
    for (const child of list) {
      const hit = findProp(child, test, seen);
      if (hit) return hit;
    }
    // Also walk any non-children prop that itself is an element.
    for (const [k, v] of Object.entries(element.props)) {
      if (k === "children") continue;
      const hit = findProp(v, test, seen);
      if (hit) return hit;
    }
  }
  return undefined;
}

beforeEach(() => {
  process.env.YOUTUBE_API_KEY = "test-key";
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
  // Note: NEXT_PUBLIC_SITE_NAME is intentionally NOT set — the brand
  // is a hardcoded constant in src/lib/config.ts, immune to env drift.
  getChannelById.mockReset();
  getRecentVideos.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateMetadata", () => {
  it("returns dynamic metadata for a valid channel", async () => {
    getChannelById.mockResolvedValueOnce(validChannel);
    const { generateMetadata } = await loadPage();

    const meta = await generateMetadata({
      params: Promise.resolve({ channelId: VALID_ID }),
    });

    expect(meta.title).toContain("Independent Creators");
    expect(meta.title).toContain("YouTube Money Calculator");
    expect(meta.description).toContain("Independent Creators");
    // Must not claim official / endorsed.
    expect(String(meta.description)).not.toMatch(/official/i);
    expect(String(meta.description)).not.toMatch(/endorse/i);
    expect(String(meta.description)).not.toMatch(/verified/i);
    expect(meta.alternates?.canonical).toBe(`/channel/${VALID_ID}`);

    const og = meta.openGraph as Record<string, unknown>;
    expect(og.url).toBe(`https://example.test/channel/${VALID_ID}`);
    expect(og.title).toContain("Independent Creators");
    const twitter = meta.twitter as Record<string, unknown>;
    expect(twitter.card).toBe("summary_large_image");
  });

  it("returns safe generic metadata for an invalid channel id (no upstream call)", async () => {
    const { generateMetadata } = await loadPage();
    const meta = await generateMetadata({
      params: Promise.resolve({ channelId: "not-a-channel-id" }),
    });
    expect(getChannelById).not.toHaveBeenCalled();
    expect(meta.title).toBe("Channel not found");
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.alternates?.canonical).toBe("/");
  });

  it("returns safe generic metadata when the channel does not exist", async () => {
    getChannelById.mockResolvedValueOnce(null);
    const { generateMetadata } = await loadPage();
    const meta = await generateMetadata({
      params: Promise.resolve({ channelId: VALID_ID }),
    });
    expect(meta.title).toBe("Channel not found");
    expect(meta.robots).toEqual({ index: false, follow: true });
  });

  it("returns safe generic metadata when the upstream throws", async () => {
    getChannelById.mockRejectedValueOnce(
      new YouTubeApiError(429, "QUOTA_EXCEEDED", "quota"),
    );
    const { generateMetadata } = await loadPage();
    const meta = await generateMetadata({
      params: Promise.resolve({ channelId: VALID_ID }),
    });
    expect(meta.title).toBe("Channel not found");
  });

  it("does not include the API key in generated metadata", async () => {
    getChannelById.mockResolvedValueOnce(validChannel);
    const { generateMetadata } = await loadPage();
    const meta = await generateMetadata({
      params: Promise.resolve({ channelId: VALID_ID }),
    });
    // Manually walk metadata — it can contain nested URL/OG structures
    // but never a `test-key`.
    const walk = (obj: unknown): boolean => {
      if (typeof obj === "string") return obj.includes("test-key");
      if (Array.isArray(obj)) return obj.some(walk);
      if (obj && typeof obj === "object") {
        return Object.values(obj as Record<string, unknown>).some(walk);
      }
      return false;
    };
    expect(walk(meta)).toBe(false);
  });
});

describe("ChannelPage server component", () => {
  it("calls notFound() when the channel id is malformed", async () => {
    const { default: ChannelPage } = await loadPage();
    await expect(
      ChannelPage({
        params: Promise.resolve({ channelId: "bad-id" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toBeInstanceOf(NotFoundSentinel);
    expect(getChannelById).not.toHaveBeenCalled();
  });

  it("calls notFound() when the channel does not exist", async () => {
    getChannelById.mockResolvedValueOnce(null);
    const { default: ChannelPage } = await loadPage();
    await expect(
      ChannelPage({
        params: Promise.resolve({ channelId: VALID_ID }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toBeInstanceOf(NotFoundSentinel);
  });

  it("calls notFound() when the upstream reports NOT_FOUND", async () => {
    getChannelById.mockRejectedValueOnce(
      new YouTubeApiError(404, "NOT_FOUND", "Channel is gone."),
    );
    const { default: ChannelPage } = await loadPage();
    await expect(
      ChannelPage({
        params: Promise.resolve({ channelId: VALID_ID }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toBeInstanceOf(NotFoundSentinel);
  });

  it("re-throws other upstream errors so the segment error boundary catches them", async () => {
    getChannelById.mockRejectedValueOnce(
      new YouTubeApiError(429, "QUOTA_EXCEEDED", "quota"),
    );
    const { default: ChannelPage } = await loadPage();
    await expect(
      ChannelPage({
        params: Promise.resolve({ channelId: VALID_ID }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toBeInstanceOf(YouTubeApiError);
  });

  it("renders even when the videos endpoint fails", async () => {
    getChannelById.mockResolvedValueOnce(validChannel);
    getRecentVideos.mockRejectedValueOnce(
      new YouTubeApiError(502, "UPSTREAM_UNAVAILABLE", "down"),
    );
    // Suppress the server-side console.error the page emits on video failure.
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { default: ChannelPage } = await loadPage();
    const tree = await ChannelPage({
      params: Promise.resolve({ channelId: VALID_ID }),
      searchParams: Promise.resolve({}),
    });
    expect(tree).toBeTruthy();
    expect(errSpy).toHaveBeenCalled();
  });

  it("passes decoded calculator state from the URL through to the dashboard", async () => {
    getChannelById.mockResolvedValueOnce(validChannel);
    getRecentVideos.mockResolvedValueOnce([]);

    const { default: ChannelPage } = await loadPage();
    const tree = await ChannelPage({
      params: Promise.resolve({ channelId: VALID_ID }),
      searchParams: Promise.resolve({
        mv: "500000",
        c: "US",
        cur: "USD",
      }),
    });

    // Find the ChannelDashboard node's `initialCalculatorState` prop.
    const dashboardProps = findProp(
      tree,
      (p) =>
        typeof p === "object" && "initialCalculatorState" in p,
    );
    expect(dashboardProps).toBeDefined();
    const state = dashboardProps!.initialCalculatorState as Record<
      string,
      unknown
    >;
    expect(state.monthlyViews).toBe(500000);
    expect(state.currency).toBe("USD");
    // The URL-provided cid should NOT override the route param.
    // The dashboard forcibly rewrites channelId on mount, so any value is fine here.
  });
});
