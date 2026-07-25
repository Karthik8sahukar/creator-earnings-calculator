import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DeveloperToolLayout } from "@/components/developer";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { JsonFormatterClient } from "./JsonFormatterClient";

const PATH = "/json-formatter";
const FAQ = [
  { q: "Is my JSON sent to a server?", a: "No. All formatting and validation happens locally in your browser. Your data never leaves your device." },
  { q: "What indentation options are available?", a: "You can choose 2 spaces, 4 spaces, or tabs. You can also sort object keys alphabetically." },
  { q: "Does this use eval()?", a: "No. We use JSON.parse() and JSON.stringify() exclusively, which are safe standard APIs." },
  { q: "What happens with invalid JSON?", a: "The validator shows the error message with approximate line and column position to help you find the issue." },
];

export function generateStaticParams() { return routing.locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "JSON Formatter & Validator Online",
    description: "Beautify, minify, and validate JSON online. Sort keys, choose indentation, download results. Free browser-based tool, no data uploaded.",
    keywords: ["json formatter", "json beautifier", "json validator", "json minifier", "format json online"],
    alternates: buildAlternates({ locale, pathSuffix: PATH }),
    openGraph: { type: "website", title: "JSON Formatter & Validator Online", description: "Beautify, minify, and validate JSON. Browser-based, free.", url: `${publicConfig.siteUrl}/${locale}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "JSON Formatter & Validator Online", description: "Beautify, minify, and validate JSON. Browser-based, free." },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <DeveloperToolLayout title="JSON Formatter" intro="Beautify, minify, and validate JSON with customizable indentation. All processing happens in your browser." breadcrumbs={[{ label: "JSON Formatter", href: PATH }]} faq={FAQ} currentToolPath={PATH}>
        <JsonFormatterClient />
      </DeveloperToolLayout>
      <ToolSEO locale={locale} pathSuffix={PATH} toolName="JSON Formatter & Validator" toolDescription="Browser-based JSON formatter, minifier, and validator with sorting and statistics." faq={FAQ} breadcrumbName="JSON Formatter" />
    </>
  );
}
