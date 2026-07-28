"use client";

import { useCallback } from "react";
import { CodeWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("html-formatter")!;

function formatHtml(html: string): string {
  let indent = 0;
  const lines: string[] = [];
  const tokens = html.replace(/>\s*</g, ">\n<").split("\n");
  for (const token of tokens) {
    const t = token.trim();
    if (!t) continue;
    if (t.startsWith("</")) indent = Math.max(0, indent - 1);
    lines.push("  ".repeat(indent) + t);
    if (t.startsWith("<") && !t.startsWith("</") && !t.endsWith("/>") && !t.startsWith("<!")) indent++;
  }
  return lines.join("\n");
}

export function HtmlFormatterClient() {
  const handleProcess = useCallback((input: string): string => {
    return formatHtml(input);
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
