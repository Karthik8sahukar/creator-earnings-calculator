"use client";

import { useMemo, useState } from "react";
import { encodeBase64, decodeBase64, encodeBase64Url, decodeBase64Url, getByteCount, BASE64_SAMPLE_TEXT, SAMPLE_BASE64 } from "@/lib/developer";
import { CopyButton, PrivacyBadge, ToolError } from "@/components/developer";

type Mode = "encode" | "decode" | "encodeUrl" | "decodeUrl";

export function Base64Client() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", error: null };
    try {
      switch (mode) {
        case "encode": return { output: encodeBase64(input), error: null };
        case "decode": return { output: decodeBase64(input), error: null };
        case "encodeUrl": return { output: encodeBase64Url(input), error: null };
        case "decodeUrl": return { output: decodeBase64Url(input), error: null };
      }
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Invalid input" };
    }
  }, [input, mode]);

  const handleSwap = () => {
    if (!result.output) return;
    setInput(result.output);
    setMode(mode === "encode" ? "decode" : mode === "decode" ? "encode" : mode === "encodeUrl" ? "decodeUrl" : "encodeUrl");
  };

  const handleSample = () => {
    if (mode === "decode" || mode === "decodeUrl") { setInput(SAMPLE_BASE64); } else { setInput(BASE64_SAMPLE_TEXT); }
  };

  return (
    <section className="space-y-6">
      <PrivacyBadge />
      <div className="card p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap gap-2">
          {([["encode", "Encode Base64"], ["decode", "Decode Base64"], ["encodeUrl", "Encode Base64URL"], ["decodeUrl", "Decode Base64URL"]] as const).map(([m, label]) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={mode === m ? "btn-primary text-xs" : "btn-secondary text-xs"}>{label}</button>
          ))}
        </div>
        <label htmlFor="b64-input" className="label">Input</label>
        <textarea id="b64-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode.startsWith("decode") ? "Paste Base64 string..." : "Enter text to encode..."} rows={5} className="input font-mono text-xs resize-y min-h-[100px]" />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleSwap} disabled={!result.output} className="btn-secondary text-xs">↕ Swap</button>
          <button type="button" onClick={handleSample} className="btn-secondary text-xs">Sample</button>
          <button type="button" onClick={() => setInput("")} disabled={!input} className="btn-secondary text-xs">Clear</button>
        </div>
        {input && <p className="text-xs text-slate-500 dark:text-slate-400">{getByteCount(input)} bytes input</p>}
      </div>
      <ToolError message={result.error} />
      {result.output && (
        <div className="card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Output</h2>
            <CopyButton text={result.output} label="Copy" />
          </div>
          <textarea readOnly value={result.output} rows={5} className="input font-mono text-xs bg-slate-50 dark:bg-slate-900/50 resize-y min-h-[100px]" />
          <p className="text-xs text-slate-500 dark:text-slate-400">{getByteCount(result.output)} bytes output</p>
        </div>
      )}
    </section>
  );
}
