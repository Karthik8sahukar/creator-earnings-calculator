import type { Metadata } from "next";
import Script from "next/script";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { TeamGeneratorClient } from "./TeamGeneratorClient";

const PATH_SUFFIX = "/random-team-generator";


export async function generateMetadata(): Promise<Metadata> {
  const title = "Random Team Generator — Split Names Into Groups Free";
  const description =
    "Randomly divide a list of names into balanced teams. Paste participants, choose the number of teams, and generate fair groups instantly. Copy or export as CSV.";
  return {
    title,
    description,
    keywords: [
      "random team generator",
      "team maker",
      "random group generator",
      "split names into teams",
      "team picker",
      "random team picker",
      "group randomizer",
    ],
    alternates: buildAlternates({ pathSuffix: PATH_SUFFIX }),
    openGraph: {
      type: "website",
      title,
      description,
      url: `${PATH_SUFFIX}`,
      siteName: publicConfig.siteName,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

const FAQ = [
  {
    q: "How does the random team generator work?",
    a: "The tool uses the Fisher-Yates shuffle algorithm to randomly reorder your list of participants, then distributes them round-robin across the chosen number of teams. This ensures balanced team sizes.",
  },
  {
    q: "Are the teams truly random?",
    a: "Yes. Each time you click Generate or Re-shuffle, the list is shuffled fresh using Math.random(). The results are different every time.",
  },
  {
    q: "Can I use commas instead of new lines?",
    a: "Yes. The tool accepts names separated by commas, new lines, or a mix of both. Just paste your list in any format.",
  },
  {
    q: "What happens if names don't divide evenly?",
    a: "The extra participants are distributed one per team starting from Team 1. For example, 7 people in 3 teams gives 3-2-2 or 2-3-2 distribution (randomized).",
  },
  {
    q: "Can I export the results?",
    a: "Yes. Use the 'Copy' button to copy results as formatted text, or 'Export CSV' to download a spreadsheet-compatible CSV file with one column per team.",
  },
  {
    q: "Is any data sent to a server?",
    a: "No. Everything runs locally in your browser. Names are never sent anywhere. Refresh the page to clear all data.",
  },
];

export default async function Page() {

  const pageUrl = `${publicConfig.siteUrl}${PATH_SUFFIX}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${publicConfig.siteUrl}` },
        { "@type": "ListItem", position: 2, name: "Random Team Generator", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Random Team Generator",
      description: "Randomly split a list of names into balanced teams. Copy or export results.",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      url: pageUrl,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: { "@type": "Organization", name: publicConfig.siteName },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <>
      <SimpleCalcLayout
        eyebrow="Tool · Team"
        title="Random Team Generator"
        intro="Paste a list of participants, pick how many teams you want, and let the randomizer do the rest. Results are balanced and instantly copyable or exportable as CSV."
        breadcrumbs={[{ label: "Random Team Generator", href: "/random-team-generator" }]}
        faq={FAQ}
      >
        <TeamGeneratorClient />
      </SimpleCalcLayout>
      <Script
        id="team-generator-ld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
