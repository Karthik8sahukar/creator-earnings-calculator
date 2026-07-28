import type { Metadata } from "next";
import { getNewToolBySlug, generateToolPageMetadata, generateToolPageJsonLd } from "@/lib/tools-engine";
import { DiffCheckerClient } from "./DiffCheckerClient";

const tool = getNewToolBySlug("diff-checker")!;

export function generateMetadata(): Metadata {
  return generateToolPageMetadata(tool);
}

export default function DiffCheckerPage() {
  return (
    <>
      <DiffCheckerClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolPageJsonLd(tool)) }}
      />
    </>
  );
}
