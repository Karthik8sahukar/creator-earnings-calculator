"use client";

import { useCallback } from "react";
import { CodeWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("markdown-preview")!;

function markdownToHtml(md: string): string {
  // Sanitize: strip script tags and event handlers before processing
  const safe = md
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");

  return safe
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      // Reject dangerous URL schemes
      if (/^(javascript|data|vbscript):/i.test(url.trim())) return text;
      return `<a href="${url}">${text}</a>`;
    })
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
