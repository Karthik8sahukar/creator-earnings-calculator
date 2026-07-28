/**
 * Shared metadata generator for all new tools.
 *
 * Produces Next.js Metadata + JSON-LD for any tool page.
 */

import type { Metadata } from "next";
import type { ToolMeta } from "./types";
import { publicConfig } from "@/lib/config";

export function generateToolPageMetadata(tool: ToolMeta): Metadata {
  const pageUrl = `${publicConfig.siteUrl}${tool.href}`;
  const fullTitle = `${tool.title} — Free Online Tool`;

  return {
    title: fullTitle,
    description: tool.longDescription,
    keywords: tool.keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      title: fullTitle,
      description: tool.longDescription,
      url: pageUrl,
      siteName: publicConfig.siteName,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: tool.description,
    },
  };
}

export function generateToolPageJsonLd(tool: ToolMeta): object[] {
  const pageUrl = `${publicConfig.siteUrl}${tool.href}`;

  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: publicConfig.siteUrl },
        { "@type": "ListItem", position: 2, name: tool.title, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.title,
      description: tool.longDescription,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      url: pageUrl,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ];

  const validFaqs = tool.faq.filter((f) => f.q.trim() && f.a.trim());
  if (validFaqs.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: validFaqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return jsonLd;
}
