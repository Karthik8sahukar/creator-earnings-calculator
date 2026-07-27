/**
 * Tool Engine — Metadata & Structured Data Helpers
 *
 * Generates Next.js Metadata and JSON-LD structured data from a tool slug.
 * All URLs are absolute, locale-aware, and use the production site origin.
 *
 * Usage:
 *   export const generateMetadata = createToolMetadata("coin-flip");
 */

import type { Metadata } from "next";
import { publicConfig } from "@/lib/config";
import { buildAlternates } from "@/lib/i18nMetadata";
import { getToolBySlug, getCategoryDef, type ToolEntry } from "@/lib/tools";

// ─── Constants ──────────────────────────────────────────────────────

/** Default social preview image (absolute URL). */
const DEFAULT_OG_IMAGE = `${publicConfig.siteUrl}/og-default.png`;
const DEFAULT_OG_IMAGE_WIDTH = 1200;
const DEFAULT_OG_IMAGE_HEIGHT = 630;
const DEFAULT_OG_IMAGE_ALT = "BeHumler — Free Online Tools";

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
  /** Custom Open Graph image URL (absolute). */
  ogImage?: string;
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
  /** Category breadcrumb (inserted between Home and tool). */
  categoryBreadcrumb?: { name: string; url: string };
}

/** Allowed max-width values for ToolLayout. */
export type ToolMaxWidth = "max-w-4xl" | "max-w-5xl" | "max-w-6xl" | "max-w-7xl" | "max-w-full";

// ─── Metadata Generator ─────────────────────────────────────────────

/**
 * Creates a generateMetadata function for a tool page.
 *
 * Produces:
 *   - title, description, keywords (never empty/undefined)
 *   - robots: index true, follow true
 *   - canonical URL (absolute, locale-aware)
 *   - hreflang alternates for all supported locales + x-default
 *   - Open Graph with absolute URL, image fallback, siteName, locale
 *   - Twitter card with image fallback
 *   - No empty strings or undefined values emitted
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
      return { title: "Tool Not Found", robots: { index: false, follow: false } };
    }

    const title = nonEmpty(overrides?.title) ?? nonEmpty(tool.seo?.title) ?? tool.title;
    const description =
      nonEmpty(overrides?.description) ?? nonEmpty(tool.seo?.description) ?? tool.description;

    // Merge keywords: overrides + seo + tags, deduplicated, no empties
    const keywords = dedupeStrings([
      ...(overrides?.keywords ?? []),
      ...(tool.seo?.keywords ?? []),
      ...tool.tags,
    ]);

    const pageUrl = `${publicConfig.siteUrl}/${locale}${tool.href}`;
    const ogImage = nonEmpty(overrides?.ogImage) ?? DEFAULT_OG_IMAGE;

    return {
      title,
      description,
      keywords: keywords.length > 0 ? keywords : undefined,
      robots: { index: true, follow: true },
      alternates: buildAlternates({ locale, pathSuffix: tool.href }),
      openGraph: {
        type: "website",
        title,
        description,
        url: pageUrl,
        siteName: publicConfig.siteName,
        locale,
        images: [
          {
            url: ogImage,
            width: ogImage === DEFAULT_OG_IMAGE ? DEFAULT_OG_IMAGE_WIDTH : undefined,
            height: ogImage === DEFAULT_OG_IMAGE ? DEFAULT_OG_IMAGE_HEIGHT : undefined,
            alt: ogImage === DEFAULT_OG_IMAGE ? DEFAULT_OG_IMAGE_ALT : title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  };
}

// ─── JSON-LD Generator ──────────────────────────────────────────────

/**
 * Generate JSON-LD structured data for a tool page.
 *
 * Emits:
 *   1. BreadcrumbList — Home → [Category] → Tool Name
 *   2. SoftwareApplication — free web tool
 *   3. FAQPage — only when valid FAQs exist (non-empty q and a)
 *
 * All output is cleaned via cleanStructuredData() to remove undefined,
 * null, empty strings, and empty arrays. JSON is safe-serialized.
 */
