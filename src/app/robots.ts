import type { MetadataRoute } from "next";
import { publicConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${publicConfig.siteUrl}/sitemap.xml`,
    host: publicConfig.siteUrl,
  };
}
