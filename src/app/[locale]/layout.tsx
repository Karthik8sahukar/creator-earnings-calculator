import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ThemeScript } from "@/components/ThemeScript";
import { HREFLANG_MAP, routing, type AppLocale } from "@/i18n/routing";
import { publicConfig } from "@/lib/config";

// Statically pre-render every supported locale so the initial paint
// for `/en`, `/hi`, `/es`, … is cached at build time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Locale-aware root metadata. Loads the translated title/description
 * for the active locale and emits an `alternates.languages` map so
 * search engines can serve the right variant to the right audience.
 * `x-default` points at the canonical English URL.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "layoutMeta" });

  return {
    metadataBase: new URL(publicConfig.siteUrl),
    title: {
      default: t("titleDefault"),
      template: t("titleTemplate"),
    },
    description: t("description"),
    applicationName: publicConfig.siteName,
    keywords: [
      "YouTube",
      "YouTube money calculator",
      "YouTube earnings calculator",
      "YouTube calculator",
      "channel analytics",
      "RPM",
      "CPM",
      "YouTube revenue",
      "Shorts RPM",
      "sponsorship rate",
    ],
    authors: [{ name: publicConfig.siteName }],
    creator: publicConfig.siteName,
    publisher: publicConfig.siteName,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      url: `${publicConfig.siteUrl}/${locale}`,
      title: t("titleDefault"),
      description: t("description"),
      siteName: publicConfig.siteName,
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: t("titleDefault"),
      description: t("description"),
    },
    alternates: {
      canonical: `/${locale}`,
      languages: buildHreflangMap("/"),
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Reject anything the middleware failed to negotiate — treat as 404.
  if (!hasLocale(routing.locales, locale)) notFound();

  // Tell next-intl which locale is active for this request so server
  // components below can resolve `useTranslations()` synchronously.
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "layoutMeta" });

  // Google Analytics 4 — only mounted when the Measurement ID is
  // provided in the environment.
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // JSON-LD: WebSite + WebApplication. FAQ pages own their own FAQPage
  // schema. We deliberately do NOT publish aggregate rating markup —
  // this tool has no reviews.
  //
  // `inLanguage` tells search engines the language of THIS particular
  // rendering; the language alternates in <head> handle discovery of
  // the other locales.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: publicConfig.siteName,
      url: `${publicConfig.siteUrl}/${locale}`,
      description: t("description"),
      inLanguage: HREFLANG_MAP[locale as AppLocale] ?? locale,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: publicConfig.siteName,
      description: t("description"),
      url: `${publicConfig.siteUrl}/${locale}`,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      inLanguage: HREFLANG_MAP[locale as AppLocale] ?? locale,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      creator: { "@type": "Organization", name: publicConfig.siteName },
    },
  ];

  return (
    // `suppressHydrationWarning` lets the ThemeScript flip `html.dark`
    // before hydration without React complaining about a class mismatch.
    // `scroll-smooth` matches the redesign's document scroll behaviour.
    <html
      lang={HREFLANG_MAP[locale as AppLocale] ?? locale}
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh font-sans antialiased bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-slate-900 focus:px-3 focus:py-1 focus:rounded dark:focus:bg-slate-900 dark:focus:text-slate-50"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <Header />
          <main id="main" className="container-page py-8 sm:py-12">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
        <Script
          id="ld-json"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}

/**
 * Build the `alternates.languages` map for a given pathname suffix.
 * Every supported locale gets an entry; `x-default` points to English
 * so crawlers with no language preference land somewhere useful.
 */
function buildHreflangMap(pathSuffix: string): Record<string, string> {
  const clean = pathSuffix === "/" ? "" : pathSuffix;
  const out: Record<string, string> = {};
  for (const loc of routing.locales) {
    out[HREFLANG_MAP[loc]] = `${publicConfig.siteUrl}/${loc}${clean}`;
  }
  out["x-default"] = `${publicConfig.siteUrl}/${routing.defaultLocale}${clean}`;
  return out;
}
