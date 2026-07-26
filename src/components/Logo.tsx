"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { LogoMark } from "./icons";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  /** Visual size of the mark + wordmark. Defaults to `md`. */
  size?: LogoSize;
  /** Show the "Free Online Tools" tagline below the wordmark. */
  withTagline?: boolean;
  /**
   * When true, renders as a plain block instead of a Link. Useful when
   * the Logo is already inside a nav that provides its own home link
   * (e.g. inside the mobile menu sheet's own close-on-click wrapper).
   */
  asStatic?: boolean;
  className?: string;
}

/**
 * BeHumler logo component.
 *
 * Visual behaviour:
 *   - Attempts to render the /behumler-logo.png asset via <Image />.
 *   - If the image 404s or fails to decode, falls back to the built-in
 *     LogoMark SVG so we never show a broken image tile.
 *   - Wordmark and optional tagline are pure text — never depend on
 *     the raster asset — so branding renders correctly even if the
 *     PNG is missing entirely.
 *
 * The wordmark is intentionally a hardcoded string ("BeHumler") and
 * NOT sourced from publicConfig.siteName, because publicConfig.siteName
 * remains "YouTube Money Calculator" for SEO/metadata purposes.
 */
export function Logo({
  size = "md",
  withTagline = false,
  asStatic = false,
  className = "",
}: LogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const dims = SIZES[size];

  const content = (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
    >
      {imgFailed ? (
        <LogoMark
          width={dims.markPx}
          height={dims.markPx}
          className="shrink-0"
        />
      ) : (
        <Image
          src="/behumler-logo.png"
          alt=""
          width={dims.markPx}
          height={dims.markPx}
          priority
          className="shrink-0 object-contain"
          style={{ height: dims.markPx, width: "auto" }}
          onError={() => setImgFailed(true)}
        />
      )}

      <span className="flex flex-col leading-none">
        <span
          className={`font-semibold tracking-tight text-slate-900 dark:text-slate-50 ${dims.wordmarkCls}`}
        >
          BeHumler
        </span>
        {withTagline && (
          <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Free Online Tools
          </span>
        )}
      </span>
    </span>
  );

  if (asStatic) return content;

  return (
    <Link
      href="/"
      className="inline-flex items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
      aria-label="BeHumler — home"
    >
      {content}
    </Link>
  );
}

const SIZES: Record<
  LogoSize,
  { markPx: number; wordmarkCls: string }
> = {
  sm: { markPx: 28, wordmarkCls: "text-base" },
  md: { markPx: 36, wordmarkCls: "text-lg" },
  lg: { markPx: 44, wordmarkCls: "text-xl" },
};
