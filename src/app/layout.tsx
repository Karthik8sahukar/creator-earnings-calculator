import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { publicConfig } from "@/lib/config";

import "./globals.css";

/**
 * Root metadata.
 *
 * The homepage overrides `title.default` and `description` with the
 * spec-mandated SEO strings; see `src/app/page.tsx`. Child pages fall
 * back to the template + this description.
 */
export const metadata: Metadata = {
  metadataBase: new URL(publicConfig.siteUrl),
  title: {
    default: `${publicConfig.siteName} | Estimate Channel Earnings, RPM & CPM`,
    template: `%s · ${publicConfig.siteName}`,
  },
  description: publicConfig.description,
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
    url: publicConfig.siteUrl,
    title: `${publicConfig.siteName} | Estimate Channel Earnings, RPM & CPM`,
    description: publicConfig.description,
    siteName: publicConfig.siteName,
  },
  twitter: {
    card: "summary_large_image",
    title: `${publicConfig.siteName} | Estimate Channel Earnings, RPM & CPM`,
    description: publicConfig.description,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // JSON-LD: WebSite + WebApplication. FAQ pages own their own FAQPage schema.
  // We deliberately do NOT publish aggregate rating markup — this tool has no
  // fake reviews.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: publicConfig.siteName,
      url: publicConfig.siteUrl,
      description: publicConfig.description,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: publicConfig.siteName,
      description: publicConfig.description,
      url: publicConfig.siteUrl,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      creator: { "@type": "Organization", name: publicConfig.siteName },
    },
  ];

  return (
    <html lang="en">
      <body className="min-h-dvh font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-slate-900 focus:px-3 focus:py-1 focus:rounded"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="container-page py-8 sm:py-12">
          {children}
        </main>
        <Footer />
        <Script
          id="ld-json"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
