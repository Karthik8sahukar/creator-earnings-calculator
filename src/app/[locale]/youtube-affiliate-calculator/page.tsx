import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { buildAlternates } from "@/lib/i18nMetadata";
import { AffiliateCalcClient } from "./AffiliateCalcClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "YouTube Affiliate Revenue Calculator — Free Tool";
  const description = "Estimate your potential YouTube affiliate marketing revenue based on views, click-through rate, conversion rate, average order value, and commission percentage.";
  return {
    title,
    description,
    alternates: buildAlternates({ locale, pathSuffix: "/youtube-affiliate-calculator" }),
    openGraph: { title, description, url: `/${locale}/youtube-affiliate-calculator` },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SimpleCalcLayout
      eyebrow="Calculator · Affiliate"
      title="YouTube Affiliate Revenue Calculator"
      intro="Estimate your potential YouTube affiliate marketing revenue. Affiliate income is a funnel: views → clicks → conversions → commission. This calculator models each step so you can see where to optimize."
      breadcrumbs={[{ label: "Affiliate calculator", href: "/youtube-affiliate-calculator" }]}
      faq={[
        { q: "What is a typical YouTube affiliate click-through rate?", a: "Most YouTube creators see a 2-5% click-through rate on affiliate links in descriptions. Dedicated review videos can reach 8-15% because the viewer intent is already purchase-oriented." },
        { q: "What commission rates are typical?", a: "Amazon Associates pays 1-10% depending on category. Digital products (courses, software) typically pay 20-50%. High-ticket items may offer flat-rate commissions of $50-$500+ per sale." },
        { q: "How can I increase affiliate revenue?", a: "Focus on purchase-intent content (reviews, comparisons, tutorials), place links prominently in descriptions and pinned comments, and choose products with recurring commissions or high average order values." },
      ]}
    >
      <AffiliateCalcClient />
    </SimpleCalcLayout>
  );
}
