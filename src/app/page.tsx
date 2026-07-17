import type { Metadata } from "next";
import { Suspense } from "react";

import { ChannelWorkspace } from "@/components/ChannelWorkspace";

/**
 * Homepage SEO — explicit metadata overrides the layout defaults so
 * that the branded title and description are stable no matter what
 * `NEXT_PUBLIC_SITE_NAME` is set to in a given deployment.
 *
 * Kept intentionally identical to the strings in the branding spec.
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
    <div className="space-y-10">
      <section
        aria-labelledby="hero-title"
        className="text-center space-y-4 pt-6 sm:pt-10"
      >
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          Powered by the YouTube Data API v3
        </p>
        <h1
          id="hero-title"
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900"
        >
          YouTube Money Calculator
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-600">
          Estimate a YouTube channel&apos;s potential monthly earnings using
          public YouTube data, estimated RPM, CPM, and view analytics.
        </p>
      </section>

      <Suspense fallback={<WorkspaceFallback />}>
        <ChannelWorkspace />
      </Suspense>
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
