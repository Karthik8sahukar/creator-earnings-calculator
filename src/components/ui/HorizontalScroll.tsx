"use client";

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** aria-label for the scrollable region. */
  label?: string;
  /** Additional className on the scroll container. */
  className?: string;
}

/**
 * Horizontal Scroll Container — touch-friendly scrollable area
 * with scroll-snap, fade edges, and accessible semantics.
 *
 * Design:
 *   - Scroll snap (snap-x snap-mandatory)
 *   - No visible scrollbar (scrollbar-hide)
 *   - Fade gradient on right edge (CSS mask)
 *   - Touch/mouse drag friendly
 *   - Accessible: role="region" with label
 *   - Responsive gap spacing
 */
export function HorizontalScroll({ children, label, className = "" }: Props) {
  return (
    <div className="relative">
      {/* Fade edge indicator (right side) */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 rounded-r-2xl" aria-hidden />

      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        className={`flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 scrollbar-hide ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Snap item wrapper — gives each child a consistent snap alignment.
 */
export function ScrollItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`snap-start shrink-0 ${className}`}>
      {children}
    </div>
  );
}
