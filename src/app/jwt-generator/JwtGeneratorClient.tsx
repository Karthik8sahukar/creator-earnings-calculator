"use client";

import { useCallback } from "react";
import { CodeWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("jwt-generator")!;

function generateJwt(input: string): string {
  const [payloadStr, secret] = input.split("---SECRET---");
  if (!payloadStr || !secret)
    return "Enter payload above ---SECRET--- line, then your secret below it";
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const payload = btoa(payloadStr.trim())
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const sig = btoa(secret.trim())
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${header}.${payload}.${sig}`;
}

export function JwtGeneratorClient() {
  const handleProcess = useCallback((input: string): string => {
    return generateJwt(input);
  }, []);

  return (
    <CodeWorkspace
      title={tool.title}
      description={tool.longDescription}
      onProcess={handleProcess}
      processLabel="Generate"
      inputPlaceholder={'{"sub":"1234"}\n---SECRET---\nmy-secret-key'}
      faq={tool.faq}
    />
  );
}
