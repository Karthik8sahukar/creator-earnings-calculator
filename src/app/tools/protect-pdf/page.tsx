import type { Metadata } from "next";
import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import { generatePdfToolMetadata } from "@/lib/file-tools/metadata";
import { ProtectPdfClient } from "./ProtectPdfClient";

const SLUG = "protect-pdf";
const tool = getPdfToolBySlug(SLUG)!;

export function generateMetadata(): Metadata {
  return generatePdfToolMetadata(tool);
}

export default function ProtectPdfPage() {
  return <ProtectPdfClient />;
}
