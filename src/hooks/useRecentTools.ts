"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "behumler:recent-tools";
const MAX_RECENT = 10;

/**
 * useRecentTools — tracks recently visited tools in localStorage.
 *
 * Stores the last 10 tool slugs visited, most-recent first.
 * Call `recordVisit(slug)` when a tool page mounts.
 *
 * Usage:
 *   const { recentSlugs, recordVisit } = useRecentTools();
 */
export function useRecentTools() {
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentSlugs(parsed.slice(0, MAX_RECENT));
        }
      }
    } catch {
      // localStorage unavailable — start empty
    }
  }, []);

  // Sync across hook instances and tabs
  useEffect(() => {
    const sync = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setRecentSlugs(parsed.slice(0, MAX_RECENT));
          }
        } else {
          setRecentSlugs([]);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("storage", sync);
    window.addEventListener("recent-tools-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("recent-tools-updated", sync);
    };
  }, []);

  const recordVisit = useCallback(
    (slug: string) => {
      setRecentSlugs((prev) => {
        // Move to front (dedup), cap at MAX_RECENT
        const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX_RECENT);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          window.dispatchEvent(new Event("recent-tools-updated"));
        } catch {
          // quota exceeded — state still updated in memory
        }
        return next;
      });
    },
    [],
  );

  const clearRecent = useCallback(() => {
    setRecentSlugs([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event("recent-tools-updated"));
    } catch {
      // ignore
    }
  }, []);

  return {
    /** Ordered list of recently visited tool slugs (newest first). */
    recentSlugs,
    /** Number of recent tools. */
    count: recentSlugs.length,
    /** Record a tool visit. Call on tool page mount. */
    recordVisit,
    /** Clear all recent history. */
    clearRecent,
  };
}
