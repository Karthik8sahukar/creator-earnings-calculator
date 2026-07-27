import type { Metadata } from "next";
import { DecisionLayout, ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { RandomNameClient } from "./RandomNameClient";

const PATH = "/random-name-picker";
const FAQ = [
  { q: "How does the name picker work?", a: "Paste your list of names, set how many to pick, and click Pick. The tool uses a Fisher-Yates shuffle to ensure unbiased random selection." },
  { q: "Can I pick multiple names?", a: "Yes. Set the count to pick 2, 3, 5, or any number up to your total list size. Selected names are unique (no repeats)." },
  { q: "Are names stored anywhere?", a: "No. Everything runs locally in your browser. Names are never sent to a server." },
  { q: "What formats are accepted?", a: "One name per line, or comma-separated. Both formats work, and you can mix them." },
  { q: "Is it fair?", a: "Yes. The selection uses a Fisher-Yates shuffle which gives every name an equal probability of being picked." },
];


export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Random Name Picker — Pick Names From a List Free",
    description: "Randomly pick one or more names from your list. Unbiased Fisher-Yates selection, history tracking, and instant results. Free, private, no login.",
    keywords: ["random name picker", "name picker", "random name generator", "pick a name", "name randomizer", "random selector"],
    alternates: buildAlternates({ pathSuffix: PATH }),
    openGraph: { type: "website", title: "Random Name Picker — Pick Names From a List Free", description: "Randomly pick one or more names from your list.", url: `${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Random Name Picker — Pick Names From a List Free", description: "Randomly pick one or more names from your list." },
  };
}

export default async function Page() {
  return (
    <>
      <DecisionLayout eyebrow="Decision Tool" title="Random Name Picker" intro="Paste a list of names and randomly pick one or more winners. Uses an unbiased shuffle algorithm — every name has an equal chance." breadcrumbs={[{ label: "Random Name Picker", href: PATH }]} faq={FAQ} currentToolPath={PATH}>
        <RandomNameClient />
      </DecisionLayout>
      <ToolSEO pathSuffix={PATH} toolName="Random Name Picker" toolDescription="Randomly select names from a list using unbiased Fisher-Yates algorithm." faq={FAQ} breadcrumbName="Random Name Picker" />
    </>
  );
}
