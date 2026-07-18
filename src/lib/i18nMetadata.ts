import type { Metadata } from "next";

import { HREFLANG_MAP, routing } from "@/i18n/routing";
import { publicConfig } from "./config";

/**
 * Shared helper for building the `alternates` metadata block that every
 * localized page needs.
 *
 * `canonical` is the fully-qualified URL for the current locale, and
 * `languages` maps every supported locale (plus `x-default` ⇒ English)
 * to its URL for this same page. Emitting both is what makes hreflang
 * work correctly across all seven locales.
 */
export function buildAlternates({
  locale,
  pathSuffix,
}: {
  locale: string;
  /** Path AFTER the locale segment, e.g. "/about" or "/channel/UC…". Empty string for the homepage. */
  pathSuffix: string;
}): Metadata["alternates"] {
  const clean = pathSuffix.startsWith("/") ? pathSuffix : `/${pathSuffix}`;
  const suffix = clean === "/" ? "" : clean;

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[HREFLANG_MAP[loc]] = `${publicConfig.siteUrl}/${loc}${suffix}`;
  }
  languages["x-default"] = `${publicConfig.siteUrl}/${routing.defaultLocale}${suffix}`;

  return {
    canonical: `${publicConfig.siteUrl}/${locale}${suffix}`,
    languages,
  };
}
