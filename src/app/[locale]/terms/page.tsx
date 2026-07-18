import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { StaticPage } from "@/components/StaticPage";
import { TranslationPending } from "@/components/TranslationPending";
import { routing } from "@/i18n/routing";
import { buildAlternates } from "@/lib/i18nMetadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "static.terms" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates({ locale, pathSuffix: "/terms" }),
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale !== routing.defaultLocale) {
    return <TranslationPending pathSuffix="/terms" />;
  }

  const t = await getTranslations({ locale, namespace: "static.terms" });

  return (
    <StaticPage title={t("heading")} description={t("subheading")}>
      <p>
        This document describes the terms of use in plain English. It has
        not been reviewed by a lawyer. It is not a legal contract.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Use of the service
      </h2>
      <p>
        This tool is provided free of charge, &ldquo;as is&rdquo;, with no
        warranty of any kind. Every number shown is an estimate and should
        not be relied on as the basis of any financial, tax, business, or
        legal decision.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">No affiliation</h2>
      <p>
        This site is an independent tool. It is not affiliated with,
        endorsed by, or verified by YouTube, Google LLC, or any of the
        creators shown. YouTube is a trademark of Google LLC.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Public data only
      </h2>
      <p>
        We access channel information via the official YouTube Data API v3.
        We do not have access to YouTube Studio, private analytics, or any
        non-public creator data.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Fair use</h2>
      <p>
        The service is rate-limited on a per-client basis. Please do not
        attempt to abuse the service or extract data at scale beyond
        ordinary interactive use.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        No guarantee of income
      </h2>
      <p>
        Nothing on this site is a promise, offer, or projection of income.
        We cannot see the private variables that actually determine a
        creator&apos;s revenue and we do not attempt to.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Changes</h2>
      <p>
        These terms may be updated at any time. Continued use of the site
        after updates constitutes acceptance of the revised terms.
      </p>
    </StaticPage>
  );
}
