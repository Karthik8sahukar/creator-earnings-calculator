"use client";

import { useCallback } from "react";
import { TextWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("remove-duplicate-lines")!;

function removeDuplicates(input: string): string {
  const seen = new Set<string>();
  return input
    .split("\n")
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .join("\n");
}

export function RemoveDuplicateLinesClient() {
  const handleProcess = useCallback((input: string): string => {
    return removeDuplicates(input);
  }, []);

  return (
    <TextWorkspace
      title={tool.title}
      description={tool.longDescription}
      onProcess={handleProcess}
      faq={tool.faq}
      autoProcess={true}
    />
  );
}
