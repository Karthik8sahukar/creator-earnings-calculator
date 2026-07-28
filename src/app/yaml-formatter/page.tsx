import type { Metadata } from "next";
import { getNewToolBySlug, generateToolPageMetadata, generateToolPageJsonLd } from "@/lib/tools-engine";
import { YamlFormatterClient } from "./YamlFormatterClient";

const tool = getNewToolBySlug("yaml-formatter")!;

export function generateMetadata(): Metadata {
  return generateToolPageMetadata(tool);
}

export default function YamlFormatterPage() {
  return (
    <>
      <YamlFormatterClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolPageJsonLd(tool)) }}
      />
    </>
  );
}
