"use client";

import { useFavorites } from "@/hooks/useFavorites";

interface Props {
  /** The tool slug to favorite. */
  slug: string;
  /** Additional className. */
  className?: string;
  /** Compact mode (icon only, no text). */
  compact?: boolean;
}

/**
 * FavoriteButton — toggles a tool's favorite status.
 *
 * Uses the useFavorites hook for localStorage persistence.
 * Renders a heart icon that fills when favorited.
 */
export function FavoriteButton({ slug, className = "", compact = false }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(slug);

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(slug)}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorited}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 ${
        favorited
          ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30"
          : "text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
      } ${className}`}
    >
      <HeartIcon filled={favorited} />
      {!compact && <span>{favorited ? "Favorited" : "Favorite"}</span>}
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
