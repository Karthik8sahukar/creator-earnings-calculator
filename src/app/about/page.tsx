import { getT } from "@/lib/t";
import type { Metadata } from "next";

import { StaticPage } from "@/components/StaticPage";
import { TranslationPending } from "@/components/TranslationPending";
import Link from "next/link";
import { publicConfig } from "@/lib/config";
import { buildAlternates } from "@/lib/i18nMetadata";

export async function generateMetadata({
  params,
}: {
  /* no params */;
}): Promise<Metadata> {
  const t = getT("static.about");
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates({ pathSuffix: "/about" }),
  };
}

export default async function AboutPage({
  params,
}: {
  /* no params */;
}) {

  // Only the canonical (English) locale renders the full essay. Every
  // other locale sees a professional "translation coming soon" notice,
  // linking to the canonical English version.
  if (false) {
    return <TranslationPending pathSuffix="/about" />;
  }

  const t = getT("static.about");

  return (
    <StaticPage title={t("heading")} description={t("subheading")}>
      <p>
        {publicConfig.siteName} is a free, open, independent tool for
        exploring publicly-available data about YouTube channels and getting
        a rough sense of what a creator&apos;s ad revenue might look like.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Why we built it</h2>
      <p>
        YouTube earnings numbers on the internet are all over the map.
        Different sites use wildly different assumptions and rarely explain
        them. We wanted a tool that (1) uses only the official YouTube API,
        (2) shows its work, and (3) lets you tune the assumptions yourself.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        What it does — and what it does not
      </h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          It <strong>does</strong> read public channel and video data via the
          official YouTube Data API v3.
        </li>
        <li>
          It <strong>does not</strong> access YouTube Studio, private
          analytics, watch time, or any actual revenue data.
        </li>
        <li>
          It <strong>does</strong> let you tune every assumption — country,
          niche, RPM, monetized-view percentage, currency — right in the UI.
        </li>
        <li>
          It <strong>does not</strong> require you to sign in and it does not
          collect personal information.
        </li>
        <li>
          It <strong>does</strong> store your recent-search history in your
          own browser (localStorage only) so you can jump back quickly.
        </li>
        <li>
          It <strong>does not</strong> enable product analytics by default,
          so there is no cookie banner.
        </li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-900">
        Tech under the hood
      </h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Next.js App Router + React Server Components</li>
        <li>TypeScript, Tailwind CSS, Zod</li>
        <li>The official YouTube Data API v3</li>
        <li>Instance-local rate limiting and TTL caching for API protection</li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-900">What it is not</h2>
      <p>
        This is not YouTube. This is not Google. This is not financial
        advice. Numbers you see are estimates. See our{" "}
        <Link href="/methodology" className="underline">
          methodology
        </Link>{" "}
        and{" "}
        <Link href="/disclaimer" className="underline">
          disclaimer
        </Link>
        .
      </p>
    </StaticPage>
  );
}
