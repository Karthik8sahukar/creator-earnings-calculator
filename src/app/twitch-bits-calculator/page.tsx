import type { Metadata } from "next";
import Script from "next/script";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { TwitchBitsClient } from "./TwitchBitsClient";

const PATH_SUFFIX = "/twitch-bits-calculator";


export async function generateMetadata({
  params,
}: {
  /* no params */;
}): Promise<Metadata> {
  const title = "Twitch Bits to USD Calculator — Free Converter Tool";
  const description =
    "Convert Twitch Bits to USD and USD to Bits instantly. See how much Bits are worth, what streamers earn per Bit, and common Bit package costs. Free, fast, no login.";
  return {
    title,
    description,
    keywords: [
      "Twitch Bits to USD",
      "Twitch Bits calculator",
      "Bits to dollars",
      "how much are Twitch Bits worth",
      "Twitch Bits converter",
      "Twitch Bits value",
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
    q: "How much is 1 Twitch Bit worth in USD?",
    a: "1 Bit = $0.01 USD for the streamer. Viewers pay slightly more when purchasing Bits (e.g., 100 Bits costs $1.40) because Twitch takes a margin on the purchase price.",
  },
  {
    q: "How much does a streamer earn from Bits?",
    a: "Streamers receive exactly $0.01 per Bit cheered in their channel. 1,000 Bits = $10.00, 10,000 Bits = $100.00. There is no additional Twitch cut on the streamer side.",
  },
  {
    q: "Why do Bits cost more than $0.01 each to buy?",
    a: "Twitch charges a markup when viewers purchase Bits. This covers payment processing and Twitch's revenue share. Buying in larger packages (e.g., 25,000 Bits) reduces the per-Bit cost.",
  },
  {
    q: "What are the common Twitch Bits packages?",
    a: "Common packages: 100 Bits ($1.40), 500 Bits ($7.00), 1,500 Bits ($19.95), 5,000 Bits ($64.40), 10,000 Bits ($126.00), and 25,000 Bits ($308.00). Prices may vary by region.",
  },
  {
    q: "Can I convert Bits back to real money as a viewer?",
    a: "No. Once purchased, Bits can only be used to Cheer in channels. Only streamers (affiliates and partners) can convert earned Bits into USD payouts.",
  },
  {
    q: "Is there a minimum payout for Twitch Bits?",
    a: "Twitch pays out when a streamer's balance reaches $50 (or $100 in some regions). Bits revenue is combined with subscriptions and ads for the payout threshold.",
  },
];

export default async function Page({
  params,
}: {
  /* no params */;
}) {

  const pageUrl = `${publicConfig.siteUrl}${PATH_SUFFIX}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${publicConfig.siteUrl}` },
        { "@type": "ListItem", position: 2, name: "Twitch Bits Calculator", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Twitch Bits to USD Calculator",
      description: "Convert Twitch Bits to USD and USD to Bits. See streamer earnings and viewer costs.",
      applicationCategory: "FinanceApplication",
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
        eyebrow="Tool · Twitch"
        title="Twitch Bits to USD Calculator"
        intro="Convert Twitch Bits to US dollars and vice versa. See exactly how much streamers earn per Bit, what viewers pay for Bit packages, and use presets for common amounts."
        breadcrumbs={[{ label: "Twitch Bits Calculator", href: "/twitch-bits-calculator" }]}
        faq={FAQ}
      >
        <TwitchBitsClient />
      </SimpleCalcLayout>
      <Script
        id="twitch-bits-ld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
