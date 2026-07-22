import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CATEGORIES, getCountryBySlug, listCountrySlugs, listCreatorsByCountry } from "@/data/creators";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { publicConfig } from "@/lib/config";
import { buildAlternates } from "@/lib/i18nMetadata";
import { buildBreadcrumbListLd, buildFaqPageLd, buildItemListLd, serializeJsonLd } from "@/lib/jsonLd";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    listCountrySlugs().map((country) => ({ locale, country })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  const meta = getCountryBySlug(country);
  if (!meta) return {};
  const year = new Date().getFullYear();
  const title = meta.title.replace("{year}", String(year));
  return {
    title,
    description: meta.description,
    alternates: buildAlternates({ locale, pathSuffix: `/creators/country/${country}` }),
    openGraph: {
      title, description: meta.description,
      url: `${publicConfig.siteUrl}/${locale}/creators/country/${country}`,
      siteName: publicConfig.siteName, type: "website",
    },
    twitter: { card: "summary_large_image", title, description: meta.description },
    keywords: [meta.label, "YouTube", "earnings", "creators", String(year)],
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  setRequestLocale(locale);
  const meta = getCountryBySlug(country);
  if (!meta) notFound();

  const creators = listCreatorsByCountry(meta.countryCode);
  const year = new Date().getFullYear();
  const title = meta.title.replace("{year}", String(year));
  const base = publicConfig.siteUrl;

  const breadcrumbLd = buildBreadcrumbListLd([
    { name: "Home", url: `${base}/${locale}` },
    { name: "Creators", url: `${base}/${locale}/creators` },
    { name: meta.label, url: `${base}/${locale}/creators/country/${country}` },
  ]);
  const itemListLd = buildItemListLd(
    creators.map((c) => ({ name: c.name, url: `${base}/${locale}/creator/${c.slug}`, description: c.description })),
  );

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd([breadcrumbLd, itemListLd, buildFaqPageLd(meta.faq)]) }}
      />
      <nav className="text-sm text-slate-500 dark:text-slate-400">
        <Link href="/">Home</Link> &gt; <Link href="/creators">Creators</Link> &gt; <span>{meta.label}</span>
      </nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{title}</h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl">{meta.intro}</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map((c) => (
          <li key={c.slug} className="rounded-lg border p-4 hover:shadow-md transition-shadow">
            <Link href={`/creator/${c.slug}`} className="block space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-50">{c.name}</p>
              <p className="text-sm text-slate-500">{c.handle}</p>
              <p className="text-xs text-slate-400">{c.country} &middot; {c.category}</p>
            </Link>
          </li>
        ))}
      </ul>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">FAQ</h2>
        <dl className="space-y-3">
          {meta.faq.map((f) => (
            <div key={f.question}>
              <dt className="font-medium text-slate-800 dark:text-slate-200">{f.question}</dt>
              <dd className="text-sm text-slate-600 dark:text-slate-400 mt-1">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Browse by Category</h2>
        <ul className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <li key={cat.slug}>
              <Link href={`/creators/${cat.slug}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                {cat.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
