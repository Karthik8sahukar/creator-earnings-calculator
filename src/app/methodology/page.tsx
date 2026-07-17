import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "Methodology" };

export default function MethodologyPage() {
  return (
    <StaticPage
      title="Methodology"
      description="How the numbers on this site are produced."
    >
      <h2 className="text-xl font-semibold text-slate-900">
        1. Channel & video data
      </h2>
      <p>
        All channel information (title, subscribers, total views, video count,
        thumbnails, join date, country) is retrieved from the official YouTube
        Data API v3 endpoints{" "}
        <code className="rounded bg-slate-100 px-1 text-sm">search</code>,{" "}
        <code className="rounded bg-slate-100 px-1 text-sm">channels</code>,{" "}
        <code className="rounded bg-slate-100 px-1 text-sm">playlistItems</code>{" "}
        and{" "}
        <code className="rounded bg-slate-100 px-1 text-sm">videos</code>. No
        scraping is performed.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        2. Performance analysis
      </h2>
      <p>
        For each channel we retrieve the most recent uploads (up to 12 by
        default) and compute:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Average and median view counts across the sample</li>
        <li>Number of uploads in the last 30 and 90 days</li>
        <li>Share of Shorts (videos ≤ 60 seconds) versus long-form</li>
        <li>Estimated monthly views (see below)</li>
      </ul>

      <h3 className="text-lg font-semibold text-slate-900 mt-6">
        Monthly view estimation
      </h3>
      <p>
        If there are at least three uploads in the last 30 days, monthly views
        are the sum of those views. If not, we scale a 90-day window down to a
        30-day equivalent. If neither window has enough data, we average views
        across the observed sample time span. We report a range (low, expected,
        high) around the point estimate.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        3. Earnings estimation
      </h2>
      <p>
        Ad revenue is estimated as{" "}
        <code className="rounded bg-slate-100 px-1 text-sm">
          (monthly views × monetized share × RPM) / 1000
        </code>
        . RPM is derived from a base rate that depends on the audience country,
        a niche multiplier, and a content-type multiplier that reflects the
        well-documented Shorts vs. long-form monetization gap. You can override
        the RPM manually.
      </p>
      <p>
        Additional monthly income (sponsorships, affiliate, memberships) is
        added on top of the ad revenue band. The final total is converted to
        the display currency using an approximate rate.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">4. Limitations</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Ad fill rate, seasonality, and category mix are unknown.</li>
        <li>YouTube&apos;s share of ad revenue is baked into RPM.</li>
        <li>Refunds, invalid traffic, and taxes are not modelled.</li>
        <li>Currency conversion uses a static approximate rate.</li>
        <li>
          We cannot see private analytics such as playback locations, watch
          time, or actual RPM.
        </li>
      </ul>
      <p>
        In short: the numbers on this site are informed guesses. Treat them as
        a starting point for a conversation, not as truth.
      </p>
    </StaticPage>
  );
}
