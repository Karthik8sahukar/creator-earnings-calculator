import type { Metadata } from "next";
import { DecisionLayout, ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { TruthOrDareClient } from "./TruthOrDareClient";

const PATH = "/truth-or-dare-generator";
const FAQ = [
  { q: "How many questions are included?", a: "The generator includes 60 unique questions and dares across 9 categories and 4 difficulty levels. Questions are shuffled and never repeat consecutively." },
  { q: "Is this safe for kids?", a: "Yes. Select the Kids or Family category and Easy difficulty for age-appropriate questions. All content in these categories is clean and family-friendly." },
  { q: "Can I play with a group?", a: "Absolutely. Take turns clicking Generate. Use the mode selector to alternate between Truth and Dare, or set it to Random for variety." },
  { q: "Are my favorites saved?", a: "Favorites are saved in your browser session. They will clear when you close the tab. No data is sent to any server." },
  { q: "What categories are available?", a: "Friends, Family, Kids, Couples, Party, Office, School, Funny, and Clean. Each question can belong to multiple categories." },
];

export function generateStaticParams() {
  return [{}];
}

export async function generateMetadata({ params }: { /* no params */ }): Promise<Metadata> {
  return {
    title: "Truth or Dare Generator — Free Party Game Questions",
    description: "Generate truth or dare questions for parties, friends, couples, and families. 60+ questions across 9 categories and 4 difficulty levels. Free, no login.",
    keywords: ["truth or dare", "truth or dare generator", "party game", "dare questions", "truth questions", "game generator", "party questions"],
    alternates: buildAlternates({ pathSuffix: PATH }),
    openGraph: { type: "website", title: "Truth or Dare Generator — Free Party Game Questions", description: "Generate truth or dare questions for any occasion. 9 categories, 4 difficulty levels.", url: `${publicConfig.siteUrl}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Truth or Dare Generator — Free Party Game Questions", description: "Generate truth or dare questions for any occasion." },
  };
}

export default async function Page({ params }: { /* no params */ }) {
  return (
    <>
      <DecisionLayout
        eyebrow="Party Game"
        title="Truth or Dare Generator"
        intro="Generate truth or dare questions for parties, friends, families, and couples. Choose your difficulty and category for the perfect game experience."
        breadcrumbs={[{ label: "Truth or Dare", href: PATH }]}
        faq={FAQ}
        currentToolPath={PATH}
      >
        <TruthOrDareClient />
      </DecisionLayout>
      <ToolSEO
       
        pathSuffix={PATH}
        toolName="Truth or Dare Generator"
        toolDescription="Random truth or dare question generator with categories, difficulty levels, and favorites."
        faq={FAQ}
        breadcrumbName="Truth or Dare"
      />
    </>
  );
}
