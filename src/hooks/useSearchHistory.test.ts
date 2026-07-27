import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { useSearchHistory } from "./useSearchHistory";

const STORAGE_KEY = "behumler:search-history";

describe("useSearchHistory", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns empty history initially", () => {
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it("addQuery records a search query", () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => result.current.addQuery("json formatter"));
    expect(result.current.history).toEqual(["json formatter"]);
    expect(result.current.count).toBe(1);
  });

  it("ignores queries shorter than 2 characters", () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => result.current.addQuery("a"));
    act(() => result.current.addQuery(""));
    act(() => result.current.addQuery(" "));
    expect(result.current.history).toEqual([]);
  });

  it("trims whitespace from queries", () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => result.current.addQuery("  coin flip  "));
    expect(result.current.history).toEqual(["coin flip"]);
  });

  it("deduplicates case-insensitively, preserving latest casing", () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => result.current.addQuery("JSON"));
    act(() => result.current.addQuery("json"));
    expect(result.current.history).toEqual(["json"]);
    expect(result.current.count).toBe(1);
  });

  it("moves repeated query to front", () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => result.current.addQuery("first"));
    act(() => result.current.addQuery("second"));
    act(() => result.current.addQuery("first"));
    expect(result.current.history[0]).toBe("first");
    expect(result.current.history[1]).toBe("second");
  });

  it("respects max 20 entries", () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addQuery(`query-${i}`);
      }
    });
    expect(result.current.history.length).toBe(20);
    // Most recent should be first
    expect(result.current.history[0]).toBe("query-24");
  });

  it("removeQuery removes a specific query", () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => result.current.addQuery("keep"));
    act(() => result.current.addQuery("remove-me"));
    act(() => result.current.removeQuery("remove-me"));
    expect(result.current.history).toEqual(["keep"]);
  });

  it("clearHistory empties the list", () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => result.current.addQuery("one"));
    act(() => result.current.addQuery("two"));
    act(() => result.current.clearHistory());
    expect(result.current.history).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("persists to localStorage", () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => result.current.addQuery("coin flip"));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toEqual(["coin flip"]);
  });

  it("hydrates from localStorage on mount", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["dice", "uuid"]));
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual(["dice", "uuid"]);
  });

  it("handles malformed JSON gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not json {{{");
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);
  });

  it("handles non-array JSON gracefully", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }));
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);
  });

  it("handles localStorage being unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);
  });

  it("filters non-string and empty entries from storage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["valid", 123, "", null, "also-valid"]));
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual(["valid", "also-valid"]);
  });
});
