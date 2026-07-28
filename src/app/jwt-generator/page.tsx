import type { Metadata } from "next";
import { getNewToolBySlug, generateToolPageMetadata, generateToolPageJsonLd } from "@/lib/tools-engine";
import { JwtGeneratorClient } from "./JwtGeneratorClient";

const tool = getNewToolBySlug("jwt-generator")!;

export function generateMetadata(): Metadata {
  return generateToolPageMetadata(tool);
}

export default function JwtGeneratorPage() {
  return (
    <>
      <JwtGeneratorClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolPageJsonLd(tool)) }}
      />
    </>
  );
}
