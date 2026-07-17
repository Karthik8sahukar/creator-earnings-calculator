import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <StaticPage
      title="Terms"
      description="The terms under which this tool is offered."
    >
      <h2 className="text-xl font-semibold text-slate-900">Use of the service</h2>
      <p>
        This tool is provided free of charge, &quot;as is&quot;, with no
        warranty of any kind. All figures shown are estimates and should not
        be relied on for any financial, tax, business, or legal decision.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">No affiliation</h2>
      <p>
        This is an independent tool. It is not affiliated with, endorsed by,
        or verified by YouTube, Google, or any of the creators shown.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Fair use</h2>
      <p>
        We access channel information via the official YouTube Data API v3.
        Please do not attempt to abuse the service or extract data at scale
        beyond ordinary interactive use.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Changes</h2>
      <p>
        These terms may be updated at any time. Continued use of the site
        after updates constitutes acceptance of the revised terms.
      </p>
    </StaticPage>
  );
}
