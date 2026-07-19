import { describe, expect, it } from "vitest";

import type { CreatorProfile } from "../creatorProfile";
import { buildCreatorFaq } from "../creatorFaq";
import { getCreatorBySlug } from "../creators";

/**
 * Fabricate a profile record for the FAQ builder. Only the subset of
 * fields used by `buildCreatorFaq()` needs to be real — the rest can
 * be typed loosely with a cast.
 */
function makeProfile(overrides: {
  monthlyExpected: number;
  yearlyExpected: number;
  subs: number | null;
  hiddenSubs: boolean;
  videoCount: number;
  sponsorshipExpected: number;
  monthlyViews: number;
}): CreatorProfile {
  const creator = getCreatorBySlug("mrbeast")!;
  return {
    creator,
    channel: {
      channelId: "UC1",
      title: creator.displayName,
      handle: creator.youtubeHandle,
      description: "",
      thumbnail: "",
      bannerUrl: null,
      subscriberCount: overrides.subs,
      hiddenSubscriberCount: overrides.hiddenSubs,
      viewCount: 0,
      videoCount: overrides.videoCount,
      publishedAt: "2020-01-01T00:00:00Z",
      country: "US",
      uploadsPlaylistId: "UU1",
      channelUrl: "https://youtube.com/@x",
      customUrl: "@x",
    },
    videos: [],
    topVideos: [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analysis: {} as any,
    earnings: {
      monthlyViews: overrides.monthlyViews,
      currency: "USD",
      rpmExpected: 5,
      cpmExpected: 9,
      shortsRpmExpected: 0.08,
      earnings: {
        currency: "USD",
        low: {
          daily: 0,
          weekly: 0,
          monthly: overrides.monthlyExpected * 0.6,
          annual: overrides.yearlyExpected * 0.6,
        },
        expected: {
          daily: 0,
          weekly: 0,
          monthly: overrides.monthlyExpected,
          annual: overrides.yearlyExpected,
        },
        high: {
          daily: 0,
          weekly: 0,
          monthly: overrides.monthlyExpected * 1.5,
          annual: overrides.yearlyExpected * 1.5,
        },
        monthlyAdRevenue: {
          daily: 0,
          weekly: 0,
          monthly: overrides.monthlyExpected,
          annual: overrides.yearlyExpected,
        },
        extras: { sponsorship: 0, affiliate: 0, membership: 0 },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shortsEarnings: {} as any,
      sponsorshipPerVideo: {
        low: overrides.sponsorshipExpected * 0.6,
        expected: overrides.sponsorshipExpected,
        high: overrides.sponsorshipExpected * 1.6,
      },
      monthlyViewsIsEstimate: true,
    },
    fallbackReason: null,
  };
}

describe("buildCreatorFaq", () => {
  it("always emits the top-level 'How much does X make?' question", () => {
    const profile = makeProfile({
      monthlyExpected: 1_000_000,
      yearlyExpected: 12_000_000,
      subs: 200_000_000,
      hiddenSubs: false,
      videoCount: 800,
      sponsorshipExpected: 250_000,
      monthlyViews: 300_000_000,
    });
    const faq = buildCreatorFaq(profile);
    const first = faq[0];
    expect(first.question).toContain("How much does MrBeast make");
    expect(first.answer.length).toBeGreaterThan(0);
  });

  it("emits a data-availability answer when monthly earnings are zero", () => {
    const profile = makeProfile({
      monthlyExpected: 0,
      yearlyExpected: 0,
      subs: null,
      hiddenSubs: true,
      videoCount: 0,
      sponsorshipExpected: 0,
      monthlyViews: 0,
    });
    const faq = buildCreatorFaq(profile);
    // Only the always-emitted question remains — every other
    // question requires a concrete number to answer honestly.
    expect(faq).toHaveLength(1);
    expect(faq[0].answer).toContain("could not compute");
  });

  it("omits the subscribers question when the count is hidden", () => {
    const profile = makeProfile({
      monthlyExpected: 1_000,
      yearlyExpected: 12_000,
      subs: null,
      hiddenSubs: true,
      videoCount: 100,
      sponsorshipExpected: 100,
      monthlyViews: 10_000,
    });
    const faq = buildCreatorFaq(profile);
    expect(
      faq.find((e) => e.question.includes("How many subscribers")),
    ).toBeUndefined();
  });

  it("emits net-worth caveat when yearly earnings are known", () => {
    const profile = makeProfile({
      monthlyExpected: 1_000_000,
      yearlyExpected: 12_000_000,
      subs: 200_000_000,
      hiddenSubs: false,
      videoCount: 800,
      sponsorshipExpected: 250_000,
      monthlyViews: 300_000_000,
    });
    const faq = buildCreatorFaq(profile);
    const worth = faq.find((e) => e.question.includes("worth"));
    expect(worth).toBeDefined();
    expect(worth?.answer).toMatch(/YouTube-only annual earnings/);
    expect(worth?.answer).toMatch(/not include sponsorship/i);
  });
});
