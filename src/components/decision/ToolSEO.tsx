import Script from "next/script";
import { publicConfig } from "@/lib/config";

interface FaqItem {
  q: string;
  a: string;
}

interface Props {
  pathSuffix: string;
  toolName: string;
  toolDescription: string;
  applicationCategory?: string;
  faq: FaqItem[];
  breadcrumbName: string;
}

/**
 * Shared JSON-LD structured data component for Decision Tools.
 * Emits BreadcrumbList + SoftwareApplication + FAQPage schemas.
 */
export function ToolSEO({
  pathSuffix,
  toolName,
  toolDescription,
  applicationCategory = "UtilitiesApplication",
  faq,
  breadcrumbName,
}: Props) {
  const pageUrl = `${publicConfig.siteUrl}${pathSuffix}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${publicConfig.siteUrl}` },
        { "@type": "ListItem", position: 2, name: breadcrumbName, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: toolName,
      description: toolDescription,
      applicationCategory,
      operatingSystem: "Web",
      url: pageUrl,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: { "@type": "Organization", name: publicConfig.siteName },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <Script
      id={`${pathSuffix.replace(/\//g, "-")}-ld`}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
