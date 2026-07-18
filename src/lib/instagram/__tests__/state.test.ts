import { describe, expect, it } from "vitest";

import {
  buildInstagramShareUrl,
  decodeInstagramState,
  encodeInstagramState,
  hydrateInstagramState,
  INSTAGRAM_DEFAULT_STATE,
  INSTAGRAM_PARAM_KEYS,
} from "../state";

describe("Instagram calculator state ⇄ URL", () => {
  it("encodes only the values that differ from defaults", () => {
    const params = encodeInstagramState({
      ...INSTAGRAM_DEFAULT_STATE,
      followers: 500_000,
      engagementRate: 6,
    });
    expect(params.get(INSTAGRAM_PARAM_KEYS.followers)).toBe("500000");
    expect(params.get(INSTAGRAM_PARAM_KEYS.engagementRate)).toBe("6");
    // niche is at default → not encoded
    expect(params.get(INSTAGRAM_PARAM_KEYS.niche)).toBeNull();
  });

  it("round-trips a full state through encode/decode", () => {
    const source = {
      ...INSTAGRAM_DEFAULT_STATE,
      followers: 250_000,
      avgPostReach: 30_000,
      avgReelViews: 80_000,
      avgStoryViews: 8_000,
      engagementRate: 4.2,
      country: "IN",
      niche: "finance",
      currency: "INR",
      enableSubscriptions: true,
      paidSubscribers: 300,
      subscriptionPriceUsd: 4.99,
    };
    const params = encodeInstagramState(source);
    const decoded = decodeInstagramState(params);
    const hydrated = hydrateInstagramState(decoded);
    expect(hydrated.followers).toBe(source.followers);
    expect(hydrated.country).toBe("IN");
    expect(hydrated.niche).toBe("finance");
    expect(hydrated.currency).toBe("INR");
    expect(hydrated.engagementRate).toBe(4.2);
    expect(hydrated.enableSubscriptions).toBe(true);
    expect(hydrated.paidSubscribers).toBe(300);
  });

  it("ignores invalid query parameters safely", () => {
    const params = new URLSearchParams();
    params.set("followers", "not-a-number");
    params.set("country", "ZZ-invalid");
    params.set("niche", "hacked");
    params.set("engagement", "-99");
    params.set("currency", "ABC");
    const decoded = decodeInstagramState(params);
    // Every invalid key gets dropped — the caller layers defaults.
    expect(decoded.followers).toBeUndefined();
    expect(decoded.country).toBeUndefined();
    expect(decoded.niche).toBeUndefined();
    expect(decoded.engagementRate).toBeUndefined();
    expect(decoded.currency).toBeUndefined();
  });

  it("hydrates a partial state with defaults", () => {
    const hydrated = hydrateInstagramState({ followers: 12_345 });
    expect(hydrated.followers).toBe(12_345);
    expect(hydrated.currency).toBe(INSTAGRAM_DEFAULT_STATE.currency);
    expect(hydrated.niche).toBe(INSTAGRAM_DEFAULT_STATE.niche);
  });

  it("decodes plain records (Next.js searchParams shape)", () => {
    const decoded = decodeInstagramState({
      followers: "1000000",
      engagement: "6.5",
      currency: "EUR",
    });
    expect(decoded.followers).toBe(1_000_000);
    expect(decoded.engagementRate).toBe(6.5);
    expect(decoded.currency).toBe("EUR");
  });

  it("boolean flags round-trip as 0/1", () => {
    const params = encodeInstagramState({
      ...INSTAGRAM_DEFAULT_STATE,
      enableAffiliate: false,
      enableSubscriptions: true,
    });
    // affiliate is on by default → OFF is encoded
    expect(params.get(INSTAGRAM_PARAM_KEYS.enableAffiliate)).toBe("0");
    // subscriptions is off by default → ON is encoded
    expect(params.get(INSTAGRAM_PARAM_KEYS.enableSubscriptions)).toBe("1");

    const decoded = decodeInstagramState(params);
    expect(decoded.enableAffiliate).toBe(false);
    expect(decoded.enableSubscriptions).toBe(true);
  });

  it("buildInstagramShareUrl adds query when state is non-default", () => {
    const url = buildInstagramShareUrl(
      "https://example.com",
      "/en/instagram-money-calculator",
      { ...INSTAGRAM_DEFAULT_STATE, followers: 500_000 },
    );
    expect(url).toBe(
      "https://example.com/en/instagram-money-calculator?followers=500000",
    );
  });

  it("buildInstagramShareUrl omits query when everything is default", () => {
    const url = buildInstagramShareUrl(
      "https://example.com",
      "/en/instagram-money-calculator",
      INSTAGRAM_DEFAULT_STATE,
    );
    expect(url).toBe("https://example.com/en/instagram-money-calculator");
  });
});
