import type { Metadata } from "next";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { RpmCalcClient } from "./RpmCalcClient";

export const metadata: Metadata = {
  title: "YouTube RPM Calculator",
  description:
    "Calculate your YouTube RPM (revenue per 1,000 views) from any revenue + views pair. Handles division by zero gracefully.",
  alternates: { canonical: "/youtube-rpm-calculator" },
  openGraph: {
    title: "YouTube RPM Calculator",
    description:
      "Independent RPM calculator — enter your revenue and total views to get your RPM.",
    url: "/youtube-rpm-calculator",
  },
};

export default function Page() {
  return (
    <SimpleCalcLayout
      eyebrow="Calculator · RPM"
      title="YouTube RPM Calculator"
      intro="RPM (Revenue Per Mille) is the amount you earn per 1,000 views after YouTube's revenue share. Enter your total ad revenue and total views to compute your RPM. This tool is independent — see the methodology page."
      breadcrumbs={[{ label: "RPM calculator", href: "/youtube-rpm-calculator" }]}
      faq={[
        {
          q: "What is RPM?",
          a: "RPM stands for Revenue Per Mille — the amount you earn per 1,000 views after YouTube takes its share. It's a creator-side metric.",
        },
        {
          q: "How is RPM different from CPM?",
          a: "CPM is what advertisers pay per 1,000 ad impressions before YouTube's share. RPM is what remains for the creator, and it applies to ALL views (not just monetized ones). RPM is always lower than CPM.",
        },
        {
          q: "Is this an official YouTube tool?",
          a: "No. This is an independent calculator. The math is just RPM = revenue / views × 1000; the numbers you enter come from your own data.",
        },
      ]}
    >
      <RpmCalcClient />
    </SimpleCalcLayout>
  );
}
