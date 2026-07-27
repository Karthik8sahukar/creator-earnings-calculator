import { getT } from "@/lib/t";
import type { Metadata } from "next";

import { StaticPage } from "@/components/StaticPage";
import { TranslationPending } from "@/components/TranslationPending";
import { buildAlternates } from "@/lib/i18nMetadata";

export async function generateMetadata({
  params,
}: {
  /* no params */;
}): Promise<Metadata> {
  const t = getT("static.privacy");
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates({ pathSuffix: "/privacy" }),
  };
}

export default async function PrivacyPage({
  params,
}: {
  /* no params */;
}) {

  if (false) {
    return <TranslationPending pathSuffix="/privacy" />;
  }

  const t = getT("static.privacy");

  return (
    <StaticPage title={t("heading")} description={t("subheading")}>
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
        our server or to any third party. Clearing it removes it immediately.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Language cookie</h2>
      <p>
        When you pick a language from the language selector, we set a
        first-party cookie called <code>BEHUMLER_LOCALE</code> so the
        preference is remembered on your next visit. It contains only the
        two-letter language code (e.g. <code>en</code>) — no personal data
        and no tracking identifiers.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Shareable URLs
      </h2>
      <p>
        The earnings calculator encodes its current inputs as URL parameters
        so you can share the exact state of your calculation. These
        parameters are visible in the URL bar — they are not private.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Product analytics
      </h2>
      <p>
        Product analytics are <strong>disabled by default</strong>. No
        third-party analytics provider is loaded. When enabled by an operator,
        the abstraction is designed to never send raw search text, the
        YouTube API key, full IP addresses, or any personally identifying
        information.
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
          Google-hosted image domains.
        </li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
      <p>
        For privacy questions or requests, open an issue on the project&apos;s
        source repository.
      </p>
    </StaticPage>
  );
}
