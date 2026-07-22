import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CreatorEarnings } from "@/components/creator/CreatorEarnings";
import { CreatorFallbackNotice } from "@/components/creator/CreatorFallbackNotice";
import { CreatorFaqSection } from "@/components/creator/CreatorFaqSection";
import { CreatorHero } from "@/components/creator/CreatorHero";
import { CreatorRelatedArticles } from "@/components/creator/CreatorRelatedArticles";
import { CreatorStats } from "@/components/creator/CreatorStats";
import { CreatorVideoStrip } from "@/components/creator/CreatorVideoStrip";
import { RelatedCalculators } from "@/components/creator/RelatedCalculators";
import { RelatedCreators } from "@/components/creator/RelatedCreators";
import { TransparencyBanner } from "@/components/TransparencyBanner";
import { Link } from "@/i18n/navigation";
import { publicConfig } from "@/lib/config";
import { getCreatorAvatars } from "@/lib/creatorAvatars";
import {
  getCreatorBySlug,
  listCreators,
  resolveRelatedCreators,
} from "@/lib/creators";
import { buildCreatorFaq } from "@/lib/creatorFaq";
import { getCreatorProfile } from "@/lib/creatorProfile";
import { buildAlternates } from "@/lib/i18nMetadata";
import {
  buildBreadcrumbListLd,
  buildFaqPageLd,
  buildOrganizationLd,
  buildPersonLd,
  serializeJsonLd,
} from "@/lib/jsonLd";

/**
 * Dynamic creator profile page.
 *
 * Route: `/[locale]/creator/[slug]`
 *
 * The page is a server component. All YouTube fetches happen inside
 * `getCreatorProfile()` which handles caching, quota fallbacks, and
 * timeout mapping — this file just composes the presentation and
 * emits SEO metadata + JSON-LD.
 */

// Fetches from an external API per request, so we must opt out of
// caching and force the Node runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route configuration.
 *
 * `dynamicParams = true` allows any slug to be requested at runtime.
 * The page itself calls `notFound()` for unknown slugs, ensuring 404s.
 * This avoids relying on a build-time route manifest that may be
 * incomplete or stale on platforms with incremental builds.
 *
 * `generateStaticParams` remains as a performance optimization:
 * it pre-renders known creators at build time, but correctness does
 * not depend on it.
 */
export const dynamicParams = true;

interface RouteParams {
  locale: string;
  slug: string;
}

interface PageProps {
  params: Promise<RouteParams>;
}

/**
 * Static params — performance optimization only.
 *
 * Pre-renders known creator pages at build time. Returns only { slug }
 * because the parent [locale]/layout.tsx already handles locale params.
 * With dynamicParams = true, pages render even if the build manifest
 * is incomplete.
 */
