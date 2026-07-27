import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { useFavorites } from "./useFavorites";

const STORAGE_KEY = "behumler:favorites";

describe("useFavorites", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns empty favorites initially", () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it("toggleFavorite adds a slug", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggleFavorite("coin-flip"));
    expect(result.current.favorites).toEqual(["coin-flip"]);
    expect(result.current.isFavorite("coin-flip")).toBe(true);
    expect(result.current.count).toBe(1);
  });

  it("toggleFavorite removes an existing slug", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggleFavorite("coin-flip"));
    act(() => result.current.toggleFavorite("coin-flip"));
    expect(result.current.favorites).toEqual([]);
    expect(result.current.isFavorite("coin-flip")).toBe(false);
  });

  it("addFavorite does not duplicate", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.addFavorite("coin-flip"));
    act(() => result.current.addFavorite("coin-flip"));
    expect(result.current.favorites).toEqual(["coin-flip"]);
  });

  it("removeFavorite removes a slug", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.addFavorite("coin-flip"));
    act(() => result.current.removeFavorite("coin-flip"));
    expect(result.current.favorites).toEqual([]);
  });

  it("respects max 50 favorites", () => {
    // Pre-seed localStorage with 55 unique slugs to test the cap on hydration.
    // The hook reads localStorage on mount and slices to MAX_FAVORITES (50).
    const slugs = Array.from({ length: 55 }, (_, i) => `tool-${i}`);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));

    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites.length).toBe(50);
    // Entries beyond the limit are not stored in state
    expect(result.current.favorites).not.toContain("tool-54");
    expect(result.current.favorites).not.toContain("tool-53");
    expect(result.current.favorites).not.toContain("tool-52");
    expect(result.current.favorites).not.toContain("tool-51");
    expect(result.current.favorites).not.toContain("tool-50");
  });

  it("addFavorite caps at 50 when adding one beyond the limit", () => {
    // Start with exactly 50 favorites
    const slugs = Array.from({ length: 50 }, (_, i) => `tool-${i}`);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));

    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites.length).toBe(50);

    // Adding one more should keep the list at 50 (oldest dropped)
    act(() => result.current.addFavorite("tool-new"));
    expect(result.current.favorites.length).toBe(50);
    expect(result.current.favorites[0]).toBe("tool-new");
    // The last entry from the original list is dropped
    expect(result.current.favorites).not.toContain("tool-49");
  });

  it("persists to localStorage", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggleFavorite("json-formatter"));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toEqual(["json-formatter"]);
  });

  it("hydrates from localStorage on mount", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["dice-roller", "coin-flip"]));
    const { result } = renderHook(() => useFavorites());
    // Wait for useEffect hydration
    expect(result.current.favorites).toEqual(["dice-roller", "coin-flip"]);
  });

  it("handles malformed JSON in localStorage gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not valid json {{");
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
  });

  it("handles non-array JSON in localStorage gracefully", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }));
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
  });

  it("handles localStorage being unavailable", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
    spy.mockRestore();
  });

  it("prepends new favorites (newest first)", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.addFavorite("first"));
    act(() => result.current.addFavorite("second"));
    expect(result.current.favorites[0]).toBe("second");
    expect(result.current.favorites[1]).toBe("first");
  });
});
