"use client";

import { useCallback } from "react";
import { CodeWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("markdown-preview")!;

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n/g, "<br>");
}

export function MarkdownPreviewClient() {
  const handleProcess = useCallback((input: string): string => {
    return markdownToHtml(input);
  }, []);

  return (
    <CodeWorkspace
      title={tool.title}
      description={tool.longDescription}
      onProcess={handleProcess}
      processLabel="Preview"
      outputLabel="HTML Output"
      faq={tool.faq}
    />
  );
}
