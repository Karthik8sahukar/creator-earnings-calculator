"use client";

import { useMemo, useState } from "react";
import { executeRegex, applyReplace, SAMPLE_PATTERN, REGEX_SAMPLE_TEXT, SAMPLE_FLAGS } from "@/lib/developer";
import type { RegexFlag } from "@/lib/developer";
import { CopyButton, PrivacyBadge, ToolError } from "@/components/developer";

const ALL_FLAGS: { flag: RegexFlag; label: string }[] = [
  { flag: "g", label: "global" }, { flag: "i", label: "case-insensitive" },
  { flag: "m", label: "multiline" }, { flag: "s", label: "dotAll" },
  { flag: "u", label: "unicode" }, { flag: "y", label: "sticky" },
];

export function RegexTesterClient() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<Set<RegexFlag>>(new Set(["g"]));
  const [text, setText] = useState("");
  const [replacement, setReplacement] = useState("");

  const flagStr = [...flags].join("");
  const result = useMemo(() => executeRegex(pattern, text, flagStr), [pattern, text, flagStr]);
  const replaced = useMemo(() => {
    if (!replacement || !pattern) return null;
    return applyReplace(pattern, text, flagStr, replacement);
  }, [pattern, text, flagStr, replacement]);

  const toggleFlag = (f: RegexFlag) => {
    const next = new Set(flags);
    if (next.has(f)) {
      next.delete(f);
    } else {
      next.add(f);
    }
    setFlags(next);
  };

  const loadSample = () => { setPattern(SAMPLE_PATTERN); setText(REGEX_SAMPLE_TEXT); setFlags(new Set(SAMPLE_FLAGS.split("") as RegexFlag[])); };

  const segments = useMemo(() => {
    if (!result.matches.length || !text) return null;
    const parts: { text: string; match: boolean }[] = [];
    let last = 0;
    for (const m of result.matches) {
      if (m.index > last) parts.push({ text: text.slice(last, m.index), match: false });
      parts.push({ text: m.match, match: true });
      last = m.index + m.match.length;
    }
    if (last < text.length) parts.push({ text: text.slice(last), match: false });
    return parts;
  }, [result.matches, text]);

  return (
    <section className="space-y-6">
      <PrivacyBadge />
      <div className="card p-6 sm:p-8 space-y-4">
        <span className="chip">JavaScript regex engine</span>
        <label htmlFor="regex-pattern" className="label">Pattern</label>
        <input id="regex-pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="\\b[A-Z][a-z]+\\b" className="input font-mono text-xs" />
        <div className="flex flex-wrap gap-2">
          {ALL_FLAGS.map(({ flag, label }) => (
            <label key={flag} className="flex items-center gap-1 text-xs cursor-pointer">
              <input type="checkbox" checked={flags.has(flag)} onChange={() => toggleFlag(flag)} className="rounded" />
              <span className="font-mono">{flag}</span><span className="text-slate-500">({label})</span>
            </label>
          ))}
        </div>
        <label htmlFor="regex-text" className="label">Test Text</label>
        <textarea id="regex-text" value={text} onChange={(e) => setText(e.target.value)} rows={4} className="input font-mono text-xs resize-y" placeholder="Enter text to test against..." />
        <label htmlFor="regex-replace" className="label">Replacement (optional)</label>
        <input id="regex-replace" value={replacement} onChange={(e) => setReplacement(e.target.value)} placeholder="$1_replaced" className="input font-mono text-xs" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={loadSample} className="btn-secondary text-xs">Sample</button>
          <button type="button" onClick={() => { setPattern(""); setText(""); setReplacement(""); }} className="btn-secondary text-xs">Clear</button>
        </div>
      </div>

      <ToolError message={result.error || null} />

      {result.count > 0 && (
        <div className="card p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Matches ({result.count})</h2>
          {segments && (
            <div className="input font-mono text-xs bg-slate-50 dark:bg-slate-900/50 whitespace-pre-wrap overflow-auto max-h-48">
              {segments.map((s, i) => s.match ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{s.text}</mark> : <span key={i}>{s.text}</span>)}
            </div>
          )}
          {result.matches.some((m) => m.groups.length > 0) && (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Capturing Groups</h3>
              {result.matches.map((m, i) => m.groups.length > 0 && (
                <div key={i} className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  Match {i + 1}: {m.groups.map((g, j) => <span key={j} className="chip ml-1">${j + 1}={g}</span>)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {replaced?.result && (
        <div className="card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Replacement Preview</h2>
            <CopyButton text={replaced.result} label="Copy" />
          </div>
          <pre className="input font-mono text-xs bg-slate-50 dark:bg-slate-900/50 whitespace-pre-wrap overflow-auto max-h-48">{replaced.result}</pre>
        </div>
      )}
    </section>
  );
}
