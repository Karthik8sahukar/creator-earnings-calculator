"use client";

import { useCallback } from "react";
import { MultiInputWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("text-compare")!;

function compareTexts(left: string, right: string): string {
  const wordsA = left.trim().split(/\s+/);
  const wordsB = right.trim().split(/\s+/);
  const result: string[] = [];
  const maxLen = Math.max(wordsA.length, wordsB.length);
  let diffs = 0;

  for (let i = 0; i < maxLen; i++) {
    const a = wordsA[i] ?? "";
    const b = wordsB[i] ?? "";
    if (a !== b) {
      result.push(`[${a || "(empty)"} → ${b || "(empty)"}]`);
      diffs++;
    } else {
      result.push(a);
    }
  }

  return `${diffs} difference${diffs !== 1 ? "s" : ""} found.\n\n${result.join(" ")}`;
}

export function TextCompareClient() {
  const handleProcess = useCallback((left: string, right: string): string => {
    if (!left.trim() && !right.trim()) return "Enter text in both fields to compare.";
    return compareTexts(left, right);
  }, []);

  return (
    <MultiInputWorkspace
      title={tool.title}
      description={tool.longDescription}
      leftLabel="First Text"
      rightLabel="Second Text"
      leftPlaceholder="Enter first text..."
      rightPlaceholder="Enter second text..."
      exampleLeft={"BeHumler provides free online tools.\nThis line stays the same."}
      exampleRight={"BeHumler provides fast, free online tools.\nThis line stays the same."}
      primaryButton="Compare"
      badge="Text Tool"
      onProcess={handleProcess}
      faq={tool.faq}
    />
  );
}
