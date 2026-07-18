import type { Metadata } from "next";
import { Suspense } from "react";

import { ChannelWorkspace } from "@/components/ChannelWorkspace";
import { Faq } from "@/components/home/Faq";
import { Hero } from "@/components/home/Hero";
import { PopularCalculators } from "@/components/home/PopularCalculators";
import { WhyBeHumler } from "@/components/home/WhyBeHumler";

/**
 * Homepage SEO — explicit metadata overrides the layout defaults with
 * the exact strings from the branding spec.
 *
 * The brand itself is a hardcoded code constant (`BRAND_NAME` in
 * `src/lib/config.ts`), so no env-variable drift on any deployment
 * can change the rendered title. Kept intentionally identical to the
 * strings in the branding spec.
 */
export const metadata: Metadata = {
  title: {
    absolute: "YouTube Money Calculator | Estimate Channel Earnings, RPM & CPM",
  },
  description:
    "Estimate YouTube channel earnings using public statistics. Calculate potential monthly income, RPM, CPM, Shorts revenue, sponsorship value, and more with our free YouTube Money Calculator.",
  alternates: { canonical: "/" },
  openGraph: {
    title:
      "YouTube Money Calculator | Estimate Channel Earnings, RPM & CPM",
    description:
      "Estimate YouTube channel earnings using public statistics. Calculate potential monthly income, RPM, CPM, Shorts revenue, sponsorship value, and more with our free YouTube Money Calculator.",
  },
  twitter: {
    title:
      "YouTube Money Calculator | Estimate Channel Earnings, RPM & CPM",
    description:
      "Estimate YouTube channel earnings using public statistics. Calculate potential monthly income, RPM, CPM, Shorts revenue, sponsorship value, and more with our free YouTube Money Calculator.",
  },
};

export default function HomePage() {
  return (
    <div className="space-y-20 sm:space-y-28">
      <Hero>
        <Suspense fallback={<WorkspaceFallback />}>
          <ChannelWorkspace />
        </Suspense>
      </Hero>

      <PopularCalculators />
      <WhyBeHumler />
      <Faq />
    </div>
  );
}

function WorkspaceFallback() {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="skeleton h-14 w-full rounded-2xl" aria-hidden />
      <span className="sr-only">Loading calculator…</span>
    </div>
  );
}
