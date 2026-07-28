import type { Metadata } from "next";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import { generatePdfToolMetadata } from "@/lib/file-tools/metadata";
import { PdfToJpgClient } from "./PdfToJpgClient";

const SLUG = "pdf-to-jpg";
const tool = getPdfToolBySlug(SLUG)!;

export function generateMetadata(): Metadata {
  return generatePdfToolMetadata(tool);
}

export default function PdfToJpgPage() {
  return <PdfToJpgClient />;
}
