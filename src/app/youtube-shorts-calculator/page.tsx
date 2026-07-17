import type { Metadata } from "next";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { ShortsCalcClient } from "./ShortsCalcClient";

export const metadata: Metadata = {
  title: "YouTube Shorts Calculator",
  description:
    "Estimate ad revenue from YouTube Shorts using audience country, niche, and monthly views. Shorts monetize very differently from long-form.",
  alternates: { canonical: "/youtube-shorts-calculator" },
  openGraph: {
    title: "YouTube Shorts Calculator",
    description:
      "Independent Shorts earnings estimator. Shorts RPM is significantly lower than long-form.",
    url: "/youtube-shorts-calculator",
  },
};

export default function Page() {
  return (
    <SimpleCalcLayout
      eyebrow="Calculator · Shorts"
      title="YouTube Shorts Calculator"
      intro="Estimate monthly, daily, and annual earnings from YouTube Shorts. Shorts monetization is significantly different from long-form: expected Shorts RPM is only a small fraction of a comparable long-form RPM."
      breadcrumbs={[{ label: "Shorts calculator", href: "/youtube-shorts-calculator" }]}
      faq={[
        {
          q: "Why is Shorts RPM so much lower than long-form?",
          a: "Shorts share a global ad pool that's allocated across all Shorts creators based on view share. Per-view earnings are typically an order of magnitude smaller than for long-form videos.",
        },
        {
          q: "Is this the exact revenue I'll receive?",
          a: "No. Actual revenue depends on your specific audience, ad mix, seasonality, and country breakdown. Treat this as an informed estimate.",
        },
      ]}
    >
      <ShortsCalcClient />
    </SimpleCalcLayout>
  );
}
