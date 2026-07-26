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
    const { result } = renderHook(() => useFavorites());
    const slugs = Array.from({ length: 55 }, (_, i) => `tool-${i}`);
    act(() => {
      for (const slug of slugs) {
        result.current.addFavorite(slug);
      }
    });
    expect(result.current.favorites.length).toBe(50);
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
