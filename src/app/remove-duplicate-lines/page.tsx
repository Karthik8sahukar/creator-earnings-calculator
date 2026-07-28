import type { Metadata } from "next";
import { getNewToolBySlug, generateToolPageMetadata, generateToolPageJsonLd } from "@/lib/tools-engine";
import { RemoveDuplicateLinesClient } from "./RemoveDuplicateLinesClient";

const tool = getNewToolBySlug("remove-duplicate-lines")!;

export function generateMetadata(): Metadata {
  return generateToolPageMetadata(tool);
}

export default function RemoveDuplicateLinesPage() {
  return (
    <>
      <RemoveDuplicateLinesClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolPageJsonLd(tool)) }}
      />
    </>
  );
}
