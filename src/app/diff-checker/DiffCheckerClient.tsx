"use client";

import { useCallback } from "react";
import { CodeWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("diff-checker")!;

function computeDiff(input: string): string {
  const [textA, textB] = input.split("---COMPARE---");
  if (!textA || !textB)
    return "Enter text A above ---COMPARE--- line, then text B below it";
  const linesA = textA.trim().split("\n");
  const linesB = textB.trim().split("\n");
  const result: string[] = [];
  const maxLen = Math.max(linesA.length, linesB.length);
  for (let i = 0; i < maxLen; i++) {
    const a = linesA[i] ?? "";
    const b = linesB[i] ?? "";
    if (a === b) {
      result.push(`  ${a}`);
    } else {
      if (a) result.push(`- ${a}`);
      if (b) result.push(`+ ${b}`);
    }
  }
  return result.join("\n");
}

export function DiffCheckerClient() {
  const handleProcess = useCallback((input: string): string => {
    return computeDiff(input);
  }, []);

  return (
    <CodeWorkspace
      title={tool.title}
      description={tool.longDescription}
      onProcess={handleProcess}
      processLabel="Compare"
      inputPlaceholder={"Text A\n---COMPARE---\nText B"}
      faq={tool.faq}
    />
  );
}
