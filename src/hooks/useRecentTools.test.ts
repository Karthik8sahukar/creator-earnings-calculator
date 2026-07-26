import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { useRecentTools } from "./useRecentTools";

const STORAGE_KEY = "behumler:recent-tools";

describe("useRecentTools", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns empty recent slugs initially", () => {
    const { result } = renderHook(() => useRecentTools());
    expect(result.current.recentSlugs).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it("records a visit", () => {
    const { result } = renderHook(() => useRecentTools());
    act(() => result.current.recordVisit("coin-flip"));
    expect(result.current.recentSlugs).toEqual(["coin-flip"]);
    expect(result.current.count).toBe(1);
  });

  it("revisiting moves slug to front", () => {
    const { result } = renderHook(() => useRecentTools());
    act(() => result.current.recordVisit("first"));
    act(() => result.current.recordVisit("second"));
    act(() => result.current.recordVisit("first"));
    expect(result.current.recentSlugs[0]).toBe("first");
    expect(result.current.recentSlugs[1]).toBe("second");
    expect(result.current.recentSlugs.length).toBe(2);
  });

  it("deduplicates entries", () => {
    const { result } = renderHook(() => useRecentTools());
    act(() => result.current.recordVisit("coin-flip"));
    act(() => result.current.recordVisit("coin-flip"));
    act(() => result.current.recordVisit("coin-flip"));
    expect(result.current.recentSlugs).toEqual(["coin-flip"]);
  });

  it("respects max 10 recent tools", () => {
    const { result } = renderHook(() => useRecentTools());
    const slugs = Array.from({ length: 15 }, (_, i) => `tool-${i}`);
    act(() => {
      for (const slug of slugs) {
        result.current.recordVisit(slug);
      }
    });
    expect(result.current.recentSlugs.length).toBe(10);
    // Most recent should be last added
    expect(result.current.recentSlugs[0]).toBe("tool-14");
  });

  it("clearRecent empties the list and removes from localStorage", () => {
    const { result } = renderHook(() => useRecentTools());
    act(() => result.current.recordVisit("coin-flip"));
    act(() => result.current.recordVisit("dice-roller"));
    act(() => result.current.clearRecent());
    expect(result.current.recentSlugs).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("persists to localStorage", () => {
    const { result } = renderHook(() => useRecentTools());
    act(() => result.current.recordVisit("json-formatter"));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toEqual(["json-formatter"]);
  });

  it("hydrates from localStorage on mount", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["dice-roller", "coin-flip"]));
    const { result } = renderHook(() => useRecentTools());
    expect(result.current.recentSlugs).toEqual(["dice-roller", "coin-flip"]);
  });

  it("handles malformed JSON in localStorage gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "broken json }{");
    const { result } = renderHook(() => useRecentTools());
    expect(result.current.recentSlugs).toEqual([]);
  });

  it("handles non-array JSON in localStorage gracefully", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(42));
    const { result } = renderHook(() => useRecentTools());
    expect(result.current.recentSlugs).toEqual([]);
  });

  it("handles localStorage being unavailable", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    const { result } = renderHook(() => useRecentTools());
    expect(result.current.recentSlugs).toEqual([]);
    spy.mockRestore();
  });
});
