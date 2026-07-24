import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { buildAlternates } from "@/lib/i18nMetadata";
import { AdSenseCalcClient } from "./AdSenseCalcClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "YouTube AdSense Revenue Calculator — Free Tool";
  const description = "Estimate your YouTube AdSense revenue from monthly views, RPM, and monetization percentage. See daily, weekly, monthly, and yearly earnings projections.";
  return {
    title,
    description,
    alternates: buildAlternates({ locale, pathSuffix: "/youtube-adsense-calculator" }),
    openGraph: { title, description, url: `/${locale}/youtube-adsense-calculator` },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SimpleCalcLayout
      eyebrow="Calculator · AdSense"
      title="YouTube AdSense Revenue Calculator"
      intro="Estimate your YouTube AdSense revenue using your RPM (revenue per 1,000 views) and monthly view count. This uses the same formula as YouTube Studio but lets you project with custom inputs."
      breadcrumbs={[{ label: "AdSense calculator", href: "/youtube-adsense-calculator" }]}
      faq={[
        { q: "What is YouTube AdSense?", a: "YouTube AdSense is the ad monetization system that pays creators for displaying ads on their videos. Revenue comes from pre-roll, mid-roll, display, and overlay ads served to viewers." },
        { q: "How is AdSense revenue calculated?", a: "AdSense Revenue = (monthly views ÷ 1,000) × RPM × (monetized% ÷ 90). RPM is your revenue per 1,000 total views as shown in YouTube Studio. The monetization adjustment accounts for channels that monetize above or below the typical 90%." },
        { q: "What is a good YouTube RPM?", a: "RPM varies widely by country and niche. US finance channels can see $10-25 RPM. General US content sees $3-8. India and Southeast Asia typically see $0.5-2. The global average is approximately $2-4." },
      ]}
    >
      <AdSenseCalcClient />
    </SimpleCalcLayout>
  );
}
