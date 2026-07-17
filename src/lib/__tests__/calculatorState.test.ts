import { describe, expect, it } from "vitest";

import {
  DEFAULT_CALCULATOR_STATE,
  buildShareUrl,
  decodeCalculatorState,
  encodeCalculatorState,
  toEarningsInput,
  type CalculatorState,
} from "../calculatorState";

describe("calculator state — encode / decode round trip", () => {
  it("round-trips a full state", () => {
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
    };
    const params = encodeCalculatorState(state);
    const decoded = decodeCalculatorState(params);
    expect(decoded).toEqual(state);
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
  });

  it("returns defaults for an empty URLSearchParams", () => {
    const decoded = decodeCalculatorState(new URLSearchParams());
    expect(decoded).toEqual(DEFAULT_CALCULATOR_STATE);
  });

  it("ignores unsupported query parameters", () => {
    const params = new URLSearchParams();
    params.set("mv", "1000");
    params.set("evil", "<script>");
    params.set("unrelated", "yes");
    const decoded = decodeCalculatorState(params);
    expect(decoded.monthlyViews).toBe(1000);
    expect(decoded.country).toBe(DEFAULT_CALCULATOR_STATE.country);
  });

  it("falls back to defaults on invalid values", () => {
    const params = new URLSearchParams();
    params.set("mv", "-500");
    params.set("c", "ZZ");
    params.set("n", "fake-niche");
    params.set("mp", "999");
    params.set("cur", "XYZ");
    params.set("rpm", "abc");
    const decoded = decodeCalculatorState(params);
    expect(decoded.monthlyViews).toBe(DEFAULT_CALCULATOR_STATE.monthlyViews);
    expect(decoded.country).toBe(DEFAULT_CALCULATOR_STATE.country);
    expect(decoded.niche).toBe(DEFAULT_CALCULATOR_STATE.niche);
    expect(decoded.monetizedPercentage).toBe(
      DEFAULT_CALCULATOR_STATE.monetizedPercentage,
    );
    expect(decoded.currency).toBe(DEFAULT_CALCULATOR_STATE.currency);
    expect(decoded.customRpm).toBe(DEFAULT_CALCULATOR_STATE.customRpm);
  });

  it("rejects an invalid channel id", () => {
    const params = new URLSearchParams();
    params.set("cid", "not-a-channel-id");
    const decoded = decodeCalculatorState(params);
    expect(decoded.channelId).toBeNull();
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
});
