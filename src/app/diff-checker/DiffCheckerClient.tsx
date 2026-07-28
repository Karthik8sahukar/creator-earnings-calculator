"use client";

import { useCallback } from "react";
import { MultiInputWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("diff-checker")!;

function computeDiff(left: string, right: string): string {
  const linesA = left.split("\n");
  const linesB = right.split("\n");
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

  const additions = result.filter((l) => l.startsWith("+")).length;
  const deletions = result.filter((l) => l.startsWith("-")).length;

  return `${additions} addition${additions !== 1 ? "s" : ""}, ${deletions} deletion${deletions !== 1 ? "s" : ""}\n\n${result.join("\n")}`;
}

export function DiffCheckerClient() {
  const handleProcess = useCallback((left: string, right: string): string => {
    if (!left.trim() && !right.trim()) return "Enter text in both fields to compare.";
    return computeDiff(left, right);
  }, []);

  return (
    <MultiInputWorkspace
      title={tool.title}
      description={tool.longDescription}
      leftLabel="Original Text"
      rightLabel="Modified Text"
      leftPlaceholder="Enter original text..."
      rightPlaceholder="Enter modified text..."
      exampleLeft={"BeHumler provides free online tools.\nThis line will be changed.\nThis line will be removed."}
      exampleRight={"BeHumler provides fast, free online tools.\nThis line has been changed.\nThis line was added."}
      primaryButton="Compare"
      onProcess={handleProcess}
      faq={tool.faq}
    />
  );
}
