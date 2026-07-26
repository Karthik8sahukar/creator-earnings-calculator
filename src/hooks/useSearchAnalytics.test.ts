import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { useSearchAnalytics } from "./useSearchAnalytics";

const STORAGE_KEY = "behumler:search-analytics";

describe("useSearchAnalytics", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with zero events", () => {
    const { result } = renderHook(() => useSearchAnalytics());
    expect(result.current.eventCount).toBe(0);
  });

  it("trackSearch records a search event", () => {
    const { result } = renderHook(() => useSearchAnalytics());
    act(() => result.current.trackSearch("coin flip", "coin-flip"));
    expect(result.current.eventCount).toBe(1);
  });

  it("ignores queries shorter than 2 characters", () => {
    const { result } = renderHook(() => useSearchAnalytics());
    act(() => result.current.trackSearch("a"));
    act(() => result.current.trackSearch(""));
    expect(result.current.eventCount).toBe(0);
  });

  it("getPopularSearches returns most frequent queries", () => {
    const { result } = renderHook(() => useSearchAnalytics());
    act(() => {
      result.current.trackSearch("coin flip");
      result.current.trackSearch("json");
      result.current.trackSearch("coin flip");
      result.current.trackSearch("coin flip");
      result.current.trackSearch("json");
      result.current.trackSearch("uuid");
    });
    const popular = result.current.getPopularSearches(3);
    expect(popular[0]).toBe("coin flip"); // 3 times
    expect(popular[1]).toBe("json"); // 2 times
    expect(popular[2]).toBe("uuid"); // 1 time
  });

  it("getTrendingSearches considers only last 7 days", () => {
    const now = new Date("2026-07-26T12:00:00Z").getTime();
    vi.setSystemTime(now);

    const { result } = renderHook(() => useSearchAnalytics());

    // Seed old events in localStorage (older than 7 days)
    const oldEvents = [
      { query: "old query", ts: now - 8 * 24 * 60 * 60 * 1000, selectedSlug: undefined },
      { query: "old query", ts: now - 8 * 24 * 60 * 60 * 1000, selectedSlug: undefined },
    ];
    const newEvents = [
      { query: "new query", ts: now - 1000, selectedSlug: undefined },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...newEvents, ...oldEvents]));

    // Re-mount to hydrate
    const { result: result2 } = renderHook(() => useSearchAnalytics());
    const trending = result2.current.getTrendingSearches(5);
    expect(trending).toContain("new query");
    expect(trending).not.toContain("old query");
  });

  it("getTrendingTools returns most-selected tool slugs", () => {
    const now = new Date("2026-07-26T12:00:00Z").getTime();
    vi.setSystemTime(now);

    const { result } = renderHook(() => useSearchAnalytics());
    act(() => {
      result.current.trackSearch("coin", "coin-flip");
      result.current.trackSearch("dice", "dice-roller");
      result.current.trackSearch("flip", "coin-flip");
      result.current.trackSearch("roll", "coin-flip");
    });
    const trending = result.current.getTrendingTools(3);
    expect(trending[0]).toBe("coin-flip"); // selected 3 times
    expect(trending[1]).toBe("dice-roller"); // selected 1 time
  });

  it("respects max 100 events", () => {
    const { result } = renderHook(() => useSearchAnalytics());
    act(() => {
      for (let i = 0; i < 110; i++) {
        result.current.trackSearch(`query-${i}`);
      }
    });
    expect(result.current.eventCount).toBe(100);
  });

  it("persists to localStorage", () => {
    const { result } = renderHook(() => useSearchAnalytics());
    act(() => result.current.trackSearch("test query"));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored.length).toBe(1);
    expect(stored[0].query).toBe("test query");
  });

  it("clearAnalytics removes all data", () => {
    const { result } = renderHook(() => useSearchAnalytics());
    act(() => result.current.trackSearch("something"));
    act(() => result.current.clearAnalytics());
    expect(result.current.eventCount).toBe(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("handles malformed JSON in localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "broken{{{");
    const { result } = renderHook(() => useSearchAnalytics());
    expect(result.current.eventCount).toBe(0);
  });

  it("handles localStorage unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    const { result } = renderHook(() => useSearchAnalytics());
    expect(result.current.eventCount).toBe(0);
  });

  it("getPopularToolsFallback returns registry popular tools", () => {
    const { result } = renderHook(() => useSearchAnalytics());
    const fallback = result.current.getPopularToolsFallback(3);
    expect(fallback.length).toBeGreaterThan(0);
    expect(fallback.length).toBeLessThanOrEqual(3);
    // All should have popular flag
    for (const tool of fallback) {
      expect(tool.popular).toBe(true);
    }
  });
});
