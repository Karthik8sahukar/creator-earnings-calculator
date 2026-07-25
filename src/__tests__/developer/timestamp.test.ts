import { describe, it, expect } from "vitest";
import { timestampToDate, detectUnit } from "@/lib/developer";

describe("Timestamp utilities", () => {
  it("converts seconds", () => {
    const result = timestampToDate(1700000000, "seconds");
    expect(result.iso).toBe("2023-11-14T22:13:20.000Z");
    expect(result.seconds).toBe(1700000000);
    expect(result.milliseconds).toBe(1700000000000);
  });

  it("converts milliseconds", () => {
    const result = timestampToDate(1700000000000, "milliseconds");
    expect(result.iso).toBe("2023-11-14T22:13:20.000Z");
  });

  it("auto-detects seconds vs milliseconds", () => {
    expect(detectUnit(1700000000)).toBe("seconds");
    expect(detectUnit(1700000000000)).toBe("milliseconds");
  });

  it("throws on invalid timestamp", () => {
    expect(() => timestampToDate(NaN)).toThrow();
  });
});
