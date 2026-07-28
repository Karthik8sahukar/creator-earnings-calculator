import type { Metadata } from "next";
import { getNewToolBySlug, generateToolPageMetadata, generateToolPageJsonLd } from "@/lib/tools-engine";
import { HtmlFormatterClient } from "./HtmlFormatterClient";

const tool = getNewToolBySlug("html-formatter")!;

export function generateMetadata(): Metadata {
  return generateToolPageMetadata(tool);
}

export default function HtmlFormatterPage() {
  return (
    <>
      <HtmlFormatterClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolPageJsonLd(tool)) }}
      />
    </>
  );
}
