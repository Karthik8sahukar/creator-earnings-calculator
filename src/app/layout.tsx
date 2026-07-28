import "./globals.css";

import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ThemeScript } from "@/components/ThemeScript";
import { CurrencyProvider } from "@/components/currency";
import { publicConfig } from "@/lib/config";
import messages from "../../messages/en.json";

const layoutMeta = messages.layoutMeta as Record<string, string>;

export const metadata: Metadata = {
  metadataBase: new URL(publicConfig.siteUrl),
  title: {
    default: layoutMeta.titleDefault,
    template: layoutMeta.titleTemplate,
  },
  description: layoutMeta.description,
  applicationName: publicConfig.siteName,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
    title: layoutMeta.titleDefault,
    description: layoutMeta.description,
    siteName: publicConfig.siteName,
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: layoutMeta.titleDefault,
    description: layoutMeta.description,
  },
  alternates: {
    canonical: publicConfig.siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: publicConfig.siteName,
      url: publicConfig.siteUrl,
      description: layoutMeta.description,
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: publicConfig.siteName,
      description: layoutMeta.description,
      url: publicConfig.siteUrl,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      inLanguage: "en",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      creator: { "@type": "Organization", name: publicConfig.siteName },
    },
  ];

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh font-sans antialiased bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-slate-900 focus:px-3 focus:py-1 focus:rounded dark:focus:bg-slate-900 dark:focus:text-slate-50"
        >
          Skip to content
        </a>
        <CurrencyProvider>
          <Header />
          <main id="main" className="container-page py-8 sm:py-12">
            {children}
          </main>
          <Footer />
        </CurrencyProvider>
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
