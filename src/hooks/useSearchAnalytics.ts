"use client";

import { useCallback, useEffect, useState } from "react";
import { getPopularTools, type ToolEntry } from "@/lib/tools";

const STORAGE_KEY = "behumler:search-analytics";
const MAX_ENTRIES = 100;
const TRENDING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Analytics entry: a query with a timestamp and optional selected tool.
 */
interface SearchEvent {
  /** The search query. */
  query: string;
  /** Unix timestamp (ms). */
  ts: number;
  /** Tool slug that was selected from results (if any). */
  selectedSlug?: string;
}

/**
 * Aggregated query stats for ranking popular/trending searches.
 */
interface QueryStats {
  query: string;
  count: number;
  lastUsed: number;
}

/**
 * useSearchAnalytics — tracks search queries and tool selections.
 *
 * Provides:
 *   - Popular searches (by frequency, all time)
 *   - Trending searches (by recency within 7 days)
 *   - Tool selection tracking (which tools get picked from search)
 *   - Query frequency for ranking suggestions
 *
 * All data is stored client-side in localStorage. No server calls.
 * The adapter pattern allows GA4/PostHog to be plugged in later.
 */
export function useSearchAnalytics() {
  const [events, setEvents] = useState<SearchEvent[]>([]);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setEvents(parsed.slice(0, MAX_ENTRIES));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((next: SearchEvent[]) => {
    const capped = next.slice(0, MAX_ENTRIES);
    setEvents(capped);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
    } catch {
      // ignore
    }
  }, []);

  /**
   * Track a search query event.
   * Call when the user submits/enters a search (not on every keystroke).
   */
  const trackSearch = useCallback(
    (query: string, selectedSlug?: string) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) return;

      const event: SearchEvent = {
        query: trimmed,
        ts: Date.now(),
        selectedSlug,
      };

      setEvents((prev) => {
        const next = [event, ...prev].slice(0, MAX_ENTRIES);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [],
  );

  /**
   * Get popular searches ranked by frequency (all time).
   * Returns unique query strings, most frequent first.
   */
  const getPopularSearches = useCallback(
    (limit = 6): string[] => {
      const freq = new Map<string, QueryStats>();

      for (const ev of events) {
        const key = ev.query.toLowerCase();
        const existing = freq.get(key);
        if (existing) {
          existing.count++;
          existing.lastUsed = Math.max(existing.lastUsed, ev.ts);
        } else {
          freq.set(key, { query: ev.query, count: 1, lastUsed: ev.ts });
        }
      }

      return Array.from(freq.values())
        .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
        .slice(0, limit)
        .map((s) => s.query);
    },
    [events],
  );

  /**
   * Get trending searches — queries used within the last 7 days,
   * ranked by a combined frequency + recency score.
   */
  const getTrendingSearches = useCallback(
    (limit = 6): string[] => {
      const now = Date.now();
      const cutoff = now - TRENDING_WINDOW_MS;

      const freq = new Map<string, QueryStats>();

      for (const ev of events) {
        if (ev.ts < cutoff) continue;
        const key = ev.query.toLowerCase();
        const existing = freq.get(key);
        if (existing) {
          existing.count++;
          existing.lastUsed = Math.max(existing.lastUsed, ev.ts);
        } else {
          freq.set(key, { query: ev.query, count: 1, lastUsed: ev.ts });
        }
      }

      return Array.from(freq.values())
        .sort((a, b) => {
          // Score: frequency * recency factor
          const scoreA = a.count * (1 + (a.lastUsed - cutoff) / TRENDING_WINDOW_MS);
          const scoreB = b.count * (1 + (b.lastUsed - cutoff) / TRENDING_WINDOW_MS);
          return scoreB - scoreA;
        })
        .slice(0, limit)
        .map((s) => s.query);
    },
    [events],
  );

  /**
   * Get trending tools — tools most frequently selected from search results
   * in the last 7 days.
   */
  const getTrendingTools = useCallback(
    (limit = 6): string[] => {
      const now = Date.now();
      const cutoff = now - TRENDING_WINDOW_MS;

      const freq = new Map<string, number>();

      for (const ev of events) {
        if (ev.ts < cutoff || !ev.selectedSlug) continue;
        freq.set(ev.selectedSlug, (freq.get(ev.selectedSlug) ?? 0) + 1);
      }

      return Array.from(freq.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([slug]) => slug);
    },
    [events],
  );

  /**
   * Get popular tools as a fallback when no analytics data exists.
   * Uses the registry's popular flags.
   */
  const getPopularToolsFallback = useCallback(
    (limit = 6): ToolEntry[] => {
      return getPopularTools().slice(0, limit);
    },
    [],
  );

  /** Clear all analytics data. */
  const clearAnalytics = useCallback(() => {
    persist([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [persist]);

  return {
    /** Track a search event (query + optional selected tool). */
    trackSearch,
    /** Popular searches by frequency (all time). */
    getPopularSearches,
    /** Trending searches within 7 days. */
    getTrendingSearches,
    /** Trending tool slugs within 7 days. */
    getTrendingTools,
    /** Fallback popular tools from registry. */
    getPopularToolsFallback,
    /** Clear all analytics. */
    clearAnalytics,
    /** Raw event count. */
    eventCount: events.length,
  };
}
