import { describe, expect, it } from "vitest";

import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatDuration,
  formatNumber,
  parseIsoDuration,
} from "../format";

describe("format helpers", () => {
  it("formatCompact handles null / undefined / NaN", () => {
    expect(formatCompact(null)).toBe("—");
    expect(formatCompact(undefined)).toBe("—");
    expect(formatCompact(Number.NaN)).toBe("—");
  });

  it("formatCompact renders M/K style", () => {
    expect(formatCompact(1_234_567)).toContain("M");
    expect(formatCompact(12_500)).toContain("K");
  });

  it("formatNumber respects locale grouping", () => {
    expect(formatNumber(1_234_567)).toBe("1,234,567");
    expect(formatNumber(null)).toBe("—");
  });

  it("formatCurrency uses standard formatting by default", () => {
    const out = formatCurrency(1234.5, "USD");
    expect(out).toMatch(/\$1,234\.50/);
  });

  it("formatCurrency compacts when requested", () => {
    const out = formatCurrency(2_500_000, "USD", { compact: true });
    expect(out).toMatch(/2\.5M/);
  });

  it("formatCurrency falls back safely on unknown currency", () => {
    const out = formatCurrency(10, "XYZ");
    expect(out).toMatch(/10/);
  });

  it("formatCurrency treats non-finite values as 0", () => {
    expect(formatCurrency(Number.NaN)).toMatch(/0\.00/);
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toMatch(/0\.00/);
  });

  it("formatDate handles invalid inputs", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("not a date")).toBe("—");
    expect(formatDate("2025-06-15T00:00:00Z")).toContain("2025");
  });

  it("parseIsoDuration parses hours/minutes/seconds", () => {
    expect(parseIsoDuration("PT1H2M3S")).toBe(3723);
    expect(parseIsoDuration("PT10S")).toBe(10);
    expect(parseIsoDuration("PT5M")).toBe(300);
    expect(parseIsoDuration("PT")).toBe(0);
    expect(parseIsoDuration("not-iso")).toBe(0);
  });

  it("formatDuration handles hours + minutes + seconds", () => {
    expect(formatDuration(3723)).toBe("1:02:03");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(-1)).toBe("0:00");
  });
});
