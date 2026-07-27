import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  addFavorite,
  clearFavorites,
  MAX_FAVORITES,
  removeFavorite,
  toggleFavorite,
  useFavorites,
} from "./useFavorites";

beforeEach(() => {
  window.localStorage.clear();
  // Reset the module-level snapshot by clearing and emitting
  clearFavorites();
});

describe("useFavorites", () => {
  it("starts with an empty list", () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
  });

  it("adds a favorite", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.addFavorite("mrbeast");
    });
    expect(result.current.favorites).toContain("mrbeast");
    expect(result.current.favorites).toHaveLength(1);
  });

  it("removes a favorite", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.addFavorite("mrbeast");
      result.current.addFavorite("pewdiepie");
    });
    act(() => {
      result.current.removeFavorite("mrbeast");
    });
    expect(result.current.favorites).not.toContain("mrbeast");
    expect(result.current.favorites).toContain("pewdiepie");
  });

  it("toggleFavorite adds when not present", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggleFavorite("mrbeast");
    });
    expect(result.current.favorites).toContain("mrbeast");
  });

  it("toggleFavorite removes when already present", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.addFavorite("mrbeast");
    });
    act(() => {
      result.current.toggleFavorite("mrbeast");
    });
    expect(result.current.favorites).not.toContain("mrbeast");
  });

  it("deduplicates — adding the same slug twice results in one entry", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.addFavorite("mrbeast");
      result.current.addFavorite("mrbeast");
    });
    expect(result.current.favorites.filter((s) => s === "mrbeast")).toHaveLength(1);
  });

  it("enforces maximum of MAX_FAVORITES unique favorites", () => {
    const { result } = renderHook(() => useFavorites());

    // Generate unique slugs for each addition
    act(() => {
      for (let i = 0; i < MAX_FAVORITES + 10; i++) {
        result.current.addFavorite(`creator-${i}`);
      }
    });

    expect(result.current.favorites).toHaveLength(MAX_FAVORITES);
  });

  it("isFavorite returns true for favorited slugs", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.addFavorite("mrbeast");
    });
    expect(result.current.isFavorite("mrbeast")).toBe(true);
    expect(result.current.isFavorite("unknown")).toBe(false);
  });

  it("clearFavorites empties the list", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.addFavorite("mrbeast");
      result.current.addFavorite("pewdiepie");
    });
    act(() => {
      result.current.clearFavorites();
    });
    expect(result.current.favorites).toEqual([]);
  });

  it("persists to localStorage", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.addFavorite("mrbeast");
    });
    const stored = JSON.parse(window.localStorage.getItem("cec.favorites.v1") ?? "[]");
    expect(stored).toContain("mrbeast");
  });

  it("ignores empty slug", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.addFavorite("");
    });
    expect(result.current.favorites).toHaveLength(0);
  });
});

describe("standalone mutators", () => {
  it("addFavorite works outside of hook", () => {
    addFavorite("standalone-creator");
    const stored = JSON.parse(window.localStorage.getItem("cec.favorites.v1") ?? "[]");
    expect(stored).toContain("standalone-creator");
  });

  it("removeFavorite works outside of hook", () => {
    addFavorite("to-remove");
    removeFavorite("to-remove");
    const stored = JSON.parse(window.localStorage.getItem("cec.favorites.v1") ?? "[]");
    expect(stored).not.toContain("to-remove");
  });

  it("toggleFavorite works outside of hook", () => {
    toggleFavorite("toggled");
    let stored = JSON.parse(window.localStorage.getItem("cec.favorites.v1") ?? "[]");
    expect(stored).toContain("toggled");

    toggleFavorite("toggled");
    stored = JSON.parse(window.localStorage.getItem("cec.favorites.v1") ?? "[]");
    expect(stored).not.toContain("toggled");
  });
});
