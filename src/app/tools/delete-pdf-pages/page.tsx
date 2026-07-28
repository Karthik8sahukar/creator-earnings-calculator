import type { Metadata } from "next";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import { generatePdfToolMetadata, generatePdfToolJsonLd } from "@/lib/file-tools/metadata";
import { DeletePdfPagesClient } from "./DeletePdfPagesClient";

const SLUG = "delete-pdf-pages";
const tool = getPdfToolBySlug(SLUG)!;

export function generateMetadata(): Metadata {
  return generatePdfToolMetadata(tool);
}

export default function DeletePdfPagesPage() {
  return (
    <>
      <DeletePdfPagesClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generatePdfToolJsonLd(tool)),
        }}
      />
    </>
  );
}
