import type { Metadata } from "next";
import { getNewToolBySlug, generateToolPageMetadata, generateToolPageJsonLd } from "@/lib/tools-engine";
import { TextCompareClient } from "./TextCompareClient";

const tool = getNewToolBySlug("text-compare")!;

export function generateMetadata(): Metadata {
  return generateToolPageMetadata(tool);
}

export default function TextComparePage() {
  return (
    <>
      <TextCompareClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolPageJsonLd(tool)) }}
      />
    </>
  );
}
