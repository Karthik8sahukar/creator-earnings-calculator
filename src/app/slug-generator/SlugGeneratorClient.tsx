"use client";

import { useCallback } from "react";
import { TextWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("slug-generator")!;

function generateSlug(input: string): string {
  if (!input.trim()) return "";
  const slug = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
    .replace(/[^a-z0-9\s-]/g, "")   // Remove non-alphanumeric
    .trim()
    .replace(/[\s-]+/g, "-")         // Collapse whitespace/hyphens to single hyphen
    .replace(/^-|-$/g, "");          // Remove leading/trailing hyphens
  return slug || "(empty — input contains no alphanumeric characters)";
}

export function SlugGeneratorClient() {
  const handleProcess = useCallback((input: string): string => {
    return generateSlug(input);
  }, []);

  return (
    <TextWorkspace
      title={tool.title}
      description={tool.longDescription}
      onProcess={handleProcess}
      faq={tool.faq}
      autoProcess={true}
      outputLabel="URL Slug"
    />
  );
}