export function generateToolJsonLd(options: ToolJsonLdOptions): object[] {
  const tool = getToolBySlug(options.slug);
  if (!tool) return [];

  const pageUrl = `${publicConfig.siteUrl}/${options.locale}${tool.href}`;
  const homeUrl = `${publicConfig.siteUrl}/${options.locale}`;
  const breadcrumbName = nonEmpty(options.breadcrumbName) ?? tool.title;
  const applicationCategory =
    nonEmpty(options.applicationCategory) ?? "UtilitiesApplication";

  // Build BreadcrumbList
  const breadcrumbItems: object[] = [
    { "@type": "ListItem", position: 1, name: "Home", item: homeUrl },
  ];

  if (options.categoryBreadcrumb) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: options.categoryBreadcrumb.name,
      item: options.categoryBreadcrumb.url,
    });
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: breadcrumbName,
      item: pageUrl,
    });
  } else {
    // Try to add category from registry
    const catDef = getCategoryDef(tool.category);
    if (catDef) {
      const categoryUrl = `${publicConfig.siteUrl}/${options.locale}/tools/${tool.category}`;
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 2,
        name: catDef.label,
        item: categoryUrl,
      });
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 3,
        name: breadcrumbName,
        item: pageUrl,
      });
    } else {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 2,
        name: breadcrumbName,
        item: pageUrl,
      });
    }
  }

  const jsonLd: object[] = [
    cleanStructuredData({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    }),
    cleanStructuredData({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.title,
      description: tool.description,
      applicationCategory,
      operatingSystem: "Any",
      url: pageUrl,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: { "@type": "Organization", name: publicConfig.siteName },
    }),
  ];

  // Add FAQPage only when valid FAQs exist
  const validFaqs = (options.faq ?? []).filter(
    (item) => nonEmpty(item.q) !== undefined && nonEmpty(item.a) !== undefined,
  );

  if (validFaqs.length > 0) {
    jsonLd.push(
      cleanStructuredData({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: validFaqs.map((item) => ({
          "@type": "Question",
          name: item.q.trim(),
          acceptedAnswer: { "@type": "Answer", text: item.a.trim() },
        })),
      }),
    );
  }

  return jsonLd;
}

/**
 * Safely serialize JSON-LD for embedding in a <script> tag.
 * Escapes sequences that could break out of the script element.
 */
export function safeJsonLdSerialize(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

// ─── Structured Data Cleanup ────────────────────────────────────────

/**
 * Recursively remove undefined, null, empty strings, and empty arrays
 * from structured data objects. Preserves valid falsy values: false, 0.
 *
 * Does NOT remove:
 *   - false (valid boolean)
 *   - 0 (valid number)
 *   - Non-empty strings
 *   - Non-empty arrays
 *   - Objects with at least one remaining property
 */
export function cleanStructuredData<T>(value: T): T {
  if (value === null || value === undefined) return undefined as unknown as T;
  if (typeof value === "string") {
    return (value.trim() === "" ? undefined : value) as unknown as T;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => cleanStructuredData(item))
      .filter((item) => item !== undefined && item !== null);
    return (cleaned.length === 0 ? undefined : cleaned) as unknown as T;
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    let hasKeys = false;
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = cleanStructuredData(val);
      if (cleaned !== undefined && cleaned !== null) {
        result[key] = cleaned;
        hasKeys = true;
      }
    }
    return (hasKeys ? result : undefined) as unknown as T;
  }
  return value;
}

// ─── Utility Functions ──────────────────────────────────────────────

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
 */
export function getToolMaxWidth(tool: ToolEntry): ToolMaxWidth {
  switch (tool.category) {
    case "developer-tools":
    case "converters":
      return "max-w-5xl";
    default:
      return "max-w-4xl";
  }
}

/** Return string if non-empty after trimming, undefined otherwise. */
function nonEmpty(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Deduplicate strings, filter empties, preserve order. */
function dedupeStrings(arr: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const s of arr) {
    const trimmed = s.trim().toLowerCase();
    if (trimmed.length > 0 && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(s.trim());
    }
  }
  return result;
}
