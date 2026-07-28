import type { Metadata } from "next";
import { getNewToolBySlug, generateToolPageMetadata, generateToolPageJsonLd } from "@/lib/tools-engine";
import { QrGeneratorClient } from "./QrGeneratorClient";

const tool = getNewToolBySlug("qr-generator")!;

export function generateMetadata(): Metadata {
  return generateToolPageMetadata(tool);
}

export default function QrGeneratorPage() {
  return (
    <>
      <QrGeneratorClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolPageJsonLd(tool)) }}
      />
    </>
  );
}
