import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DecisionLayout, ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { SpinWheelClient } from "./SpinWheelClient";

const PATH = "/spin-the-wheel";
const FAQ = [
  { q: "How does Spin the Wheel work?", a: "Enter your options (one per line), click Spin, and the wheel randomly selects one. The algorithm is unbiased — each option has an equal chance." },
  { q: "Can I customize the options?", a: "Yes. Edit the text area with your own items, one per line. The wheel updates instantly. Minimum 2 options required." },
  { q: "Is it truly random?", a: "The tool uses Math.random() which provides pseudorandom numbers sufficient for casual decisions. Each segment has an equal probability of being chosen." },
  { q: "Does it work on mobile?", a: "Yes. The wheel is fully responsive and works with touch. Tap Spin to start." },
  { q: "Is data stored or sent anywhere?", a: "No. Everything runs locally in your browser. Options and results are never transmitted to a server." },
];

export function generateStaticParams() { return routing.locales.map(locale => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Spin the Wheel — Free Random Picker Tool",
    description: "Customizable spinning wheel to randomly pick from your options. Add items, spin, and get a random result. Free, fast, no login required.",
    keywords: ["spin the wheel", "random wheel", "wheel picker", "random choice wheel", "spinner wheel"],
    alternates: buildAlternates({ locale, pathSuffix: PATH }),
    openGraph: { type: "website", title: "Spin the Wheel — Free Random Picker Tool", description: "Customizable spinning wheel to randomly pick from your options.", url: `/${locale}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Spin the Wheel — Free Random Picker Tool", description: "Customizable spinning wheel to randomly pick from your options." },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <DecisionLayout eyebrow="Decision Tool" title="Spin the Wheel" intro="Add your options, spin the wheel, and let randomness decide. Customize segments, track history, and use keyboard shortcuts." breadcrumbs={[{ label: "Spin the Wheel", href: PATH }]} faq={FAQ} currentToolPath={PATH}>
        <SpinWheelClient />
      </DecisionLayout>
      <ToolSEO locale={locale} pathSuffix={PATH} toolName="Spin the Wheel" toolDescription="Customizable spinning wheel for random selection." faq={FAQ} breadcrumbName="Spin the Wheel" />
    </>
  );
}
