import type { Metadata } from "next";
import { getNewToolBySlug, generateToolPageMetadata, generateToolPageJsonLd } from "@/lib/tools-engine";
import { SlugGeneratorClient } from "./SlugGeneratorClient";

const tool = getNewToolBySlug("slug-generator")!;

export function generateMetadata(): Metadata {
  return generateToolPageMetadata(tool);
}

export default function SlugGeneratorPage() {
  return (
    <>
      <SlugGeneratorClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolPageJsonLd(tool)) }}
      />
    </>
  );
}
