import { generateToolJsonLd, type FaqItem } from "@/lib/engine/metadata";

interface Props {
  /** Tool slug from the registry. */
  slug: string;
  /** Current locale for URL generation. */
  locale: string;
  /** FAQ items for FAQPage schema. */
  faq?: FaqItem[];
  /** Override the breadcrumb display name. */
  breadcrumbName?: string;
  /** Application category for SoftwareApplication schema. */
  applicationCategory?: string;
}

/**
 * ToolJsonLd — Server component that emits JSON-LD structured data.
 *
 * Automatically generates:
 *   - BreadcrumbList (Home → Tool)
 *   - SoftwareApplication (free web tool metadata)
 *   - FAQPage (if FAQ items provided)
 *
 * Usage:
 *   <ToolJsonLd slug="coin-flip" locale={locale} faq={FAQ} />
 */
export function ToolJsonLd({
  slug,
  locale,
  faq,
  breadcrumbName,
  applicationCategory,
}: Props) {
  const jsonLd = generateToolJsonLd({
    slug,
    locale,
    faq,
    breadcrumbName,
    applicationCategory,
  });

  if (jsonLd.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
