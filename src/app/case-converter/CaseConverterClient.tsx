"use client";

import { useCallback } from "react";
import { TextWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("case-converter")!;

function convertCase(input: string): string {
  return [
    `UPPERCASE: ${input.toUpperCase()}`,
    `lowercase: ${input.toLowerCase()}`,
    `Title Case: ${input.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase())}`,
    `Sentence case: ${input.charAt(0).toUpperCase() + input.slice(1).toLowerCase()}`,
    `camelCase: ${input.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())}`,
    `snake_case: ${input.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "")}`,
    `kebab-case: ${input.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  ].join("\n\n");
}

export function CaseConverterClient() {
  const handleProcess = useCallback((input: string): string => {
    return convertCase(input);
  }, []);

  return (
    <TextWorkspace
      title={tool.title}
      description={tool.longDescription}
      onProcess={handleProcess}
      faq={tool.faq}
      autoProcess={true}
      outputLabel="All Cases"
    />
  );
}
