import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DeveloperToolLayout } from "@/components/developer";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { CronClient } from "./CronClient";

const PATH = "/cron-expression-generator";
const FAQ = [
  { q: "What cron format is supported?", a: "Standard 5-field Unix cron: minute, hour, day-of-month, month, day-of-week. Quartz (6-7 field) expressions are not supported." },
  { q: "What timezone are the next runs shown in?", a: "Next run times are calculated using your browser's local timezone. The timezone name is displayed alongside the results." },
  { q: "Is my data sent to a server?", a: "No. All parsing, validation, and scheduling calculations happen locally in your browser." },
  { q: "Can I use named days or months?", a: "Currently only numeric values are supported. Use 0-7 for days (0 and 7 are Sunday) and 1-12 for months." },
];

export function generateStaticParams() { return routing.locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Cron Expression Generator & Humanizer",
    description: "Generate, validate, and humanize cron expressions. See next run times, use presets, build visually. Free browser-based tool.",
    keywords: ["cron expression generator", "cron parser", "cron humanizer", "crontab", "cron schedule"],
    alternates: buildAlternates({ locale, pathSuffix: PATH }),
    openGraph: { type: "website", title: "Cron Expression Generator & Humanizer", description: "Generate and validate cron expressions. See next run times.", url: `${publicConfig.siteUrl}/${locale}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Cron Expression Generator & Humanizer", description: "Generate and validate cron expressions. See next run times." },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <DeveloperToolLayout title="Cron Expression Generator" intro="Generate, validate, and humanize standard 5-field Unix cron expressions. Preview next run times and use common presets." breadcrumbs={[{ label: "Cron Expression Generator", href: PATH }]} faq={FAQ} currentToolPath={PATH}>
        <CronClient />
      </DeveloperToolLayout>
      <ToolSEO locale={locale} pathSuffix={PATH} toolName="Cron Expression Generator & Humanizer" toolDescription="Browser-based cron expression generator with validation, humanizer, presets, and next-run preview." faq={FAQ} breadcrumbName="Cron Expression Generator" />
    </>
  );
}
