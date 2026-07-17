import { describe, expect, it } from "vitest";

import {
  DEFAULT_CALCULATOR_STATE,
  DEFAULT_SCENARIO,
  buildShareUrl,
  decodeCalculatorState,
  encodeCalculatorState,
  hydrateCalculatorState,
  toEarningsInput,
  type CalculatorState,
} from "../calculatorState";

describe("calculator state — encode / decode round trip", () => {
  it("round-trips a full state through encode -> decode -> hydrate", () => {
    const state: CalculatorState = {
      channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
      monthlyViews: 5_000_000,
      country: "GB",
      niche: "tech",
      contentType: "mixed",
      rpmMode: "custom",
      customRpm: 7.5,
      currency: "EUR",
      monetizedPercentage: 85,
      sponsorship: 3000,
      affiliate: 700,
      membership: 400,
      other: 250,
      estimateBand: "high",
    };
    const params = encodeCalculatorState(state);
    const decoded = decodeCalculatorState(params);
    expect(hydrateCalculatorState(decoded)).toEqual(state);
  });

  it("does not emit params that equal defaults", () => {
    const state: CalculatorState = {
      ...DEFAULT_CALCULATOR_STATE,
      monthlyViews: 12345,
    };
    const params = encodeCalculatorState(state);
    expect(params.get("mv")).toBe("12345");
    expect(params.get("c")).toBeNull();
    expect(params.get("cur")).toBeNull();
    expect(params.get("eb")).toBeNull();
  });

  it("emits the estimate band only when it differs from the default", () => {
    const highParams = encodeCalculatorState({
      ...DEFAULT_CALCULATOR_STATE,
      estimateBand: "high",
    });
    expect(highParams.get("eb")).toBe("high");

    const expectedParams = encodeCalculatorState({
      ...DEFAULT_CALCULATOR_STATE,
      estimateBand: DEFAULT_SCENARIO,
    });
    expect(expectedParams.get("eb")).toBeNull();
  });
});

describe("decodeCalculatorState — returns a partial", () => {
  it("returns an empty partial for an empty URLSearchParams", () => {
    const decoded = decodeCalculatorState(new URLSearchParams());
    expect(decoded).toEqual({});
  });

  it("returns only the keys the URL provided", () => {
    const params = new URLSearchParams();
    params.set("mv", "1000");
    params.set("n", "tech");
    const decoded = decodeCalculatorState(params);
    expect(decoded).toEqual({ monthlyViews: 1000, niche: "tech" });
    expect(decoded.country).toBeUndefined();
    expect(decoded.currency).toBeUndefined();
    expect(decoded.estimateBand).toBeUndefined();
  });

  it("ignores unsupported query parameters", () => {
    const params = new URLSearchParams();
    params.set("mv", "1000");
    params.set("evil", "<script>");
    params.set("unrelated", "yes");
    const decoded = decodeCalculatorState(params);
    expect(decoded).toEqual({ monthlyViews: 1000 });
  });

  it("omits invalid values entirely so analysis defaults can win", () => {
    const params = new URLSearchParams();
    params.set("mv", "-500");
    params.set("c", "ZZ");
    params.set("n", "fake-niche");
    params.set("mp", "999");
    params.set("cur", "XYZ");
    params.set("rpm", "abc");
    params.set("eb", "extreme");
    const decoded = decodeCalculatorState(params);
    expect(decoded.monthlyViews).toBeUndefined();
    expect(decoded.country).toBeUndefined();
    expect(decoded.niche).toBeUndefined();
    expect(decoded.monetizedPercentage).toBeUndefined();
    expect(decoded.currency).toBeUndefined();
    expect(decoded.customRpm).toBeUndefined();
    expect(decoded.estimateBand).toBeUndefined();
  });

  it("rejects an invalid channel id — leaves it absent from the partial", () => {
    const params = new URLSearchParams();
    params.set("cid", "not-a-channel-id");
    const decoded = decodeCalculatorState(params);
    expect(decoded.channelId).toBeUndefined();
  });

  it("accepts a valid channel id", () => {
    const params = new URLSearchParams();
    params.set("cid", "UCX6OQ3DkcsbYNE6H8uQQuVA");
    const decoded = decodeCalculatorState(params);
    expect(decoded.channelId).toBe("UCX6OQ3DkcsbYNE6H8uQQuVA");
  });

  it("decodes plain record shape (Next.js searchParams)", () => {
    const decoded = decodeCalculatorState({
      mv: "10000",
      c: "GB",
      n: "tech",
    });
    expect(decoded.monthlyViews).toBe(10000);
    expect(decoded.country).toBe("GB");
    expect(decoded.niche).toBe("tech");
  });

  it("decodes the estimate band when valid", () => {
    for (const band of ["low", "expected", "high"] as const) {
      const p = new URLSearchParams();
      p.set("eb", band);
      const decoded = decodeCalculatorState(p);
      expect(decoded.estimateBand).toBe(band);
    }
  });
});

