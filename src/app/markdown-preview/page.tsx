import type { Metadata } from "next";
import { getNewToolBySlug, generateToolPageMetadata, generateToolPageJsonLd } from "@/lib/tools-engine";
import { MarkdownPreviewClient } from "./MarkdownPreviewClient";

const tool = getNewToolBySlug("markdown-preview")!;

export function generateMetadata(): Metadata {
  return generateToolPageMetadata(tool);
}

export default function MarkdownPreviewPage() {
  return (
    <>
      <MarkdownPreviewClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolPageJsonLd(tool)) }}
      />
    </>
  );
}
