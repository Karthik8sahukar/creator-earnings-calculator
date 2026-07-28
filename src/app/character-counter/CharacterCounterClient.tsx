"use client";

import { useCallback, useMemo, useState } from "react";
import { computeTextStats, formatTime } from "@/lib/decision";

const CHARACTER_LIMITS = [
  { platform: "Twitter/X", limit: 280 },
  { platform: "Instagram Bio", limit: 150 },
  { platform: "Instagram Caption", limit: 2200 },
  { platform: "LinkedIn Post", limit: 3000 },
  { platform: "Facebook Post", limit: 63206 },
  { platform: "YouTube Title", limit: 100 },
  { platform: "YouTube Description", limit: 5000 },
  { platform: "TikTok Caption", limit: 2200 },
  { platform: "Meta Description", limit: 160 },
  { platform: "SEO Title", limit: 60 },
];

export function CharacterCounterClient() {
  const [text, setText] = useState("");

  const stats = useMemo(() => computeTextStats(text), [text]);

  const handlePaste = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      const clip = await navigator.clipboard.readText();
      setText(clip);
    } catch { /* clipboard permission denied — silent */ }
  }, []);

  const handleCopy = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch { /* silent */ }
  }, [text]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "text-content.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [text]);

  return (
    <section className="space-y-6">
      {/* Main textarea */}
      <div className="card p-6 sm:p-8 space-y-4">
        <label htmlFor="char-input" className="label">
          Enter or paste your text
        </label>
        <textarea
          id="char-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste your text here..."
          rows={8}
          className="input resize-y min-h-[160px] font-mono text-sm"
          aria-describedby="char-stats-live"
        />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handlePaste} className="btn-secondary text-xs">
            Paste
          </button>
          <button type="button" onClick={handleCopy} disabled={!text} className="btn-secondary text-xs">
            Copy
          </button>
          <button type="button" onClick={() => setText("")} disabled={!text} className="btn-secondary text-xs">
            Clear
          </button>
          <button type="button" onClick={handleDownload} disabled={!text} className="btn-secondary text-xs">
            Download TXT
          </button>
        </div>
      </div>

      {/* Live statistics */}
      <div id="char-stats-live" role="status" aria-live="polite" aria-atomic="true" className="card p-6 sm:p-8">
        {text.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg font-medium text-slate-400 dark:text-slate-500">
              Start typing to see live character stats
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Your statistics will update in real time
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatBlock label="Characters" value={stats.characters.toLocaleString()} />
            <StatBlock label="Without Spaces" value={stats.charactersNoSpaces.toLocaleString()} />
            <StatBlock label="Words" value={stats.words.toLocaleString()} />
            <StatBlock label="Sentences" value={stats.sentences.toLocaleString()} />
            <StatBlock label="Paragraphs" value={stats.paragraphs.toLocaleString()} />
            <StatBlock label="Lines" value={stats.lines.toLocaleString()} />
            <StatBlock label="Whitespace" value={stats.whitespaceCount.toLocaleString()} />
            <StatBlock label="Reading Time" value={formatTime(stats.readingTimeMinutes)} />
            <StatBlock label="Speaking Time" value={formatTime(stats.speakingTimeMinutes)} />
            <StatBlock label="Avg Word Length" value={stats.averageWordLength.toFixed(1)} />
            <StatBlock label="Longest Word" value={stats.longestWord || "—"} />
            <StatBlock label="Line Count" value={stats.lines.toLocaleString()} />
          </div>
        )}
      </div>

      {/* Character limits reference */}
      <div className="card p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Character Limits by Platform
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {CHARACTER_LIMITS.map(({ platform, limit }) => {
            const pct = text.length > 0 ? Math.min((stats.characters / limit) * 100, 100) : 0;
            const over = stats.characters > limit;
            return (
              <div key={platform} className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{platform}</p>
                  <p className={`text-xs ${over ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
                    {stats.characters}/{limit.toLocaleString()}
                  </p>
                </div>
                <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-brand-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Educational section */}
      <div className="card p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Why Use a Character Counter?
        </h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-3">
          <p>
            A character counter is essential for content creators, marketers, and writers who need to optimize text for specific platforms. Social media platforms, search engines, and messaging apps all enforce strict character limits.
          </p>
          <p>
            Exceeding character limits can result in truncated posts, lost engagement, or poor SEO performance. Our real-time character counter helps you stay within limits while maximizing your message impact.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Optimize tweets and social posts for maximum visibility</li>
            <li>Craft meta descriptions that display fully in search results</li>
            <li>Write SEO titles under 60 characters for Google</li>
            <li>Monitor word count for blog posts and essays</li>
            <li>Track reading and speaking time for presentations</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{value}</p>
    </div>
  );
}
