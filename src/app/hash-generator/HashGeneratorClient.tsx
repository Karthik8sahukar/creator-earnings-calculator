"use client";

import { useCallback } from "react";
import { CodeWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("hash-generator")!;

async function generateHashes(input: string): Promise<string> {
  if (!input.trim()) return "Enter text to generate cryptographic hashes.";

  const enc = new TextEncoder();
  const data = enc.encode(input);
  const results: string[] = [];

  const algorithms: Array<{ name: string; label: string; note?: string }> = [
    { name: "SHA-256", label: "SHA-256", note: "Recommended for most purposes" },
    { name: "SHA-384", label: "SHA-384" },
    { name: "SHA-512", label: "SHA-512" },
    { name: "SHA-1", label: "SHA-1", note: "INSECURE — do not use for security" },
  ];

  for (const algo of algorithms) {
    const hash = await crypto.subtle.digest(algo.name, data);
    const hex = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const note = algo.note ? ` (${algo.note})` : "";
    results.push(`${algo.label}${note}:\n${hex}`);
  }

  results.push("\nNote: These are one-way hashes, NOT encryption.");
  results.push("Never use raw hashes for password storage — use bcrypt, scrypt, or Argon2.");

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
