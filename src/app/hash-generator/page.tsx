import type { Metadata } from "next";
import { getNewToolBySlug, generateToolPageMetadata, generateToolPageJsonLd } from "@/lib/tools-engine";
import { HashGeneratorClient } from "./HashGeneratorClient";

const tool = getNewToolBySlug("hash-generator")!;

export function generateMetadata(): Metadata {
  return generateToolPageMetadata(tool);
}

export default function HashGeneratorPage() {
  return (
    <>
      <HashGeneratorClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolPageJsonLd(tool)) }}
      />
    </>
  );
}
