"use client";

import { useCallback } from "react";
import { CodeWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("yaml-formatter")!;

function formatYaml(yaml: string): string {
  return yaml
    .split("\n")
    .map((line) => {
      const match = line.match(/^(\s*)/);
      const indent = match ? match[1].length : 0;
      const normalized = Math.round(indent / 2) * 2;
      return " ".repeat(normalized) + line.trim();
    })
    .join("\n");
}

export function YamlFormatterClient() {
  const handleProcess = useCallback((input: string): string => {
    return formatYaml(input);
  }, []);

  return (
    <CodeWorkspace
      title={tool.title}
      description={tool.longDescription}
      onProcess={handleProcess}
      processLabel="Format"
      faq={tool.faq}
    />
  );
}
