import type { Metadata } from "next";
import { DeveloperToolLayout } from "@/components/developer";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { SqlToJsonClient } from "./SqlToJsonClient";

const PATH = "/sql-to-json-converter";
const FAQ = [
  { q: "What SQL input is supported?", a: "Only INSERT INTO ... VALUES statements. The tool parses the column list and value rows to produce structured JSON. Other SQL commands (SELECT, UPDATE, etc.) are not supported." },
  { q: "What are the limitations?", a: "Nested queries, expressions, function calls, and multi-table inserts are not supported. Only literal values (strings, numbers, booleans, NULL) are parsed." },
  { q: "Does this tool execute SQL?", a: "No. This tool only parses the text structure of INSERT statements. It does not connect to any database or execute queries." },
  { q: "Is my data sent to a server?", a: "No. All parsing happens locally in your browser. No data leaves your device." },
];


export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "SQL INSERT to JSON Converter",
    description: "Convert SQL INSERT statements to structured JSON locally in your browser. Parse column names and values into downloadable JSON data.",
    keywords: ["sql to json", "insert to json", "sql converter", "sql parser", "data converter"],
    alternates: buildAlternates({ pathSuffix: PATH }),
    openGraph: { type: "website", title: "SQL INSERT to JSON Converter", description: "Convert SQL INSERT to JSON locally. Free and private.", url: `${publicConfig.siteUrl}${PATH}`, siteName: publicConfig.siteName, locale: "en_US" },
    twitter: { card: "summary_large_image", title: "SQL INSERT to JSON Converter", description: "Convert SQL INSERT to JSON locally. Free and private." },
  };
}

export default async function Page() {
  return (
    <>
      <DeveloperToolLayout title="SQL to JSON Converter" intro="Convert SQL INSERT statements to structured JSON data. Parse column names and literal values into downloadable JSON arrays." breadcrumbs={[{ label: "SQL to JSON", href: PATH }]} faq={FAQ} currentToolPath={PATH}>
        <SqlToJsonClient />
      </DeveloperToolLayout>
      <ToolSEO pathSuffix={PATH} toolName="SQL to JSON Converter" toolDescription="Browser-based SQL INSERT to JSON converter with download support." faq={FAQ} breadcrumbName="SQL to JSON Converter" />
    </>
  );
}
