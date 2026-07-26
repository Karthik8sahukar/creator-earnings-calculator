/**
 * Tool Engine — Metadata Helpers
 *
 * Generates Next.js Metadata and JSON-LD structured data from a tool slug.
 * Eliminates repetitive generateMetadata() boilerplate in every tool page.
 *
 * Usage:
 *   // In page.tsx:
 *   export const generateMetadata = createToolMetadata("coin-flip");
 *
 *   // Or with overrides:
 *   export const generateMetadata = createToolMetadata("coin-flip", {
 *     title: "Coin Flip — Free Online Heads or Tails",
 *     description: "Custom description...",
 *   });
 */

import type { Metadata } from "next";
import { publicConfig } from "@/lib/config";
import { buildAlternates } from "@/lib/i18nMetadata";
import { getToolBySlug, getCategoryDef, type ToolEntry } from "@/lib/tools";

// ─── Types ──────────────────────────────────────────────────────────

export interface FaqItem {
  q: string;
  a: string;
}

export interface ToolMetadataOverrides {
  /** Override the meta title (default: tool.title from registry). */
  title?: string;
  /** Override the meta description (default: tool.description from registry). */
  description?: string;
  /** Additional keywords beyond the tool's tags. */
  keywords?: string[];
  /** Application category for JSON-LD (default: "UtilitiesApplication"). */
  applicationCategory?: string;
}

export interface ToolJsonLdOptions {
  locale: string;
  /** Tool slug from the registry. */
  slug: string;
  /** FAQ items for FAQPage schema. */
  faq?: FaqItem[];
  /** Override the breadcrumb name. */
  breadcrumbName?: string;
  /** Application category for SoftwareApplication schema. */
  applicationCategory?: string;
}

// ─── Metadata Generator ─────────────────────────────────────────────

/**
 * Creates a generateMetadata function for a tool page.
 *
 * Resolves the tool from the registry and generates complete Next.js
 * Metadata including title, description, keywords, alternates,
 * openGraph, and twitter cards.
 *
 * @param slug - Tool slug from the registry.
 * @param overrides - Optional title/description/keywords overrides.
 * @returns An async function compatible with Next.js generateMetadata export.
 */
export function createToolMetadata(
  slug: string,
  overrides?: ToolMetadataOverrides,
) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const tool = getToolBySlug(slug);

    if (!tool) {
      return { title: "Tool Not Found" };
    }

    const title = overrides?.title ?? tool.seo?.title ?? tool.title;
    const description =
      overrides?.description ?? tool.seo?.description ?? tool.description;
    const keywords = [
      ...(overrides?.keywords ?? []),
      ...(tool.seo?.keywords ?? []),
      ...tool.tags,
    ];

    return {
      title,
      description,
      keywords,
      alternates: buildAlternates({ locale, pathSuffix: tool.href }),
      openGraph: {
        type: "website",
        title,
        description,
        url: `${publicConfig.siteUrl}/${locale}${tool.href}`,
        siteName: publicConfig.siteName,
        locale,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  };
}

// ─── JSON-LD Generator ──────────────────────────────────────────────

/**
 * Generate JSON-LD structured data for a tool page.
 *
 * Emits three schemas:
 *   1. BreadcrumbList — Home → Tool Name
 *   2. SoftwareApplication — free web app metadata
 *   3. FAQPage — if FAQ items are provided
 *
 * @returns Array of JSON-LD objects ready for serialization.
 */
export function generateToolJsonLd(options: ToolJsonLdOptions): object[] {
  const tool = getToolBySlug(options.slug);
  if (!tool) return [];

  const pageUrl = `${publicConfig.siteUrl}/${options.locale}${tool.href}`;
  const breadcrumbName = options.breadcrumbName ?? tool.title;
  const applicationCategory =
    options.applicationCategory ?? "UtilitiesApplication";

  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${publicConfig.siteUrl}/${options.locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: breadcrumbName,
          item: pageUrl,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.title,
      description: tool.description,
      applicationCategory,
      operatingSystem: "Web",
      url: pageUrl,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: { "@type": "Organization", name: publicConfig.siteName },
    },
  ];

  // Add FAQPage schema if FAQ items exist
  if (options.faq && options.faq.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: options.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
  }

  return jsonLd;
}

/**
 * Resolve a tool's category label for use as an eyebrow badge.
 */
export function getToolEyebrow(slug: string): string {
  const tool = getToolBySlug(slug);
  if (!tool) return "Tool";
  const cat = getCategoryDef(tool.category);
  return cat?.label ?? "Tool";
}

/**
 * Resolve a tool's max-width class based on category.
 * Developer tools get wider layouts; calculators stay narrow.
 */
export function getToolMaxWidth(tool: ToolEntry): string {
  switch (tool.category) {
    case "developer-tools":
    case "converters":
      return "max-w-5xl";
    default:
      return "max-w-4xl";
  }
}
