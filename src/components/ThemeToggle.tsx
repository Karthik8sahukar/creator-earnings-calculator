"use client";

import { useCallback, useEffect, useState } from "react";

import { MoonIcon, SunIcon } from "./icons";

type Theme = "light" | "dark";

const STORAGE_KEY = "behumler:theme";

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  // The inline ThemeScript has already applied .dark to <html> where
  // appropriate. Trust the DOM as source of truth on mount to avoid a
  // hydration mismatch.
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Accessible theme toggle.
 *
 * - `aria-label` reflects the ACTION the button will perform.
 * - `aria-pressed` reflects the current state (dark = pressed).
 * - Fully keyboard-operable — it's a native <button>.
 * - Respects `prefers-color-scheme` when no saved preference exists
 *   (handled by ThemeScript on first paint; also re-synced here on
 *   mount for SPA navigation).
 * - No hydration mismatch: renders a stable placeholder until the
 *   effect runs, then swaps in the real icon.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readInitialTheme());
    setMounted(true);
  }, []);

  // Follow system preference changes IF the user has never made an
  // explicit choice. Once they click the toggle, we stop tracking it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      let saved: string | null = null;
      try {
        saved = window.localStorage.getItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      if (saved === "light" || saved === "dark") return;
      applyTheme(e.matches ? "dark" : "light");
      setTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage may be unavailable; theme still applied for the session */
    }
  }, [theme]);

  // Render a size-stable, non-interactive placeholder before mount so
  // SSR HTML matches. The real button appears after hydration.
  if (!mounted) {
    return (
      <span
        aria-hidden
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ${className}`}
      >
        <SunIcon width={18} height={18} />
      </span>
    );
  }

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 ${className}`}
    >
      {isDark ? (
        <SunIcon width={18} height={18} />
      ) : (
        <MoonIcon width={18} height={18} />
      )}
    </button>
  );
}

function applyTheme(next: Theme) {
  const root = document.documentElement;
  if (next === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = next;
}
