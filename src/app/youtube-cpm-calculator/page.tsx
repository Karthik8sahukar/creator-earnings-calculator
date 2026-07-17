import type { Metadata } from "next";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { CpmCalcClient } from "./CpmCalcClient";

export const metadata: Metadata = {
  title: "YouTube CPM Calculator",
  description:
    "Compute YouTube CPM from gross ad revenue and monetized impressions. Handles division by zero gracefully.",
  alternates: { canonical: "/youtube-cpm-calculator" },
  openGraph: {
    title: "YouTube CPM Calculator",
    description:
      "Independent CPM calculator — enter gross ad revenue and monetized impressions.",
    url: "/youtube-cpm-calculator",
  },
};

export default function Page() {
  return (
    <SimpleCalcLayout
      eyebrow="Calculator · CPM"
      title="YouTube CPM Calculator"
      intro="CPM (Cost Per Mille) is what advertisers pay YouTube per 1,000 ad impressions — before YouTube's share. Enter gross ad revenue and monetized impressions to compute your CPM."
      breadcrumbs={[{ label: "CPM calculator", href: "/youtube-cpm-calculator" }]}
      faq={[
        {
          q: "What is CPM?",
          a: "CPM (Cost Per Mille) is the amount an advertiser pays per 1,000 ad impressions. It's an advertiser-side metric.",
        },
        {
          q: "Why is my CPM higher than my RPM?",
          a: "CPM is before YouTube's revenue share and only counts monetized impressions. RPM is after YouTube's share and divides by all your views (including non-monetized ones). RPM is always lower than CPM.",
        },
        {
          q: "Is this an official YouTube tool?",
          a: "No. This is an independent calculator.",
        },
      ]}
    >
      <CpmCalcClient />
    </SimpleCalcLayout>
  );
}
