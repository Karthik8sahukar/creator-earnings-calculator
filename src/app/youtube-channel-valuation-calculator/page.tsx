import type { Metadata } from "next";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { ValuationCalcClient } from "./ValuationCalcClient";

const PATH = "/youtube-channel-valuation-calculator";
const FAQ = [
  { q: "How are YouTube channels valued?", a: "YouTube channels are typically valued at 2-5× annual revenue. The multiple depends on growth rate, niche stability, audience loyalty, content evergreen-ness, and how dependent the channel is on a single personality." },
  { q: "What affects the revenue multiple?", a: "Higher multiples (4-5×) go to channels with: steady growth, evergreen content, diversified revenue, large engaged audiences, and low personality-dependence. Lower multiples (2-3×) apply to declining or personality-dependent channels." },
  { q: "Can you actually sell a YouTube channel?", a: "Yes. YouTube channels are bought and sold on marketplaces like Flippa, Empire Flippers, and through private brokers. Prices range from a few thousand to millions of dollars for large channels." },
];

export async function generateMetadata(): Promise<Metadata> {
  const title = "YouTube Channel Valuation Calculator — Free Tool";
  const description = "Estimate the market value of a YouTube channel based on monthly revenue, subscriber count, views, and growth rate. Based on real marketplace multiples.";
  return {
    title,
    description,
    alternates: buildAlternates({ pathSuffix: PATH }),
    openGraph: { title, description, url: `${PATH}` },
  };
}

export default async function Page() {
  return (
    <>
      <SimpleCalcLayout
        eyebrow="Calculator · Valuation"
        title="YouTube Channel Valuation Calculator"
        intro="Estimate the market value of a YouTube channel. Channel valuations are typically based on a multiple of annual revenue, adjusted for growth rate, audience size, and niche stability. Real transactions happen on platforms like Flippa and Empire Flippers."
        breadcrumbs={[{ label: "Channel valuation", href: PATH }]}
        faq={FAQ}
      >
        <ValuationCalcClient />
      </SimpleCalcLayout>
      <ToolSEO pathSuffix={PATH} toolName="YouTube Channel Valuation Calculator" toolDescription="Estimate the market value of a YouTube channel based on revenue, subscribers, and growth rate." applicationCategory="FinanceApplication" faq={FAQ} breadcrumbName="Channel Valuation Calculator" />
    </>
  );
}
