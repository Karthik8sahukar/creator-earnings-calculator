import type { Metadata } from "next";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import { generatePdfToolMetadata, generatePdfToolJsonLd } from "@/lib/file-tools/metadata";
import { AddWatermarkClient } from "./AddWatermarkClient";

const SLUG = "add-watermark";
const tool = getPdfToolBySlug(SLUG)!;

export function generateMetadata(): Metadata {
  return generatePdfToolMetadata(tool);
}

export default function AddWatermarkPage() {
  return (
    <>
      <AddWatermarkClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generatePdfToolJsonLd(tool)),
        }}
      />
    </>
  );
}
