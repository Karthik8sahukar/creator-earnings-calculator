import type { Metadata } from "next";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import { generatePdfToolMetadata } from "@/lib/file-tools/metadata";
import { UnlockPdfClient } from "./UnlockPdfClient";

const SLUG = "unlock-pdf";
const tool = getPdfToolBySlug(SLUG)!;

export function generateMetadata(): Metadata {
  return generatePdfToolMetadata(tool);
}

export default function UnlockPdfPage() {
  return <UnlockPdfClient />;
}
