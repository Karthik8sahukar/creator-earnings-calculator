import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DecisionLayout, ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { CoinFlipClient } from "./CoinFlipClient";

const PATH = "/coin-flip";
const FAQ = [
  { q: "Is the coin flip fair?", a: "Yes. Each flip uses Math.random() with an exact 50/50 probability for Heads and Tails. No weighting is applied." },
  { q: "Can I flip multiple coins at once?", a: "Yes. Set the number of flips (1-100) and click Flip. All results are shown together with a Heads/Tails count." },
  { q: "Does this track my flip history?", a: "Yes. All flips during your session are tracked with a running Heads/Tails ratio. History clears when you refresh." },
  { q: "Can I use this for real decisions?", a: "For casual decisions, yes. The pseudorandom generator is fair for everyday use. For cryptographic or high-stakes purposes, use a hardware random number generator." },
];

export function generateStaticParams() { return routing.locales.map(locale => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Coin Flip — Free Online Heads or Tails",
    description: "Flip a virtual coin for instant Heads or Tails results. Flip multiple coins, track history, and see running statistics. Free, no login.",
    keywords: ["coin flip", "flip a coin", "heads or tails", "coin toss", "online coin flip", "virtual coin"],
    alternates: buildAlternates({ locale, pathSuffix: PATH }),
    openGraph: { type: "website", title: "Coin Flip — Free Online Heads or Tails", description: "Flip a virtual coin for instant Heads or Tails results.", url: `/${locale}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Coin Flip — Free Online Heads or Tails", description: "Flip a virtual coin for instant Heads or Tails results." },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <DecisionLayout eyebrow="Decision Tool" title="Coin Flip" intro="Flip a virtual coin for a quick Heads or Tails decision. Support for multiple simultaneous flips with running statistics." breadcrumbs={[{ label: "Coin Flip", href: PATH }]} faq={FAQ} currentToolPath={PATH}>
        <CoinFlipClient />
      </DecisionLayout>
      <ToolSEO locale={locale} pathSuffix={PATH} toolName="Coin Flip" toolDescription="Virtual coin flip with multi-flip support and history tracking." faq={FAQ} breadcrumbName="Coin Flip" />
    </>
  );
}
