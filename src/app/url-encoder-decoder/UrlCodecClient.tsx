"use client";

import { useMemo, useState } from "react";
import { safeEncode, safeDecode, COMMON_ENCODINGS, SAMPLE_URL } from "@/lib/developer";
import type { UrlMode } from "@/lib/developer";
import { CopyButton, PrivacyBadge, ToolError } from "@/components/developer";

export function UrlCodecClient() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [mode, setMode] = useState<UrlMode>("component");

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return direction === "encode" ? safeEncode(input, mode) : safeDecode(input, mode);
  }, [input, direction, mode]);

  const swap = () => {
    if (result?.result) { setInput(result.result); setDirection(direction === "encode" ? "decode" : "encode"); }
  };

  return (
    <section className="space-y-6">
      <PrivacyBadge />
      <div className="card p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setDirection("encode")} className={direction === "encode" ? "btn-primary text-xs" : "btn-secondary text-xs"}>Encode</button>
          <button type="button" onClick={() => setDirection("decode")} className={direction === "decode" ? "btn-primary text-xs" : "btn-secondary text-xs"}>Decode</button>
          <span className="mx-2 border-l border-slate-200 dark:border-slate-700" />
          <button type="button" onClick={() => setMode("component")} className={mode === "component" ? "btn-primary text-xs" : "btn-secondary text-xs"}>Component</button>
          <button type="button" onClick={() => setMode("full")} className={mode === "full" ? "btn-primary text-xs" : "btn-secondary text-xs"}>Full URI</button>
        </div>
        <label htmlFor="url-input" className="label">Input</label>
        <textarea id="url-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={direction === "encode" ? "Enter text to encode..." : "Enter encoded text to decode..."} rows={4} className="input font-mono text-xs resize-y" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setInput(SAMPLE_URL)} className="btn-secondary text-xs">Sample</button>
          <button type="button" onClick={swap} disabled={!result?.result} className="btn-secondary text-xs">Swap ⇄</button>
          <button type="button" onClick={() => setInput("")} disabled={!input} className="btn-secondary text-xs">Clear</button>
        </div>
      </div>

      <ToolError message={result?.error || null} />

      {result?.result && (
        <div className="card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Result</h2>
            <CopyButton text={result.result} label="Copy" />
          </div>
          <pre className="input font-mono text-xs bg-slate-50 dark:bg-slate-900/50 whitespace-pre-wrap overflow-auto max-h-48">{result.result}</pre>
        </div>
      )}

      <details className="card p-6 sm:p-8">
        <summary className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100">Common Encodings Reference</summary>
        <table className="mt-4 w-full text-xs">
          <thead><tr className="text-left text-slate-500"><th className="pb-2">Char</th><th className="pb-2">Encoded</th><th className="pb-2">Name</th></tr></thead>
          <tbody>
            {COMMON_ENCODINGS.map((e) => (
              <tr key={e.char} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-1 font-mono">{e.char}</td>
                <td className="py-1 font-mono">{e.encoded}</td>
                <td className="py-1">{e.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
