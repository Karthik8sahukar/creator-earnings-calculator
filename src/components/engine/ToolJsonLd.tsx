import { generateToolJsonLd, safeJsonLdSerialize, type FaqItem } from "@/lib/engine/metadata";

interface Props {
  /** Tool slug from the registry. */
  slug: string;
  /** FAQ items for FAQPage schema. */
  faq?: FaqItem[];
  /** Override the breadcrumb display name. */
  breadcrumbName?: string;
  /** Application category for SoftwareApplication schema. */
  applicationCategory?: string;
  /** Optional category breadcrumb. */
  categoryBreadcrumb?: { name: string; url: string };
}

/**
 * ToolJsonLd — Server component that emits JSON-LD structured data.
 *
 * Automatically generates:
 *   - BreadcrumbList (Home → Category → Tool)
 *   - SoftwareApplication (free web tool metadata)
 *   - FAQPage (only when valid FAQs exist)
 *
 * Uses safe serialization to prevent script tag injection.
 */
export function ToolJsonLd({
  slug,
  faq,
  breadcrumbName,
  applicationCategory,
  categoryBreadcrumb,
}: Props) {
  const jsonLd = generateToolJsonLd({
    slug,
    faq,
    breadcrumbName,
    applicationCategory,
    categoryBreadcrumb,
  });

  if (jsonLd.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdSerialize(jsonLd) }}
    />
  );
}
