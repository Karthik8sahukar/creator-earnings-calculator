import type { MetadataRoute } from "next";

import { HREFLANG_MAP, routing } from "@/i18n/routing";
import { publicConfig } from "@/lib/config";

/**
 * Sitemap.
 *
 * Emits one entry per (locale × path) pair, plus per-entry
 * `alternates.languages` so search engines can discover every
 * translation of every page — including an `x-default` pointer to the
 * canonical English URL.
 *
 * `/channel/[channelId]` is not included: it's a per-channel dynamic
 * page indexed by direct link, not by sitemap enumeration.
 * `/api/*`, `/robots.txt`, and `/sitemap.xml` are never localized.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicConfig.siteUrl;
  const now = new Date();
  const routes = [
    "",
    "/methodology",
    "/disclaimer",
    "/privacy",
    "/terms",
    "/about",
    "/youtube-rpm-calculator",
    "/youtube-cpm-calculator",
    "/youtube-shorts-calculator",
    "/youtube-sponsorship-calculator",
  ];

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    for (const path of routes) {
      const url = `${base}/${locale}${path}`;
      const languages: Record<string, string> = {};
      for (const loc of routing.locales) {
        languages[HREFLANG_MAP[loc]] = `${base}/${loc}${path}`;
      }
      languages["x-default"] = `${base}/${routing.defaultLocale}${path}`;

      entries.push({
        url,
        lastModified: now,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : 0.6,
        alternates: { languages },
      });
    }
  }
  return entries;
}
