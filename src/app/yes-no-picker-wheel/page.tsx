import type { Metadata } from "next";
import Script from "next/script";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { YesNoWheelClient } from "./YesNoWheelClient";

const PATH_SUFFIX = "/yes-no-picker-wheel";


export async function generateMetadata(): Promise<Metadata> {
  const title = "Yes or No Picker Wheel — Free Decision Maker";
  const description =
    "Spin the wheel to get a random Yes or No answer. Configurable odds, keyboard support, and spin history. Make quick decisions with our free picker wheel.";
  return {
    title,
    description,
    keywords: [
      "yes or no wheel",
      "yes no picker",
      "decision wheel",
      "random yes no",
      "spinner wheel yes no",
      "yes no generator",
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
    q: "How does the Yes/No Picker Wheel work?",
    a: "Click 'Spin!' or press Enter/Space to spin the wheel. A weighted random algorithm determines the outcome based on the Yes/No ratio you set. The wheel animation lands on the chosen result.",
  },
  {
    q: "Can I adjust the odds?",
    a: "Yes. Use the ratio slider to change the probability. Setting it to 70% Yes means the wheel lands on Yes roughly 70% of the time. The default is a fair 50/50 split.",
  },
  {
    q: "Is the result truly random?",
    a: "The result uses JavaScript's Math.random() which provides pseudorandom numbers sufficient for casual decision-making. It is not cryptographically random but is fair for everyday use.",
  },
  {
    q: "Can I use this on my phone?",
    a: "Yes. The wheel is mobile-friendly and works with touch. Tap the Spin button to spin. The wheel and results are fully responsive on any screen size.",
  },
  {
    q: "Is my spin history saved?",
    a: "Spin history is kept in memory during your session. It resets when you refresh or leave the page. Nothing is sent to any server.",
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
        { "@type": "ListItem", position: 2, name: "Yes/No Picker Wheel", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Yes or No Picker Wheel",
      description: "Spin a wheel to randomly decide Yes or No. Configurable odds and spin history.",
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
        eyebrow="Tool · Decision"
        title="Yes or No Picker Wheel"
        intro="Can't decide? Spin the wheel and let randomness choose for you. Adjust the Yes/No ratio, press Spin (or hit Enter), and get your answer instantly."
        breadcrumbs={[{ label: "Yes/No Picker Wheel", href: "/yes-no-picker-wheel" }]}
        faq={FAQ}
      >
        <YesNoWheelClient />
      </SimpleCalcLayout>
      <Script
        id="yes-no-wheel-ld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
