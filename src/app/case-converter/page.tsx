import type { Metadata } from "next";
import { getNewToolBySlug, generateToolPageMetadata, generateToolPageJsonLd } from "@/lib/tools-engine";
import { CaseConverterClient } from "./CaseConverterClient";

const tool = getNewToolBySlug("case-converter")!;

export function generateMetadata(): Metadata {
  return generateToolPageMetadata(tool);
}

export default function CaseConverterPage() {
  return (
    <>
      <CaseConverterClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolPageJsonLd(tool)) }}
      />
    </>
  );
}
