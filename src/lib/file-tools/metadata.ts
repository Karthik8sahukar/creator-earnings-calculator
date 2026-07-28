/**
 * SEO metadata generator for PDF tools.
 *
 * Each tool page gets: title, description, canonical, OG, Twitter,
 * JSON-LD (BreadcrumbList + SoftwareApplication + FAQPage).
 */

import type { Metadata } from "next";
import type { PdfToolDef } from "./types";
import { publicConfig } from "@/lib/config";

/**
 * Generate Next.js Metadata for a PDF tool page.
 */
export function generatePdfToolMetadata(tool: PdfToolDef): Metadata {
  const pageUrl = `${publicConfig.siteUrl}${tool.href}`;

  return {
    title: `${tool.title} — Free Online PDF Tool`,
    description: tool.longDescription,
    keywords: tool.keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      title: `${tool.title} — Free Online PDF Tool`,
      description: tool.longDescription,
      url: pageUrl,
      siteName: publicConfig.siteName,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.title} — Free Online PDF Tool`,
      description: tool.description,
    },
  };
}

/**
 * Generate JSON-LD structured data for a PDF tool page.
 */
export function generatePdfToolJsonLd(tool: PdfToolDef): object[] {
  const pageUrl = `${publicConfig.siteUrl}${tool.href}`;
  const homeUrl = publicConfig.siteUrl;

  const jsonLd: object[] = [
    // BreadcrumbList
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: homeUrl },
        { "@type": "ListItem", position: 2, name: "PDF Tools", item: `${homeUrl}/tools` },
        { "@type": "ListItem", position: 3, name: tool.title, item: pageUrl },
      ],
    },
    // SoftwareApplication
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.title,
      description: tool.longDescription,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      url: pageUrl,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: { "@type": "Organization", name: publicConfig.siteName },
    },
  ];

  // FAQPage
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
