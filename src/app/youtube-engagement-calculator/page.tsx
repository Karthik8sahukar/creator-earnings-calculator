import type { Metadata } from "next";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { EngagementCalcClient } from "./EngagementCalcClient";

const PATH = "/youtube-engagement-calculator";
const FAQ = [
  { q: "What is a good engagement rate on YouTube?", a: "A YouTube engagement rate above 5% is considered good. Above 10% is excellent. Most channels fall between 2-5%. Shorts tend to have higher engagement rates than long-form due to passive likes." },
  { q: "How is engagement rate calculated?", a: "Engagement rate = (likes + comments + shares) ÷ views × 100. Some variations also include saves or clicks, but this is the standard YouTube formula." },
  { q: "Does engagement rate affect earnings?", a: "Indirectly, yes. Higher engagement signals quality content to the algorithm, which drives more views. It also directly increases sponsorship rates — brands pay premiums for engaged audiences." },
];

export async function generateMetadata({
  params,
}: {
  /* no params */;
}): Promise<Metadata> {
  const title = "YouTube Engagement Rate Calculator — Free Tool";
  const description = "Calculate your YouTube engagement rate from likes, comments, shares, and views. Understand how your audience interacts with your content.";
  return {
    title,
    description,
    alternates: buildAlternates({ pathSuffix: PATH }),
    openGraph: { title, description, url: `${PATH}` },
  };
}

export default async function Page({ params }: { /* no params */ }) {
  return (
    <>
      <SimpleCalcLayout
        eyebrow="Calculator · Engagement"
        title="YouTube Engagement Rate Calculator"
        intro="Calculate your YouTube engagement rate from likes, comments, shares, and views. A higher engagement rate signals a more loyal audience — which translates to higher sponsorship rates and better algorithmic reach."
        breadcrumbs={[{ label: "Engagement calculator", href: PATH }]}
        faq={FAQ}
      >
        <EngagementCalcClient />
      </SimpleCalcLayout>
      <ToolSEO pathSuffix={PATH} toolName="YouTube Engagement Rate Calculator" toolDescription="Calculate YouTube engagement rate from likes, comments, shares, and views." applicationCategory="FinanceApplication" faq={FAQ} breadcrumbName="Engagement Calculator" />
    </>
  );
}
