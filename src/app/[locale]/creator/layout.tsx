import type { ReactNode } from "react";

/**
 * Pass-through layout for the `/[locale]/creator/*` subtree.
 *
 * The visual chrome (`<html>`, header, footer, providers, etc.) is
 * provided by `[locale]/layout.tsx` — this layout renders `children`
 * verbatim and adds no UI of its own.
 *
 * Why it exists at all:
 *
 *   Next.js App Router only treats a folder as a "route segment"
 *   during resolution when the folder contains a `page.tsx` OR a
 *   `layout.tsx`. `not-found.tsx` alone is not enough.
 *
 *   Without this file, `app/[locale]/creator/` was NOT a segment,
 *   which meant `app/[locale]/creator/not-found.tsx` was excluded
 *   from the not-found boundary walk. When `[slug]/page.tsx` marked
 *   itself with `dynamicParams = false`, an unknown slug caused
 *   Next.js to walk past `creator/` entirely and render
 *   `app/[locale]/not-found.tsx` — showing the site-wide
 *   "Page not found" heading instead of the creator-specific
 *   "Creator not found" one.
 *
 *   With this minimal pass-through layout in place, `creator/` is a
 *   proper route segment, its adjacent `not-found.tsx` is included
 *   in the boundary walk, and the creator-specific 404 renders.
 *
 * This layout does NOT declare `params` because it does not use
 * them. Child segments (`[slug]/page.tsx`) still receive `locale`
 * and `slug` normally.
 */
export default function CreatorLayout({ children }: { children: ReactNode }) {
  return children;
}
