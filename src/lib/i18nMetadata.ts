import type { Metadata } from "next";

import { publicConfig } from "./config";

/**
 * Build the `alternates` metadata block for a page.
 *
 * Since the app is now English-only, this simply returns a canonical URL
 * without any hreflang alternates.
 */
export function buildAlternates({
  pathSuffix,
}: {
  /** Kept for backward compatibility but ignored. */
  locale?: string;
  /** Path after the domain, e.g. "/about" or "/channel/UC…". */
  pathSuffix: string;
}): Metadata["alternates"] {
  const clean = pathSuffix.startsWith("/") ? pathSuffix : `/${pathSuffix}`;
  const suffix = clean === "/" ? "" : clean;

  return {
    canonical: `${publicConfig.siteUrl}${suffix}`,
  };
}
