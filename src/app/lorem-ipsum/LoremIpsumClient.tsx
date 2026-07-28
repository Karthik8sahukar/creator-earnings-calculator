"use client";

import { useCallback } from "react";
import { TextWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("lorem-ipsum")!;

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

const SENTENCES = [
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio.",
  "Nullam varius, turpis et commodo pharetra, est eros bibendum elit.",
];

function generateLorem(input: string): string {
  const count = Math.min(Math.max(parseInt(input) || 3, 1), 100);
  const paragraphs: string[] = [];
  for (let i = 0; i < count; i++) {
    const extra = SENTENCES.slice(0, (i % 4) + 1).join(" ");
    paragraphs.push(i === 0 ? LOREM : `${LOREM} ${extra}`);
  }
  return paragraphs.join("\n\n");
}

export function LoremIpsumClient() {
  const handleProcess = useCallback((input: string): string => {
    return generateLorem(input);
  }, []);

  return (
    <TextWorkspace
      title={tool.title}
      description={tool.longDescription}
      onProcess={handleProcess}
      faq={tool.faq}
      inputLabel="Number of paragraphs"
      inputPlaceholder="3"
      outputLabel="Generated Text"
      autoProcess={false}
      processLabel="Generate"
    />
  );
}
