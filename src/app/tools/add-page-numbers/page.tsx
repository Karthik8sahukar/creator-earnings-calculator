import type { Metadata } from "next";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import { generatePdfToolMetadata, generatePdfToolJsonLd } from "@/lib/file-tools/metadata";
import { AddPageNumbersClient } from "./AddPageNumbersClient";

const SLUG = "add-page-numbers";
const tool = getPdfToolBySlug(SLUG)!;

export function generateMetadata(): Metadata {
  return generatePdfToolMetadata(tool);
}

export default function AddPageNumbersPage() {
  return (
    <>
      <AddPageNumbersClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generatePdfToolJsonLd(tool)),
        }}
      />
    </>
  );
}
