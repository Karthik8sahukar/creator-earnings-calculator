"use client";

import { useCallback } from "react";
import { CodeWorkspace } from "@/components/workspaces";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("jwt-generator")!;

/** Base64URL encode a string. */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/** Base64URL encode a Uint8Array. */
function uint8ToBase64Url(arr: Uint8Array): string {
  let binary = "";
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function generateJwt(input: string): Promise<string> {
  const parts = input.split("---SECRET---");
  if (parts.length < 2) {
    return "Enter JSON payload above the ---SECRET--- line, then your signing secret below it.\n\nExample:\n{\"sub\":\"1234\",\"name\":\"Test User\"}\n---SECRET---\nmy-secret-key";
  }

  const payloadStr = parts[0].trim();
  const secret = parts[1].trim();

  if (!secret) {
    return "Error: Secret cannot be empty. Enter a signing secret below the ---SECRET--- line.";
  }

  if (secret.length < 8) {
    return "Warning: Secret is very short. Use at least 8 characters for testing.";
  }

  // Validate payload is valid JSON
  try {
    JSON.parse(payloadStr);
  } catch {
    return "Error: Payload is not valid JSON. Enter a valid JSON object.";
  }

  // Create header and payload
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(payloadStr);
  const signingInput = `${header}.${payload}`;

  // Sign with HMAC-SHA256 using Web Crypto API
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));
  const sig = uint8ToBase64Url(new Uint8Array(signature));

  const token = `${signingInput}.${sig}`;

  return [
    "Generated JWT (HS256):",
    "",
    token,
    "",
    "--- Decoded Header ---",
    JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2),
    "",
    "--- Decoded Payload ---",
    JSON.stringify(JSON.parse(payloadStr), null, 2),
    "",
    "--- Note ---",
    "This token is for DEVELOPMENT AND TESTING only.",
    "Do not use in production without a proper auth server.",
    "Your secret never leaves this browser.",
  ].join("\n");
}

export function JwtGeneratorClient() {
  const handleProcess = useCallback(async (input: string): Promise<string> => {
    return generateJwt(input);
  }, []);

  return (
    <CodeWorkspace
      title={tool.title}
      description={tool.longDescription}
      onProcess={handleProcess}
      processLabel="Generate JWT"
      inputPlaceholder="Enter JSON payload, then ---SECRET---, then your secret key"
      exampleInput={'{"sub":"1234","name":"Test User","iat":1700000000}\n---SECRET---\nmy-secret-key-for-testing'}
      badge="Developer Tool (Testing Only)"
      faq={tool.faq}
    />
  );
}
