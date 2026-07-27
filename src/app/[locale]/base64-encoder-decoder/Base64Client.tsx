"use client";

import { useCallback, useState } from "react";
import { encodeBase64, decodeBase64, encodeBase64Url, decodeBase64Url, BASE64_SAMPLE_TEXT } from "@/lib/developer";

type Mode = "encode" | "decode";
type Variant = "standard" | "url-safe";

export function Base64Client() {
  const [mode, setMode] = useState<Mode>("encode");
  const [variant, setVariant] = useState<Variant>("standard");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleProcess = useCallback(() => {
    setError(null);
    setCopied(false);
    if (!input.trim()) {
      setOutput("");
      return;
    }
    try {
      let result: string;
      if (mode === "encode") {
        result = variant === "url-safe" ? encodeBase64Url(input) : encodeBase64(input);
      } else {
        result = variant === "url-safe" ? decodeBase64Url(input) : decodeBase64(input);
      }
      setOutput(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
      setOutput("");
    }
  }, [input, mode, variant]);

  const handleSwap = useCallback(() => {
    setInput(output);
    setOutput("");
    setMode((m) => (m === "encode" ? "decode" : "encode"));
    setError(null);
  }, [output]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = output;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  return (
    <section className="space-y-6">
      <div className="card p-6 sm:p-8 space-y-4">
        {/* Mode + Variant selection */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden" role="radiogroup" aria-label="Mode">
            <button
              type="button"
              role="radio"
              aria-checked={mode === "encode"}
              onClick={() => { setMode("encode"); setOutput(""); setError(null); }}
              className={`px-4 py-2 text-xs font-medium transition-colors ${mode === "encode" ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              Encode
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={mode === "decode"}
              onClick={() => { setMode("decode"); setOutput(""); setError(null); }}
              className={`px-4 py-2 text-xs font-medium transition-colors ${mode === "decode" ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              Decode
            </button>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden" role="radiogroup" aria-label="Base64 variant">
            <button
              type="button"
              role="radio"
              aria-checked={variant === "standard"}
              onClick={() => { setVariant("standard"); setOutput(""); setError(null); }}
              className={`px-3 py-2 text-xs font-medium transition-colors ${variant === "standard" ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              Standard
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={variant === "url-safe"}
              onClick={() => { setVariant("url-safe"); setOutput(""); setError(null); }}
              className={`px-3 py-2 text-xs font-medium transition-colors ${variant === "url-safe" ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              URL-safe
            </button>
          </div>
        </div>

        {/* Input */}
        <label htmlFor="b64-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {mode === "encode" ? "Text to encode" : "Base64 to decode"}
        </label>
        <textarea
          id="b64-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "encode" ? "Enter text to encode..." : "Enter Base64 string to decode..."}
          rows={5}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 font-mono text-xs text-slate-900 dark:text-slate-100 resize-y focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          spellCheck={false}
        />

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleProcess} disabled={!input.trim()} className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50">
            {mode === "encode" ? "Encode" : "Decode"}
          </button>
          <button type="button" onClick={handleSwap} disabled={!output} className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
            ⇅ Swap
          </button>
          <button type="button" onClick={() => setInput(BASE64_SAMPLE_TEXT)} className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Example
          </button>
          <button type="button" onClick={() => { setInput(""); setOutput(""); setError(null); }} className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Clear
          </button>
        </div>

        {error && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>}
      </div>

      {/* Output */}
      {output && (
        <div className="card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {mode === "encode" ? "Encoded Base64" : "Decoded Text"}
            </h2>
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${copied ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
              aria-label={copied ? "Copied to clipboard" : "Copy output"}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 font-mono text-xs text-slate-900 dark:text-slate-100 overflow-auto max-h-48 whitespace-pre-wrap break-all" aria-live="polite">
            {output}
          </pre>
        </div>
      )}
    </section>
  );
}
