import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { MerchCalcClient } from "./MerchCalcClient";

const PATH = "/youtube-merch-calculator";
const FAQ = [
  { q: "What is a typical merch conversion rate?", a: "Most YouTube creators see 0.5-2% of their monthly viewers purchase merch. Highly engaged communities and creators who actively promote merch in videos can reach 3-5%." },
  { q: "What profit margin should I expect?", a: "Print-on-demand services (like Printful, Teespring) offer 20-40% margin. Self-fulfilled merch with bulk ordering can reach 50-70% margin but requires upfront investment and fulfillment logistics." },
  { q: "When should I launch merch?", a: "Most creators find success launching merch after 50,000-100,000 subscribers when they have a strong enough brand identity. Start with 2-3 core products rather than a large catalog." },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "YouTube Merch Revenue Calculator — Free Tool";
  const description = "Estimate your potential YouTube merchandise revenue based on monthly views, conversion rate, average order value, and profit margin.";
  return {
    title,
    description,
    alternates: buildAlternates({ locale, pathSuffix: PATH }),
    openGraph: { title, description, url: `/${locale}${PATH}` },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <SimpleCalcLayout
        eyebrow="Calculator · Merch"
        title="YouTube Merch Revenue Calculator"
        intro="Estimate revenue from selling merchandise to your YouTube audience. Merch typically converts 0.5-2% of viewers, depending on how well the products align with your brand and audience."
        breadcrumbs={[{ label: "Merch calculator", href: PATH }]}
        faq={FAQ}
      >
        <MerchCalcClient />
      </SimpleCalcLayout>
      <ToolSEO locale={locale} pathSuffix={PATH} toolName="YouTube Merch Revenue Calculator" toolDescription="Estimate YouTube merchandise revenue based on views, conversion rate, and profit margin." applicationCategory="FinanceApplication" faq={FAQ} breadcrumbName="Merch Calculator" />
    </>
  );
}
