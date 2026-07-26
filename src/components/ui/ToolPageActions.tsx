"use client";

import { FavoriteButton } from "./FavoriteButton";
import { ShareButton } from "./ShareButton";
import { ToolVisitTracker } from "./ToolVisitTracker";

interface Props {
  /** Tool slug from the registry. Used for visit tracking and favorites. */
  slug: string;
  /** Tool title for the share dialog. */
  title: string;
}

/**
 * ToolPageActions — renders FavoriteButton + ShareButton + ToolVisitTracker.
 *
 * Drop this into any tool page header to get:
 *   1. Visit tracking (records in recent tools on mount)
 *   2. Favorite button (toggle heart)
 *   3. Share button (Web Share API / clipboard fallback)
 *
 * This is a client component that uses localStorage hooks internally.
 * It renders no visible layout beyond the two action buttons.
 *
 * Usage:
 *   <ToolPageActions slug="coin-flip" title="Coin Flip" />
 */
export function ToolPageActions({ slug, title }: Props) {
  return (
    <>
      {/* Invisible — records tool visit on mount */}
      <ToolVisitTracker slug={slug} />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <FavoriteButton slug={slug} />
        <ShareButton title={title} />
      </div>
    </>
  );
}
