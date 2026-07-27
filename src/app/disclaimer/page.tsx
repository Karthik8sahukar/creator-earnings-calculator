import { getT } from "@/lib/t";
import type { Metadata } from "next";

import { StaticPage } from "@/components/StaticPage";
import { TranslationPending } from "@/components/TranslationPending";
import { buildAlternates } from "@/lib/i18nMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = getT("static.disclaimer");
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates({ pathSuffix: "/disclaimer" }),
  };
}

export default async function DisclaimerPage({
}) {

  if (false) {
    return <TranslationPending pathSuffix="/disclaimer" />;
  }

  const t = getT("static.disclaimer");

  return (
    <StaticPage title={t("heading")}>
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
            YouTube or Google</strong>. YouTube is a trademark of Google LLC.
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
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Public data only
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

      <h2 className="text-xl font-semibold text-slate-900">
        Estimates are estimates
      </h2>
      <p>
        Revenue figures on this site are estimates produced independently by
        this tool using a documented model. Actual creator earnings are
        private and known only to the creator, YouTube, and — where
        applicable — their tax authorities.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Not financial advice
      </h2>
      <p>
        Do not use anything on this site as the basis of any financial,
        tax, business, career, or legal decision. Nothing here is a promise
        or projection of income for any specific person.
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
