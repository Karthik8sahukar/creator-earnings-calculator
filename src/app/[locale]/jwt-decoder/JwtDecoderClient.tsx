"use client";

import { useMemo, useState } from "react";
import { decodeJwt, isExpired, getExpiryInfo, unixToDate, SAMPLE_JWT } from "@/lib/developer";
import { CopyButton, PrivacyBadge, ToolError } from "@/components/developer";

export function JwtDecoderClient() {
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { decoded: decodeJwt(input), error: null };
    } catch (e) {
      return { decoded: null, error: e instanceof Error ? e.message : "Invalid token" };
    }
  }, [input]);

  const decoded = result?.decoded;
  const expiry = decoded ? getExpiryInfo(decoded.payload) : null;

  return (
    <section className="space-y-6">
      <PrivacyBadge />
      <div className="card p-6 sm:p-8 space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          This tool decodes the token only. It does not verify the signature or authenticity.
        </div>
        <label htmlFor="jwt-input" className="label">Paste JWT Token</label>
        <textarea id="jwt-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." rows={4} className="input font-mono text-xs resize-y" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setInput(SAMPLE_JWT)} className="btn-secondary text-xs">Sample</button>
          <button type="button" onClick={() => setInput("")} disabled={!input} className="btn-secondary text-xs">Clear</button>
        </div>
      </div>

      <ToolError message={result?.error || null} />

      {decoded && (
        <div className="space-y-4">
          {expiry && (
            <div className={`card p-4 text-center font-medium ${expiry.expired ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
              {expiry.expired ? `Token expired ${expiry.label}` : `Token expires in ${expiry.label}`}
            </div>
          )}
          <div className="card p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Header</h2>
              <CopyButton text={JSON.stringify(decoded.header, null, 2)} label="Copy Header" />
            </div>
            <pre className="input font-mono text-xs bg-slate-50 dark:bg-slate-900/50 whitespace-pre-wrap overflow-auto max-h-48">{JSON.stringify(decoded.header, null, 2)}</pre>
            <div className="flex flex-wrap gap-2">
              {decoded.header.alg && <span className="chip">Algorithm: {decoded.header.alg}</span>}
              {decoded.header.typ && <span className="chip">Type: {decoded.header.typ}</span>}
            </div>
          </div>
          <div className="card p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Payload</h2>
              <CopyButton text={JSON.stringify(decoded.payload, null, 2)} label="Copy Payload" />
            </div>
            <pre className="input font-mono text-xs bg-slate-50 dark:bg-slate-900/50 whitespace-pre-wrap overflow-auto max-h-64">{JSON.stringify(decoded.payload, null, 2)}</pre>
            <div className="space-y-2">
              {decoded.payload.iss && <ClaimRow label="Issuer" value={String(decoded.payload.iss)} />}
              {decoded.payload.sub && <ClaimRow label="Subject" value={String(decoded.payload.sub)} />}
              {decoded.payload.aud && <ClaimRow label="Audience" value={Array.isArray(decoded.payload.aud) ? decoded.payload.aud.join(", ") : String(decoded.payload.aud)} />}
              {decoded.payload.iat && <ClaimRow label="Issued At" value={unixToDate(decoded.payload.iat)} />}
              {decoded.payload.exp && <ClaimRow label="Expires At" value={unixToDate(decoded.payload.exp)} />}
              {decoded.payload.nbf && <ClaimRow label="Not Before" value={unixToDate(decoded.payload.nbf)} />}
            </div>
          </div>
          <div className="flex justify-center">
            <CopyButton text={JSON.stringify({ header: decoded.header, payload: decoded.payload }, null, 2)} label="Copy Full Decoded JSON" />
          </div>
        </div>
      )}
    </section>
  );
}

function ClaimRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500 dark:text-slate-400 min-w-[80px]">{label}:</span>
      <span className="font-mono text-slate-900 dark:text-slate-100 truncate">{value}</span>
    </div>
  );
}
