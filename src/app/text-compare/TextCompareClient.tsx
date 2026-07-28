"use client";

import { useCallback } from "react";
import { TextWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("text-compare")!;

function compareTexts(input: string): string {
  const parts = input.split("---VS---");
  if (parts.length < 2)
    return "Enter first text above ---VS--- then second text below it.";
  const wordsA = parts[0].trim().split(/\s+/);
  const wordsB = parts[1].trim().split(/\s+/);
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
  const handleProcess = useCallback((input: string): string => {
    return compareTexts(input);
  }, []);

  return (
    <TextWorkspace
      title={tool.title}
      description={tool.longDescription}
      onProcess={handleProcess}
      faq={tool.faq}
      inputPlaceholder={"First text\n---VS---\nSecond text"}
      autoProcess={false}
      processLabel="Compare"
    />
  );
}
