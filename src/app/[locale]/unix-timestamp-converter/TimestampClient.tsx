"use client";

import { useEffect, useMemo, useState } from "react";
import { timestampToDate, dateToTimestamp, currentTimestamp, detectUnit } from "@/lib/developer";
import { CopyButton, PrivacyBadge, ToolError } from "@/components/developer";

export function TimestampClient() {
  const [input, setInput] = useState("");
  const [live, setLive] = useState(true);
  const [now, setNow] = useState(currentTimestamp);
  const [dateInput, setDateInput] = useState("");

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(currentTimestamp()), 1000);
    return () => clearInterval(id);
  }, [live]);


  const result = useMemo(() => {
    if (!input.trim()) return null;
    const num = Number(input.trim());
    if (isNaN(num)) return { data: null, error: "Enter a valid number" };
    try {
      return { data: timestampToDate(num), error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : "Invalid timestamp" };
    }
  }, [input]);

  const dateResult = useMemo(() => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return dateToTimestamp(d);
  }, [dateInput]);

  const detectedUnit = input.trim() && !isNaN(Number(input.trim()))
    ? detectUnit(Number(input.trim())) : null;

  return (
    <section className="space-y-6">
      <PrivacyBadge />
      <div className="card p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Current Time</h2>
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} className="rounded" /> Live
          </label>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Seconds:</span>
            <code className="font-mono text-sm">{now.seconds}</code>
            <CopyButton text={String(now.seconds)} label="Copy" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Milliseconds:</span>
            <code className="font-mono text-sm">{now.milliseconds}</code>
            <CopyButton text={String(now.milliseconds)} label="Copy" />
          </div>
        </div>
      </div>


      <div className="card p-6 sm:p-8 space-y-4">
        <label htmlFor="ts-input" className="label">Timestamp to Date</label>
        <input id="ts-input" type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. 1700000000 or 1700000000000" className="input font-mono text-sm" />
        {detectedUnit && <span className="chip">Detected: {detectedUnit}</span>}
        <button type="button" onClick={() => setInput("")} disabled={!input} className="btn-secondary text-xs">Clear</button>
      </div>

      <ToolError message={result?.error || null} />

      {result?.data && (
        <div className="card p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Converted Result</h2>
          <Row label="Seconds" value={String(result.data.seconds)} />
          <Row label="Milliseconds" value={String(result.data.milliseconds)} />
          <Row label="ISO 8601" value={result.data.iso} />
          <Row label="UTC" value={result.data.utc} />
          <Row label={`Local (${result.data.localTimezone})`} value={result.data.local} />
          <Row label="Relative" value={result.data.relative} />
        </div>
      )}

      <div className="card p-6 sm:p-8 space-y-4">
        <label htmlFor="date-input" className="label">Date to Timestamp</label>
        <input id="date-input" type="datetime-local" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="input text-sm" />
        {dateResult && (
          <div className="space-y-2">
            <Row label="Seconds" value={String(dateResult.seconds)} />
            <Row label="Milliseconds" value={String(dateResult.milliseconds)} />
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{label}:</span>
        <code className="font-mono text-xs text-slate-900 dark:text-slate-100 truncate">{value}</code>
      </div>
      <CopyButton text={value} label="Copy" />
    </div>
  );
}
