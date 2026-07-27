import type { Metadata } from "next";
import { DecisionLayout, ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { CharacterCounterClient } from "./CharacterCounterClient";

const PATH = "/character-counter";
const FAQ = [
  { q: "How does the character counter work?", a: "Simply type or paste text into the textarea. Statistics update instantly in real time — characters, words, sentences, paragraphs, reading time, and more." },
  { q: "Does it count spaces as characters?", a: "Yes. We show both total characters (including spaces) and characters without spaces so you can use whichever metric your platform requires." },
  { q: "What is the character limit for Twitter/X?", a: "Twitter/X allows up to 280 characters per tweet. Our tool shows a progress bar so you can see exactly how much space you have left." },
  { q: "Is my text stored or sent to a server?", a: "No. All processing happens in your browser. Nothing is sent to any server. Your text stays completely private." },
  { q: "How is reading time calculated?", a: "Reading time is estimated at 238 words per minute, which is the average adult reading speed for online content." },
];

export function generateStaticParams() {
  return [{}];
}

export async function generateMetadata({ params }: { /* no params */ }): Promise<Metadata> {
  return {
    title: "Character Counter — Free Online Character & Word Counter",
    description: "Count characters, words, sentences, and paragraphs in real time. Check platform limits for Twitter, Instagram, LinkedIn, and more. Free, private, no login.",
    keywords: ["character counter", "word counter", "character count", "letter count", "text length", "Twitter character limit", "Instagram character limit"],
    alternates: buildAlternates({ pathSuffix: PATH }),
    openGraph: { type: "website", title: "Character Counter — Free Online Character & Word Counter", description: "Count characters, words, sentences in real time. Check platform limits.", url: `${publicConfig.siteUrl}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Character Counter — Free Online Character & Word Counter", description: "Count characters, words, sentences in real time." },
  };
}

export default async function Page({ params }: { /* no params */ }) {
  return (
    <>
      <DecisionLayout
        eyebrow="Text Tool"
        title="Character Counter"
        intro="Count characters, words, sentences, paragraphs, and more in real time. Check platform character limits instantly."
        breadcrumbs={[{ label: "Character Counter", href: PATH }]}
        faq={FAQ}
        currentToolPath={PATH}
      >
        <CharacterCounterClient />
      </DecisionLayout>
      <ToolSEO
       
        pathSuffix={PATH}
        toolName="Character Counter"
        toolDescription="Real-time character, word, sentence, and paragraph counter with platform limit checks."
        faq={FAQ}
        breadcrumbName="Character Counter"
      />
    </>
  );
}
