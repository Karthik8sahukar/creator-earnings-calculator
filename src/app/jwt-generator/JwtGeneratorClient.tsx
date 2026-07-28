"use client";

import { useCallback, useState } from "react";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("jwt-generator")!;

const EXAMPLE_PAYLOAD = `{
  "sub": "1234",
  "name": "Test User",
  "iat": 1700000000
}`;
const EXAMPLE_SECRET = "my-secret-key-for-testing";

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

/** Generate a cryptographically secure random secret (32 bytes, hex). */
function generateRandomSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function JwtGeneratorClient() {
  const [payload, setPayload] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setToken("");

    if (!payload.trim()) {
      setError("Payload is required. Enter a JSON object.");
      return;
    }
    if (!secret.trim()) {
      setError("Secret is required. Enter a signing secret or generate a random one.");
      return;
    }
    if (secret.trim().length < 8) {
      setError("Secret is too short. Use at least 8 characters.");
      return;
    }

    let parsedPayload: object;
    try {
      parsedPayload = JSON.parse(payload.trim());
      if (typeof parsedPayload !== "object" || parsedPayload === null) {
        throw new Error("not an object");
      }
    } catch {
      setError("Payload must be a valid JSON object.");
      return;
    }

    setGenerating(true);

    try {
      const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payloadB64 = base64UrlEncode(JSON.stringify(parsedPayload));
      const signingInput = `${header}.${payloadB64}`;

      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret.trim());
      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));
      const sig = uint8ToBase64Url(new Uint8Array(signature));

      setToken(`${signingInput}.${sig}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate token.");
    } finally {
      setGenerating(false);
    }
  }, [payload, secret]);

  const handleUseExample = useCallback(() => {
    setPayload(EXAMPLE_PAYLOAD);
    setSecret(EXAMPLE_SECRET);
    setToken("");
    setError(null);
  }, []);

  const handleGenerateRandom = useCallback(() => {
    setSecret(generateRandomSecret());
  }, []);

  const handleCopy = useCallback(() => {
    if (token) {
      navigator.clipboard.writeText(token).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [token]);

  // Decode token for preview
  let decodedHeader = "";
  let decodedPayload = "";
  if (token) {
    try {
      const [h, p] = token.split(".");
      decodedHeader = JSON.stringify(JSON.parse(atob(h.replace(/-/g, "+").replace(/_/g, "/"))), null, 2);
      decodedPayload = JSON.stringify(JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/"))), null, 2);
    } catch {
      // Ignore decode errors for preview
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-600 dark:text-accent-400">
          Developer Tool — Testing Only
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {tool.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300">{tool.longDescription}</p>
      </header>

      {/* Form */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Algorithm */}
        <div className="space-y-2">
          <label htmlFor="jwt-algo" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Algorithm
          </label>
          <select
            id="jwt-algo"
            disabled
            className="w-full sm:w-auto rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300"
          >
            <option>HS256</option>
          </select>
          <p className="text-xs text-slate-500">HMAC-SHA256. Other algorithms require server-side signing.</p>
        </div>

        {/* Payload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="jwt-payload" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Payload (JSON)
            </label>
            {!payload && (
              <button
                type="button"
                onClick={handleUseExample}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                Use Example
              </button>
            )}
          </div>
          <textarea
            id="jwt-payload"
            value={payload}
            onChange={(e) => { setPayload(e.target.value); setError(null); }}
            placeholder="Enter JWT payload as JSON"
            spellCheck={false}
            className="w-full h-40 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
          />
        </div>

        {/* Secret */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="jwt-secret" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Secret
            </label>
            <button
              type="button"
              onClick={handleGenerateRandom}
              className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              Generate Random
            </button>
          </div>
          <input
            id="jwt-secret"
            type="text"
            value={secret}
            onChange={(e) => { setSecret(e.target.value); setError(null); }}
            placeholder="Enter signing secret"
            spellCheck={false}
            autoComplete="off"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your secret never leaves this browser. Minimum 8 characters.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 p-3" role="alert">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-6 py-3 text-sm font-semibold transition-colors"
        >
          {generating ? "Generating..." : "Generate JWT"}
        </button>

        {/* Output */}
        {token && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="jwt-output" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Output JWT
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <textarea
                id="jwt-output"
                value={token}
                readOnly
                className="w-full h-24 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 font-mono text-xs text-slate-900 dark:text-slate-100 break-all resize-none"
              />
            </div>

            {/* Decoded Preview */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Header</p>
                <pre className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs font-mono text-slate-700 dark:text-slate-300 overflow-auto">
                  {decodedHeader}
                </pre>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payload</p>
                <pre className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs font-mono text-slate-700 dark:text-slate-300 overflow-auto">
                  {decodedPayload}
                </pre>
              </div>
            </div>

            <p className="text-xs text-amber-700 dark:text-amber-300 text-center bg-amber-50 dark:bg-amber-500/10 rounded-lg p-2 border border-amber-200 dark:border-amber-800">
              For development and testing only. Do not use in production without a proper auth server.
            </p>
          </div>
        )}
      </div>

      {/* Privacy */}
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        All processing happens locally in your browser. Your secret never leaves your device.
      </p>

      {/* FAQ */}
      {tool.faq.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Frequently Asked Questions</h2>
          <dl className="space-y-3">
            {tool.faq.map((item) => (
              <div key={item.q} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                <dt className="font-medium text-slate-900 dark:text-slate-100">{item.q}</dt>
                <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
