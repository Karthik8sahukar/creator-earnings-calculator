import type { Metadata } from "next";

import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How YouTube Money Calculator handles data: no account login, no tracking cookies, no analytics enabled by default, and how we use the YouTube Data API v3.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <StaticPage
      title="Privacy"
      description="How we handle your data when you use this tool."
    >
      <p>
        This document describes our privacy practices in plain English. It
        has not been reviewed by a lawyer. It is not a legal contract.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        No account, no login
      </h2>
      <p>
        This site does not offer an account system. You cannot &ldquo;sign
        in&rdquo; and we do not collect names, email addresses, phone numbers
        or other personal identifiers.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Search queries</h2>
      <p>
        When you type a channel name, that query is sent to our server and
        forwarded to the official YouTube Data API v3 so we can return
        matching public channels. We do not store the text of your searches
        on our server.
      </p>
      <p>
        Our server keeps short-lived operational logs of API requests. These
        logs record only: route name, HTTP status, response duration, cache
        hit/miss, rate-limit outcome, and an anonymized short hash of your
        network location (never the raw IP address). Query text, full user-
        agent, referer, and authorization headers are excluded from logs by
        design.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Recent-search history
      </h2>
      <p>
        The &ldquo;recent searches&rdquo; list on the homepage is stored in
        your browser&apos;s <code>localStorage</code> only. It is not sent to
        our server or to any third party. Clearing it (via the &ldquo;Clear
        history&rdquo; button) removes it immediately.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Shareable URLs
      </h2>
      <p>
        The earnings calculator encodes its current inputs (country, niche,
        monthly views, currency, etc.) as URL parameters so you can share
        the exact state of your calculation with someone else. These
        parameters are visible in the URL bar and in the share links you
        copy — they are not private. Do not paste them into a public place
        if you consider your assumptions sensitive.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Cookies</h2>
      <p>
        This site does not set tracking cookies. We do not require a cookie
        banner because product analytics are disabled by default (see below).
        The underlying hosting platform may set strictly-necessary cookies
        (for example, session or CSRF cookies) — those are not used for
        cross-site tracking.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Product analytics
      </h2>
      <p>
        Product analytics are <strong>disabled by default</strong>. No
        third-party analytics provider is loaded. The application ships with
        a provider-neutral analytics abstraction that operators can wire to a
        privacy-respecting service later; even when enabled, that
        abstraction is designed to never send: your raw search text, the
        YouTube API key, full IP addresses, or any information that could
        identify a specific person.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Third-party services we call
      </h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>YouTube Data API v3</strong> — for public channel information.
          Requests are subject to{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Google&apos;s privacy policy
          </a>
          .
        </li>
        <li>
          <strong>Public channel thumbnails</strong> are served from
          Google-hosted image domains. Your browser fetches them directly from
          Google.
        </li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-900">
        No access to YouTube Studio
      </h2>
      <p>
        We do not have access to YouTube Studio, private creator analytics,
        watch time, ad category mix, or revenue reports. Everything shown on
        this site is derived from public API data.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
      <p>
        For privacy questions or requests, open an issue on the project&apos;s
        source repository.
      </p>
    </StaticPage>
  );
}
