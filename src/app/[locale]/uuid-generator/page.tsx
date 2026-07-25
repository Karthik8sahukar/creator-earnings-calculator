import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DeveloperToolLayout } from "@/components/developer";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { UuidGeneratorClient } from "./UuidGeneratorClient";

const PATH = "/uuid-generator";
const FAQ = [
  { q: "Is crypto.randomUUID() used?", a: "Yes. This tool uses the Web Crypto API (crypto.randomUUID or crypto.getRandomValues) for cryptographically secure random generation. Math.random is never used." },
  { q: "What UUID version is generated?", a: "UUID version 4 (random). This is the most widely used version for generating unique identifiers without coordination." },
  { q: "Are the UUIDs generated on the server?", a: "No. All UUIDs are generated locally in your browser. Nothing is sent to any server." },
  { q: "Can I validate an existing UUID?", a: "Yes. Use the validator section at the bottom to check if a string is a valid UUID and identify its version." },
];

export function generateStaticParams() { return routing.locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "UUID Generator – Generate Secure UUID v4",
    description: "Generate cryptographically secure UUID v4 identifiers in your browser. Bulk generate, copy, download. No server involved.",
    keywords: ["uuid generator", "uuid v4", "generate uuid", "random uuid", "guid generator"],
    alternates: buildAlternates({ locale, pathSuffix: PATH }),
    openGraph: { type: "website", title: "UUID Generator – Generate Secure UUID v4", description: "Generate secure UUID v4 identifiers locally. Bulk generate and download.", url: `${publicConfig.siteUrl}/${locale}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "UUID Generator – Generate Secure UUID v4", description: "Generate secure UUID v4 identifiers locally. Bulk generate and download." },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <DeveloperToolLayout title="UUID Generator" intro="Generate cryptographically secure UUID v4 identifiers in your browser. Bulk generate, format, copy, or download. No data sent anywhere." breadcrumbs={[{ label: "UUID Generator", href: PATH }]} faq={FAQ} currentToolPath={PATH}>
        <UuidGeneratorClient />
      </DeveloperToolLayout>
      <ToolSEO locale={locale} pathSuffix={PATH} toolName="UUID Generator" toolDescription="Browser-based UUID v4 generator with bulk generation, formatting options, and validator." faq={FAQ} breadcrumbName="UUID Generator" />
    </>
  );
}
