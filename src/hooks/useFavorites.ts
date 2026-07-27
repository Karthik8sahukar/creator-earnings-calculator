"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "behumler:favorites";
const MAX_FAVORITES = 50;

/**
 * useFavorites — localStorage-backed favorites system.
 *
 * Stores an ordered list of tool slugs. Provides toggle, check, and
 * list operations. Silently no-ops when localStorage is unavailable.
 *
 * Usage:
 *   const { favorites, isFavorite, toggleFavorite } = useFavorites();
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFavorites(parsed.slice(0, MAX_FAVORITES));
        }
      }
    } catch {
      // localStorage unavailable or corrupted — start empty
    }
  }, []);

  // Sync across hook instances: listen for localStorage changes
  // triggered by other instances on the same page (via custom event)
  // or from other tabs (via native storage event).
  useEffect(() => {
    const sync = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setFavorites(parsed.slice(0, MAX_FAVORITES));
          }
        } else {
          setFavorites([]);
        }
      } catch {
        // ignore
      }
    };

    // Cross-tab sync (native storage event)
    window.addEventListener("storage", sync);
    // Same-page cross-instance sync (custom event)
    window.addEventListener("favorites-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("favorites-updated", sync);
    };
  }, []);

  // Persist to localStorage on change and notify other hook instances
  const persist = useCallback((next: string[]) => {
    setFavorites(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      // Notify other hook instances on the same page
      window.dispatchEvent(new Event("favorites-updated"));
    } catch {
      // quota exceeded or unavailable — state still updated in memory
    }
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (slug: string) => {
      const idx = favorites.indexOf(slug);
      if (idx >= 0) {
        // Remove
        persist(favorites.filter((s) => s !== slug));
      } else {
        // Add (prepend, cap at MAX)
        persist([slug, ...favorites].slice(0, MAX_FAVORITES));
      }
    },
    [favorites, persist],
  );

  const addFavorite = useCallback(
    (slug: string) => {
      if (!favorites.includes(slug)) {
        persist([slug, ...favorites].slice(0, MAX_FAVORITES));
      }
    },
    [favorites, persist],
  );

  const removeFavorite = useCallback(
    (slug: string) => {
      persist(favorites.filter((s) => s !== slug));
    },
    [favorites, persist],
  );

  return {
    /** Ordered list of favorite tool slugs (newest first). */
    favorites,
    /** Total count of favorites. */
    count: favorites.length,
    /** Check if a specific tool is favorited. */
    isFavorite,
    /** Toggle a tool's favorite status. */
    toggleFavorite,
    /** Add to favorites (no-op if already present). */
    addFavorite,
    /** Remove from favorites (no-op if not present). */
    removeFavorite,
  };
}
