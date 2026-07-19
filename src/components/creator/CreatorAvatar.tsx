"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  /**
   * Absolute avatar URL — usually a `yt3.ggpht.com` or
   * `yt3.googleusercontent.com` URL from the YouTube Data API.
   *
   * Pass `null`, `undefined`, or `""` to skip the network image and
   * render the initial fallback immediately.
   */
  src: string | null | undefined;
  /**
   * Accessible alt text — usually the creator's display name. Kept
   * required so we don't accidentally emit empty `alt=""` and lose
   * screen-reader context on a card whose only text is the display
   * name below.
   */
  alt: string;
  /**
   * Single-character fallback rendered when there is no `src`, or
   * when the browser fails to load the URL (deleted image, CORS,
   * DNS blip, etc.). Typically `displayName.charAt(0)`.
   */
  initial: string;
  /**
   * Optional extra classes for the outer circular container. Sizing
   * is handled internally — do NOT pass width / height here.
   */
  className?: string;
}

/**
 * Creator profile picture with graceful client-side fallback.
 *
 * Sizing (per spec):
 *   - 40px on mobile   (`h-10 w-10`)
 *   - 48px on tablet   (`sm:h-12 sm:w-12`)
 *   - 56px on desktop  (`lg:h-14 lg:w-14`)
 *
 * The Image uses `fill` inside a fixed-size circular container so
 * there is zero layout shift once the image resolves — the space
 * is already reserved by Tailwind at render time.
 *
 * We pass `unoptimized` because YouTube's channel-avatar CDN
 * (`yt3.ggpht.com`) is already highly cached and small, and we
 * want to avoid a second round-trip through the Vercel Image
 * Optimizer for what is effectively a favicon-sized asset. This
 * matches the existing `<CreatorHero/>` and `<ProfileCard/>`
 * treatment for consistency.
 *
 * Fallback rules:
 *   - No src provided             → render initial.
 *   - Image `onError`             → render initial.
 *   - Otherwise                    → render the image; on hydrate,
 *     Next's lazy loading kicks in and only fetches when the image
 *     is near the viewport (default browser behavior for `<Image>`
 *     without `priority`).
 */
export function CreatorAvatar({ src, alt, initial, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(src && src.trim().length > 0) && !failed;

  const wrapperClasses = [
    "relative shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200 dark:ring-slate-800",
    // Sizing: mobile 40 → tablet 48 → desktop 56.
    "h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (!hasImage) {
    return (
      <div
        aria-hidden
        className={`${wrapperClasses} bg-gradient-to-br from-brand-100 to-accent-400/30 dark:from-brand-500/30 dark:to-accent-500/20 flex items-center justify-center text-base sm:text-lg font-bold text-brand-700 dark:text-brand-100`}
      >
        {initial}
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      <Image
        src={src as string}
        alt={alt}
        fill
        // Match the responsive box dimensions so Next requests the
        // right source; skipped anyway because `unoptimized` is on,
        // but it's the right hint for the srcset the browser sees.
        sizes="(min-width: 1024px) 56px, (min-width: 640px) 48px, 40px"
        className="object-cover"
        // The card grid is below the fold on /creators for anything
        // past ~row 3 — let the browser lazy-load.
        loading="lazy"
        unoptimized
        onError={() => setFailed(true)}
      />
    </div>
  );
}
