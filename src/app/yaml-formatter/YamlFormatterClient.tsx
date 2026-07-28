"use client";

import { useCallback } from "react";
import { CodeWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("yaml-formatter")!;

export function YamlFormatterClient() {
  const handleProcess = useCallback(async (input: string): Promise<string> => {
    const YAML = await import("yaml");

    try {
      const parsed = YAML.parse(input);
      return YAML.stringify(parsed, { indent: 2 });
    } catch (err) {
      if (err instanceof Error) {
        return `YAML Parse Error:\n\n${err.message}`;
      }
      return "Invalid YAML: could not parse the input.";
    }
  }, []);

  return (
    <CodeWorkspace
      title={tool.title}
      description={tool.longDescription}
      onProcess={handleProcess}
      processLabel="Format"
      inputPlaceholder="Paste YAML here..."
      faq={tool.faq}
    />
  );
}
