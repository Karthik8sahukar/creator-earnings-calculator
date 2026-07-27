import type { Metadata } from "next";
import { DecisionLayout, ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { RandomNumberClient } from "./RandomNumberClient";

const PATH = "/random-number-generator";
const FAQ = [
  { q: "What range can I use?", a: "Any integer range. Set minimum and maximum to any whole numbers (negative numbers supported)." },
  { q: "Can I generate multiple numbers?", a: "Yes, up to 100 numbers at once. Each is independently random within your range." },
  { q: "Are duplicate numbers possible?", a: "Yes. Each number is generated independently, so duplicates can occur. For unique selections, use the Random Name Picker." },
  { q: "Is the generator biased?", a: "No. The tool uses Math.random() and floor arithmetic to ensure uniform distribution across the range." },
];

export function generateStaticParams() {
  return .map(locale => ({ locale }));
}

export async function generateMetadata({ params }: { /* no params */ }): Promise<Metadata> {
  return {
    title: "Random Number Generator — Free Online Tool",
    description: "Generate random numbers in any range. Set min, max, and count. Supports negative numbers, multi-generation, and history tracking. Free, instant, no login.",
    keywords: ["random number generator", "RNG", "random number", "number picker", "random integer generator"],
    alternates: buildAlternates({ pathSuffix: PATH }),
    openGraph: { type: "website", title: "Random Number Generator — Free Online Tool", description: "Generate random numbers in any range.", url: `${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Random Number Generator — Free Online Tool", description: "Generate random numbers in any range." },
  };
}

export default async function Page({ params }: { /* no params */ }) {
  return (
    <>
      <DecisionLayout eyebrow="Decision Tool" title="Random Number Generator" intro="Generate random numbers within any range. Set your minimum, maximum, and how many numbers you need. Instant results with full history." breadcrumbs={[{ label: "Random Number Generator", href: PATH }]} faq={FAQ} currentToolPath={PATH}>
        <RandomNumberClient />
      </DecisionLayout>
      <ToolSEO pathSuffix={PATH} toolName="Random Number Generator" toolDescription="Generate random integers within any range with multi-number support." faq={FAQ} breadcrumbName="Random Number Generator" />
    </>
  );
}
