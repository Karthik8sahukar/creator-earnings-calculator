import type { Metadata } from "next";
import { DecisionLayout, ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { WordCounterClient } from "./WordCounterClient";

const PATH = "/word-counter";
const FAQ = [
  { q: "How accurate is the word count?", a: "Very accurate. We count words by splitting text on whitespace boundaries, which is the standard method used by word processors like Microsoft Word and Google Docs." },
  { q: "What is keyword density?", a: "Keyword density is the percentage of times a word appears relative to the total word count. For SEO, aim for 1-2% density for primary keywords to avoid over-optimization." },
  { q: "How is estimated page count calculated?", a: "Standard pages use 250 words per page (double-spaced, 12pt font). A4 estimates use 500 words per page (single-spaced). These are industry-standard benchmarks." },
  { q: "Is my text private?", a: "Yes. All analysis runs entirely in your browser using JavaScript. No text is sent to any server or stored anywhere." },
  { q: "Can I export my text?", a: "Yes. You can export as plain TXT or Markdown (.md) format using the export buttons above the text area." },
];


export async function generateMetadata({ params }: { /* no params */ }): Promise<Metadata> {
  return {
    title: "Word Counter — Free Online Word & Keyword Density Tool",
    description: "Count words, unique words, sentences, paragraphs. Analyze keyword density, reading time, and page estimates. Free, private, works offline.",
    keywords: ["word counter", "word count", "keyword density", "reading time calculator", "page count", "text analyzer", "word frequency"],
    alternates: buildAlternates({ pathSuffix: PATH }),
    openGraph: { type: "website", title: "Word Counter — Free Online Word & Keyword Density Tool", description: "Count words, analyze keyword density, and estimate reading time.", url: `${publicConfig.siteUrl}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Word Counter — Free Online Word & Keyword Density Tool", description: "Count words, analyze keyword density, and estimate reading time." },
  };
}

export default async function Page({ params }: { /* no params */ }) {
  return (
    <>
      <DecisionLayout
        eyebrow="Text Tool"
        title="Word Counter"
        intro="Count words, analyze keyword density, estimate reading time, and calculate page counts. Real-time analysis for writers, students, and content creators."
        breadcrumbs={[{ label: "Word Counter", href: PATH }]}
        faq={FAQ}
        currentToolPath={PATH}
      >
        <WordCounterClient />
      </DecisionLayout>
      <ToolSEO
       
        pathSuffix={PATH}
        toolName="Word Counter"
        toolDescription="Real-time word counter with keyword density analysis, reading time estimation, and page count calculator."
        faq={FAQ}
        breadcrumbName="Word Counter"
      />
    </>
  );
}
