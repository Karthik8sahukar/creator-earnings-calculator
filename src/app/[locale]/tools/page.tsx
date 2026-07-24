import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { ToolsDirectory } from "./ToolsDirectory";

const PATH_SUFFIX = "/tools";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "All Tools — Free Creator & Decision Tools",
    description:
      "Browse all BeHumler tools: YouTube calculators, Instagram earnings, Twitch Bits converter, dice roller, coin flip, random generators and more. Free, no login.",
    alternates: buildAlternates({ locale, pathSuffix: PATH_SUFFIX }),
    openGraph: {
      type: "website",
      title: "All Tools — Free Creator & Decision Tools",
      description: "Browse all BeHumler tools by category.",
      url: `/${locale}${PATH_SUFFIX}`,
      siteName: publicConfig.siteName,
      locale,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          All Tools
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Every calculator, estimator and interactive tool on BeHumler — grouped by category.
        </p>
      </header>
      <ToolsDirectory />
    </div>
  );
}
