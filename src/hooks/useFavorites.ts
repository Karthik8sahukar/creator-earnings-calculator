/**
 * Favorites hook — manages a user's list of favorite creator slugs.
 * Persists to localStorage. Deduplicates entries and caps at MAX_FAVORITES.
 */

import { useCallback, useSyncExternalStore } from "react";

export const MAX_FAVORITES = 50;
const STORAGE_KEY = "cec.favorites.v1";

// ─── Storage helpers ──────────────────────────────────────────────────────

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const s = window.localStorage;
    s.setItem("__cec_fav_probe", "1");
    s.removeItem("__cec_fav_probe");
    return s;
  } catch {
    return null;
  }
}

function readFavorites(): string[] {
  const storage = safeLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is string => typeof v === "string" && v.length > 0)
      .slice(0, MAX_FAVORITES);
  } catch {
    return [];
  }
}

function writeFavorites(favorites: string[]): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(favorites.slice(0, MAX_FAVORITES)));
  } catch {
    // ignore quota errors
  }
}

// ─── External store (shared across hook instances) ────────────────────────

let listeners: Array<() => void> = [];
let snapshot: string[] = readFavorites();

function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): string[] {
  return snapshot;
}

function getServerSnapshot(): string[] {
  return [];
}

function emitChange(): void {
  snapshot = readFavorites();
  for (const listener of listeners) {
    listener();
  }
}

// ─── Mutators ─────────────────────────────────────────────────────────────

export function addFavorite(slug: string): void {
  if (!slug) return;
  const current = readFavorites();
  // Deduplicate: don't add if already present
  if (current.includes(slug)) return;
  // Cap at MAX_FAVORITES
  const next = [slug, ...current].slice(0, MAX_FAVORITES);
  writeFavorites(next);
  emitChange();
}

export function removeFavorite(slug: string): void {
  const current = readFavorites();
  const next = current.filter((s) => s !== slug);
  writeFavorites(next);
  emitChange();
}

export function toggleFavorite(slug: string): void {
  const current = readFavorites();
  if (current.includes(slug)) {
    removeFavorite(slug);
  } else {
    addFavorite(slug);
  }
}

export function clearFavorites(): void {
  writeFavorites([]);
  emitChange();
}

export function isFavorite(slug: string): boolean {
  return readFavorites().includes(slug);
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export interface UseFavoritesReturn {
  favorites: string[];
  addFavorite: (slug: string) => void;
  removeFavorite: (slug: string) => void;
  toggleFavorite: (slug: string) => void;
  clearFavorites: () => void;
  isFavorite: (slug: string) => boolean;
}

export function useFavorites(): UseFavoritesReturn {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    favorites,
    addFavorite: useCallback((slug: string) => addFavorite(slug), []),
    removeFavorite: useCallback((slug: string) => removeFavorite(slug), []),
    toggleFavorite: useCallback((slug: string) => toggleFavorite(slug), []),
    clearFavorites: useCallback(() => clearFavorites(), []),
    isFavorite: useCallback((slug: string) => favorites.includes(slug), [favorites]),
  };
}
