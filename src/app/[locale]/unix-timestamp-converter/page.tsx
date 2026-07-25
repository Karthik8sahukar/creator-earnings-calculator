import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DeveloperToolLayout } from "@/components/developer";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { TimestampClient } from "./TimestampClient";

const PATH = "/unix-timestamp-converter";
const FAQ = [
  { q: "How is seconds vs milliseconds detected?", a: "Values greater than 1 trillion are treated as milliseconds (since they represent dates after ~2001). Otherwise they are treated as seconds. You can override the detection." },
  { q: "What timezone is used for display?", a: "Your browser's local timezone is shown alongside UTC. The timezone name is displayed so you know exactly which zone applies." },
  { q: "Is my data sent to a server?", a: "No. All timestamp conversions happen locally in your browser. No data leaves your device." },
  { q: "Can I convert a date back to a Unix timestamp?", a: "Yes. Use the date-to-timestamp section to pick a date and get the corresponding Unix timestamp in both seconds and milliseconds." },
];

export function generateStaticParams() { return routing.locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Unix Timestamp Converter",
    description: "Convert Unix timestamps to human-readable dates and vice versa. Auto-detects seconds vs milliseconds. Shows UTC, local time, ISO 8601, and relative time.",
    keywords: ["unix timestamp converter", "epoch converter", "timestamp to date", "date to timestamp", "unix time"],
    alternates: buildAlternates({ locale, pathSuffix: PATH }),
    openGraph: { type: "website", title: "Unix Timestamp Converter", description: "Convert Unix timestamps to dates. Auto-detects seconds vs milliseconds.", url: `${publicConfig.siteUrl}/${locale}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Unix Timestamp Converter", description: "Convert Unix timestamps to dates. Auto-detects seconds vs milliseconds." },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <DeveloperToolLayout title="Unix Timestamp Converter" intro="Convert Unix timestamps to human-readable dates and back. Auto-detects seconds vs milliseconds, shows multiple formats including relative time." breadcrumbs={[{ label: "Unix Timestamp Converter", href: PATH }]} faq={FAQ} currentToolPath={PATH}>
        <TimestampClient />
      </DeveloperToolLayout>
      <ToolSEO locale={locale} pathSuffix={PATH} toolName="Unix Timestamp Converter" toolDescription="Browser-based Unix timestamp converter with auto-detection, multiple formats, and live current time display." faq={FAQ} breadcrumbName="Unix Timestamp Converter" />
    </>
  );
}
