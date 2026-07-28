import type { Metadata } from "next";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import { generatePdfToolMetadata, generatePdfToolJsonLd } from "@/lib/file-tools/metadata";
import { RotatePdfClient } from "./RotatePdfClient";

const SLUG = "rotate-pdf";
const tool = getPdfToolBySlug(SLUG)!;

export function generateMetadata(): Metadata {
  return generatePdfToolMetadata(tool);
}

export default function RotatePdfPage() {
  return (
    <>
      <RotatePdfClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generatePdfToolJsonLd(tool)),
        }}
      />
    </>
  );
}
