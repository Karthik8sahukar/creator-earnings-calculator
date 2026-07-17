import type { Metadata } from "next";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { SponsorshipCalcClient } from "./SponsorshipCalcClient";

export const metadata: Metadata = {
  title: "YouTube Sponsorship Calculator",
  description:
    "Estimate YouTube sponsorship rates based on subscribers, average views, engagement, niche, deliverable type, usage rights, and exclusivity. Rates are always negotiable.",
  alternates: { canonical: "/youtube-sponsorship-calculator" },
  openGraph: {
    title: "YouTube Sponsorship Calculator",
    description:
      "Independent sponsorship rate estimator. Results are indicative — every deal is negotiable.",
    url: "/youtube-sponsorship-calculator",
  },
};

export default function Page() {
  return (
    <SimpleCalcLayout
      eyebrow="Calculator · Sponsorship"
      title="YouTube Sponsorship Calculator"
      intro="Estimate a fair sponsorship rate for a YouTube brand deal based on your subscribers, average views, engagement rate, niche, deliverable type, usage rights, and exclusivity terms. All results are negotiable — real sponsorship rates depend on the specific brand, campaign, and creator."
      breadcrumbs={[
        { label: "Sponsorship calculator", href: "/youtube-sponsorship-calculator" },
      ]}
      faq={[
        {
          q: "Are these rates official?",
          a: "No. Sponsorship rates are private and negotiated between the creator and the brand. This tool produces an indicative estimate.",
        },
        {
          q: "What is a dedicated video worth?",
          a: "A dedicated video (built entirely around the sponsor) typically commands 2–3x the rate of a short integration in an otherwise-unrelated video.",
        },
        {
          q: "What are extended and perpetual usage rights?",
          a: "Standard usage keeps rights within your channel. Extended lets the brand reuse the content in ads for a period of time. Perpetual means the brand can reuse it forever. Each step increases the price.",
        },
      ]}
    >
      <SponsorshipCalcClient />
    </SimpleCalcLayout>
  );
}