describe("hydrateCalculatorState", () => {
  it("fills every missing key with the canonical default", () => {
    const hydrated = hydrateCalculatorState({});
    expect(hydrated).toEqual(DEFAULT_CALCULATOR_STATE);
    // Missing scenario URL parameter defaults to expected.
    expect(hydrated.estimateBand).toBe(DEFAULT_SCENARIO);
  });

  it("keeps caller-provided keys and defaults everything else", () => {
    const hydrated = hydrateCalculatorState({
      monthlyViews: 500_000,
      currency: "EUR",
    });
    expect(hydrated.monthlyViews).toBe(500_000);
    expect(hydrated.currency).toBe("EUR");
    // Everything else falls back:
    expect(hydrated.country).toBe(DEFAULT_CALCULATOR_STATE.country);
    expect(hydrated.estimateBand).toBe(DEFAULT_SCENARIO);
    expect(hydrated.niche).toBe(DEFAULT_CALCULATOR_STATE.niche);
  });

  it("coerces an undefined channelId to null", () => {
    const hydrated = hydrateCalculatorState({ channelId: undefined });
    expect(hydrated.channelId).toBeNull();
  });
});

describe("buildShareUrl", () => {
  it("produces a URL without extra params when state == defaults", () => {
    const url = buildShareUrl(
      "https://example.com",
      "/",
      DEFAULT_CALCULATOR_STATE,
    );
    expect(url).toBe("https://example.com/");
  });

  it("attaches non-default state as query params", () => {
    const url = buildShareUrl("https://example.com", "/", {
      ...DEFAULT_CALCULATOR_STATE,
      monthlyViews: 1000,
      country: "GB",
    });
    expect(url).toContain("mv=1000");
    expect(url).toContain("c=GB");
    expect(url).toMatch(/^https:\/\/example\.com\/\?/);
  });

  it("includes the estimate band only when it differs from the default", () => {
    const urlDefault = buildShareUrl(
      "https://example.com",
      "/x",
      { ...DEFAULT_CALCULATOR_STATE },
    );
    expect(urlDefault).not.toContain("eb=");
    const urlLow = buildShareUrl(
      "https://example.com",
      "/x",
      { ...DEFAULT_CALCULATOR_STATE, estimateBand: "low" },
    );
    expect(urlLow).toContain("eb=low");
  });
});

describe("toEarningsInput", () => {
  it("passes custom RPM only when rpmMode is 'custom' AND > 0", () => {
    const input1 = toEarningsInput({
      ...DEFAULT_CALCULATOR_STATE,
      rpmMode: "custom",
      customRpm: 8,
    });
    expect(input1.rpm).toBe(8);
    const input2 = toEarningsInput({
      ...DEFAULT_CALCULATOR_STATE,
      rpmMode: "custom",
      customRpm: 0,
    });
    expect(input2.rpm).toBeUndefined();
    const input3 = toEarningsInput({
      ...DEFAULT_CALCULATOR_STATE,
      rpmMode: "auto",
      customRpm: 8,
    });
    expect(input3.rpm).toBeUndefined();
  });

  it("clamps out-of-range values", () => {
    const input = toEarningsInput({
      ...DEFAULT_CALCULATOR_STATE,
      monthlyViews: -100,
      monetizedPercentage: 300,
    });
    expect(input.monthlyViews).toBe(0);
    expect(input.monetizedPercentage).toBe(100);
  });

  it("folds 'other' income into the sponsorship bucket", () => {
    const input = toEarningsInput({
      ...DEFAULT_CALCULATOR_STATE,
      sponsorship: 100,
      other: 250,
    });
    expect(input.sponsorship).toBe(350);
  });

  it("accepts a partial state and hydrates defaults for the pure engine", () => {
    const input = toEarningsInput({ monthlyViews: 200_000 });
    expect(input.monthlyViews).toBe(200_000);
    // Missing keys default: currency USD, monetized 90%, country US, etc.
    expect(input.currency).toBe(DEFAULT_CALCULATOR_STATE.currency);
    expect(input.monetizedPercentage).toBe(
      DEFAULT_CALCULATOR_STATE.monetizedPercentage,
    );
    expect(input.country).toBe(DEFAULT_CALCULATOR_STATE.country);
  });
});
