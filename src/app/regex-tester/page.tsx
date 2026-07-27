import type { Metadata } from "next";
import { DeveloperToolLayout } from "@/components/developer";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { RegexTesterClient } from "./RegexTesterClient";

const PATH = "/regex-tester";
const FAQ = [
  { q: "Which regex engine does this tool use?", a: "This tool uses the JavaScript RegExp engine built into your browser. Behavior matches what you'd get in Node.js or browser JavaScript." },
  { q: "What regex flags are supported?", a: "All standard JavaScript flags: g (global), i (case-insensitive), m (multiline), s (dotAll), u (unicode), and y (sticky)." },
  { q: "How are zero-length matches handled?", a: "Zero-length matches (like those from lookaheads or empty patterns) are skipped and the index is advanced to prevent infinite loops." },
  { q: "Is my data sent to a server?", a: "No. All regex execution happens locally in your browser. No data leaves your device." },
];


export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Regex Tester – Test JavaScript Regular Expressions",
    description: "Test JavaScript regular expressions with live match highlighting, capturing groups, and replacement preview. Free, private, runs locally.",
    keywords: ["regex tester", "regular expression", "javascript regex", "regex matcher", "regex replace"],
    alternates: buildAlternates({ pathSuffix: PATH }),
    openGraph: { type: "website", title: "Regex Tester – Test JavaScript Regular Expressions", description: "Test regex patterns locally with live highlights.", url: `${publicConfig.siteUrl}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Regex Tester – Test JavaScript Regular Expressions", description: "Test regex patterns locally with live highlights." },
  };
}

export default async function Page() {
  return (
    <>
      <DeveloperToolLayout title="Regex Tester" intro="Test JavaScript regular expressions with live match highlighting, capturing groups, and optional replacement preview. All processing happens locally in your browser." breadcrumbs={[{ label: "Regex Tester", href: PATH }]} faq={FAQ} currentToolPath={PATH}>
        <RegexTesterClient />
      </DeveloperToolLayout>
      <ToolSEO pathSuffix={PATH} toolName="Regex Tester" toolDescription="Browser-based JavaScript regex tester with live match highlighting and replacement." faq={FAQ} breadcrumbName="Regex Tester" />
    </>
  );
}
