"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "behumler:search-history";
const MAX_HISTORY = 20;

/**
 * useSearchHistory — persists recent search queries in localStorage.
 *
 * Stores the last 20 unique queries (trimmed, lowercase-deduped).
 * Most-recent first. Empty/whitespace queries are ignored.
 *
 * Usage:
 *   const { history, addQuery, removeQuery, clearHistory } = useSearchHistory();
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out non-strings and empty entries
          const valid = parsed
            .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
            .slice(0, MAX_HISTORY);
          setHistory(valid);
        }
      }
    } catch {
      // localStorage unavailable or malformed — start empty
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
            const valid = parsed
              .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
              .slice(0, MAX_HISTORY);
            setHistory(valid);
          }
        } else {
          setHistory([]);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("storage", sync);
    window.addEventListener("search-history-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("search-history-updated", sync);
    };
  }, []);

  /**
   * Add a search query to history. Moves to front if already present.
   * Ignores empty/whitespace-only queries and queries shorter than 2 chars.
   */
  const addQuery = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) return;

      setHistory((prev) => {
        // Deduplicate case-insensitively but preserve the latest casing
        const next = [
          trimmed,
          ...prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase()),
        ].slice(0, MAX_HISTORY);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          window.dispatchEvent(new Event("search-history-updated"));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [],
  );

  /** Remove a specific query from history. */
  const removeQuery = useCallback(
    (query: string) => {
      setHistory((prev) => {
        const next = prev.filter((q) => q !== query);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          window.dispatchEvent(new Event("search-history-updated"));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [],
  );

  /** Clear all search history. */
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event("search-history-updated"));
    } catch {
      // ignore
    }
  }, []);

  return {
    /** Recent search queries (newest first, max 20). */
    history,
    /** Number of saved queries. */
    count: history.length,
    /** Record a search query. */
    addQuery,
    /** Remove a specific query from history. */
    removeQuery,
    /** Clear all search history. */
    clearHistory,
  };
}
