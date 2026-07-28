import type { Metadata } from "next";
import { getNewToolBySlug, generateToolPageMetadata, generateToolPageJsonLd } from "@/lib/tools-engine";
import { XmlFormatterClient } from "./XmlFormatterClient";

const tool = getNewToolBySlug("xml-formatter")!;

export function generateMetadata(): Metadata {
  return generateToolPageMetadata(tool);
}

export default function XmlFormatterPage() {
  return (
    <>
      <XmlFormatterClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolPageJsonLd(tool)) }}
      />
    </>
  );
}
