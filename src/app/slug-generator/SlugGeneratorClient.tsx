"use client";

import { useCallback } from "react";
import { TextWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("slug-generator")!;

function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
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
