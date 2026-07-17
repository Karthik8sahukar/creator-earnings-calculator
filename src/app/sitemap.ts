import type { MetadataRoute } from "next";

import { publicConfig } from "@/lib/config";

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
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
