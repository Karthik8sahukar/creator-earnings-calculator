import type { Metadata } from "next";

import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "YouTube Money Calculator is an independent tool. Estimates only — not affiliated with YouTube or Google. No guarantee of income.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <StaticPage title="Disclaimer">
      <p>
        This document sets out the disclaimers that apply to everything you
        see on this site. It has not been reviewed by a lawyer. It is not
        legal advice.
      </p>

      <aside
        role="note"
        aria-label="Key disclaimer"
        className="not-prose rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2"
      >
        <p className="font-semibold">Please read before relying on any figure:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Every earnings figure shown on this site is an{" "}
            <strong>estimate</strong>, not an actual number.
          </li>
          <li>
            This site is <strong>not affiliated with or endorsed by
            YouTube or Google</strong>. YouTube is a trademark of
            Google LLC.
          </li>
          <li>
            Actual creator revenue varies by <strong>RPM, CPM, audience
            location, watch time, niche, ads, memberships,
            sponsorships</strong>, and other monetization methods that
            this tool cannot see.
          </li>
        </ul>
      </aside>

      <h2 className="text-xl font-semibold text-slate-900">
        Independent tool, not YouTube
      </h2>
      <p>
        This site is an independent, third-party tool. It is not affiliated
        with, endorsed by, sponsored by, or verified by YouTube, Google LLC,
        or any of the creators shown. YouTube is a trademark of Google LLC.
        No claim of endorsement by any creator is made or implied by their
        appearance on this site.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Public data only, and it&apos;s public
      </h2>
      <p>
        Public channel statistics shown on this site are retrieved using the
        official{" "}
        <a
          href="https://developers.google.com/youtube/v3"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          YouTube Data API v3
        </a>
        . We do not scrape and we do not have access to YouTube Studio,
        private creator analytics, watch time, audience geography, ad
        category mix, or revenue reports.
      </p>
      <p>
        Channel thumbnails, banners, and names remain the property of the
        channel owners.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Estimates are estimates
      </h2>
      <p>
        Revenue figures on this site are estimates produced independently by
        this tool using a documented model (see the{" "}
        <a href="/methodology" className="underline">
          methodology page
        </a>
        ). Actual creator earnings are private and known only to the
        creator, YouTube, and — where applicable — their tax authorities.
        The estimates are not verified by YouTube, Google, or the creator.
      </p>
      <p>
        A creator&apos;s real revenue is driven by many factors that this
        tool cannot observe: their effective RPM and CPM, the geographic
        distribution of their viewers, average watch time, niche, the mix
        of ad formats, channel memberships, brand sponsorships, affiliate
        income, and other monetization methods. Two channels with
        identical view counts can earn very different amounts. Treat every
        number here as a rough starting point, not a target.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Not financial advice
      </h2>
      <p>
        Do not use anything on this site as the basis of any financial,
        tax, business, career, or legal decision. Nothing here is a promise
        or projection of income for any specific person. If you need advice,
        consult a qualified professional.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Currency conversion
      </h2>
      <p>
        Non-USD totals use a static approximate foreign-exchange table that
        is updated periodically. This tool does not consume a live FX feed.
        Do not use these totals to plan actual currency transfers.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        For channel owners
      </h2>
      <p>
        If you are the owner of a channel shown here and would like a
        correction — or removal — please open an issue in the project&apos;s
        source repository.
      </p>
    </StaticPage>
  );
}
