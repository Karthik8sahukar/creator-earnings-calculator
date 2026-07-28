import type { Metadata } from "next";
import { getNewToolBySlug, generateToolPageMetadata, generateToolPageJsonLd } from "@/lib/tools-engine";
import { LoremIpsumClient } from "./LoremIpsumClient";

const tool = getNewToolBySlug("lorem-ipsum")!;

export function generateMetadata(): Metadata {
  return generateToolPageMetadata(tool);
}

export default function LoremIpsumPage() {
  return (
    <>
      <LoremIpsumClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolPageJsonLd(tool)) }}
      />
    </>
  );
}
