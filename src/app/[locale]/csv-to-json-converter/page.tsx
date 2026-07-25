import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DeveloperToolLayout } from "@/components/developer";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { CsvToJsonClient } from "./CsvToJsonClient";

const PATH = "/csv-to-json-converter";
const FAQ = [
  { q: "What delimiters are supported?", a: "Comma, semicolon, tab, and pipe delimiters are supported. Auto-detect analyzes the first line to pick the most likely delimiter." },
  { q: "How do nested keys work?", a: "When enabled, column headers with dots (e.g., address.city) create nested JSON objects. The key 'address.city' becomes { address: { city: value } }." },
  { q: "Is there prototype pollution protection?", a: "Yes. Keys like __proto__, prototype, and constructor are rejected during nested key expansion to prevent prototype pollution attacks." },
  { q: "Is my data sent to a server?", a: "No. All CSV parsing happens locally in your browser. No data leaves your device." },
];

export function generateStaticParams() { return routing.locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "CSV to JSON Converter",
    description: "Convert CSV data to JSON locally in your browser. Supports auto-detect delimiters, type inference, nested keys, and prototype pollution protection.",
    keywords: ["csv to json", "csv converter", "csv parser", "data converter", "csv json online"],
    alternates: buildAlternates({ locale, pathSuffix: PATH }),
    openGraph: { type: "website", title: "CSV to JSON Converter", description: "Convert CSV to JSON locally with delimiter auto-detection.", url: `${publicConfig.siteUrl}/${locale}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "CSV to JSON Converter", description: "Convert CSV to JSON locally with delimiter auto-detection." },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <DeveloperToolLayout title="CSV to JSON Converter" intro="Parse CSV data into structured JSON with support for multiple delimiters, type inference, nested keys via dot notation, and prototype pollution protection." breadcrumbs={[{ label: "CSV to JSON", href: PATH }]} faq={FAQ} currentToolPath={PATH}>
        <CsvToJsonClient />
      </DeveloperToolLayout>
      <ToolSEO locale={locale} pathSuffix={PATH} toolName="CSV to JSON Converter" toolDescription="Browser-based CSV to JSON converter with nested key support and type inference." faq={FAQ} breadcrumbName="CSV to JSON Converter" />
    </>
  );
}