export function generateStaticParams() {
  return listCreators().map((c) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const creator = getCreatorBySlug(slug);

  // Reject unknown slugs as early as possible.
  //
  // Calling `notFound()` from `generateMetadata` short-circuits the
  // request BEFORE any response headers are staged for streaming.
  // Next.js then renders the closest `not-found.tsx` boundary with
  // a real HTTP 404 status code. Doing this check inside the page
  // body instead (after `await params` + `setRequestLocale()` + the
  // start of a streamed render) can leave the response stamped as
  // HTTP 200 with the not-found UI in the body — the exact failure
  // mode this fix addresses.
  //
  // The `notFound()` call in the page body below remains as a
  // defensive belt-and-suspenders check.
  if (!creator) notFound();

  const t = await getTranslations({ locale, namespace: "creator.meta" });
  const currentYear = new Date().getFullYear();

  const title = t("title", {
    name: creator.displayName,
    year: currentYear,
  });
  const description = t("description", {
    name: creator.displayName,
    site: publicConfig.siteName,
  });
  const pathSuffix = `/creator/${creator.slug}`;

  return {
    title,
    description,
    keywords: [
      creator.displayName,
      `${creator.displayName} net worth`,
      `${creator.displayName} earnings`,
      `${creator.displayName} YouTube revenue`,
      "YouTube earnings",
      "creator revenue",
      creator.category,
    ],
    alternates: buildAlternates({ locale, pathSuffix }),
    openGraph: {
      type: "profile",
      url: `${publicConfig.siteUrl}/${locale}${pathSuffix}`,
      title,
      description,
      siteName: publicConfig.siteName,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CreatorPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const creator = getCreatorBySlug(slug);

  if (!creator) notFound();

  const profile = await getCreatorProfile(creator);
  const related = resolveRelatedCreators(creator.relatedCreators);
  // Fetch avatars for the related-creators strip in parallel with
  // the rest of the render. Reuses the same YouTube TtlCache — if
  // `getCreatorProfile()` already warmed the cache for any of these
  // handles, this call is instant.
  const relatedAvatars = await getCreatorAvatars(related);
  const faqEntries = buildCreatorFaq(profile);

  const t = await getTranslations({ locale, namespace: "creator" });
  const tCommon = await getTranslations({
    locale,
    namespace: "common.breadcrumbs",
  });

  // ── Build JSON-LD payloads ──────────────────────────────────────
  //
  // We emit four schemas at once:
  //   1. BreadcrumbList (nav path)
  //   2. Person (the creator)
  //   3. Organization (the site — required by the "Organization
  //      Schema" bullet in the spec)
  //   4. FAQPage (visible Q&A)
  //
  const canonicalUrl = `${publicConfig.siteUrl}/${locale}/creator/${creator.slug}`;
  const breadcrumbLd = buildBreadcrumbListLd([
    { name: tCommon("home"), url: `${publicConfig.siteUrl}/${locale}` },
    { name: t("breadcrumb.creators"), url: `${publicConfig.siteUrl}/${locale}/creators` },
    { name: creator.displayName, url: canonicalUrl },
  ]);
  const personLd = buildPersonLd({
    name: creator.displayName,
    url: canonicalUrl,
    description: creator.description,
    alternateName: creator.youtubeHandle,
    image: profile.channel.thumbnail || undefined,
    sameAs: profile.channel.channelUrl
      ? [profile.channel.channelUrl]
      : undefined,
    jobTitle: creator.category,
    nationality: creator.country,
  });
  const organizationLd = buildOrganizationLd({
    name: publicConfig.siteName,
    url: publicConfig.siteUrl,
  });
  const faqLd =
    faqEntries.length > 0
      ? buildFaqPageLd(
          faqEntries.map((e) => ({ question: e.question, answer: e.answer })),
        )
      : null;

  const jsonLdPayloads = [
    breadcrumbLd,
    personLd,
    organizationLd,
    ...(faqLd ? [faqLd] : []),
  ];

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        data-testid="creator-jsonld"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdPayloads) }}
      />

      <nav
        aria-label={t("breadcrumb.aria")}
        className="text-sm text-slate-500 dark:text-slate-400"
      >
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">
              {tCommon("home")}
            </Link>
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden>›</span>
            <Link
              href="/creators"
              className="hover:text-slate-900 dark:hover:text-slate-100"
            >
              {t("breadcrumb.creators")}
            </Link>
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden>›</span>
            <span className="text-slate-700 dark:text-slate-300">
              {creator.displayName}
            </span>
          </li>
        </ol>
      </nav>

      {profile.fallbackReason && (
        <CreatorFallbackNotice reason={profile.fallbackReason} />
      )}

      <CreatorHero
        creator={creator}
        channel={profile.channel}
        isFallback={profile.fallbackReason !== null}
      />

      <TransparencyBanner />

      <CreatorEarnings profile={profile} />

      <CreatorStats profile={profile} />

      <CreatorVideoStrip
        titleKey="recentTitle"
        emptyKey="recentEmpty"
        videos={profile.videos}
        limit={10}
      />

      <CreatorVideoStrip
        titleKey="topTitle"
        emptyKey="topEmpty"
        videos={profile.topVideos}
        limit={6}
      />

      <RelatedCalculators />

      <CreatorRelatedArticles />

      <RelatedCreators creators={related} avatars={relatedAvatars} />

      <CreatorFaqSection entries={faqEntries} />
    </div>
  );
}
