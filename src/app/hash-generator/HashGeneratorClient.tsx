"use client";

import { useCallback } from "react";
import { CodeWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("hash-generator")!;

async function generateHashes(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const results: string[] = [];
  for (const algo of ["SHA-1", "SHA-256", "SHA-512"]) {
    const hash = await crypto.subtle.digest(algo, data);
    const hex = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    results.push(`${algo}: ${hex}`);
  }
  return results.join("\n\n");
}

export function HashGeneratorClient() {
  const handleProcess = useCallback(async (input: string): Promise<string> => {
    return generateHashes(input);
  }, []);

  return (
    <CodeWorkspace
      title={tool.title}
      description={tool.longDescription}
      onProcess={handleProcess}
      processLabel="Generate Hashes"
      faq={tool.faq}
    />
  );
}
