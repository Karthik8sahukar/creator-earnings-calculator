"use client";

import { useCallback, useMemo, useState } from "react";
import { computeTextStats, formatTime } from "@/lib/decision";

export function WordCounterClient() {
  const [text, setText] = useState("");

  const stats = useMemo(() => computeTextStats(text), [text]);

  const handlePaste = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      const clip = await navigator.clipboard.readText();
      setText(clip);
    } catch { /* silent */ }
  }, []);

  const handleCopy = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch { /* silent */ }
  }, [text]);

  const handleDownloadTxt = useCallback(() => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "text-content.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [text]);

  const handleDownloadMd = useCallback(() => {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "text-content.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [text]);

  return (
    <section className="space-y-6">
      {/* Main textarea */}
      <div className="card p-6 sm:p-8 space-y-4">
        <label htmlFor="word-input" className="label">
          Enter or paste your text
        </label>
        <textarea
          id="word-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste your text here to count words..."
          rows={8}
          className="input resize-y min-h-[160px] font-mono text-sm"
          aria-describedby="word-stats-live"
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
          <button type="button" onClick={handleDownloadTxt} disabled={!text} className="btn-secondary text-xs">
            Export TXT
          </button>
          <button type="button" onClick={handleDownloadMd} disabled={!text} className="btn-secondary text-xs">
            Export Markdown
          </button>
        </div>
      </div>

      {/* Live statistics */}
      <div id="word-stats-live" role="status" aria-live="polite" aria-atomic="true" className="card p-6 sm:p-8">
        {text.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg font-medium text-slate-400 dark:text-slate-500">
              Start typing to see word statistics
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Word count, keyword density, and more — updated live
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatBlock label="Words" value={stats.words.toLocaleString()} highlight />
              <StatBlock label="Unique Words" value={stats.uniqueWords.toLocaleString()} />
              <StatBlock label="Characters" value={stats.characters.toLocaleString()} />
              <StatBlock label="Without Spaces" value={stats.charactersNoSpaces.toLocaleString()} />
              <StatBlock label="Sentences" value={stats.sentences.toLocaleString()} />
              <StatBlock label="Paragraphs" value={stats.paragraphs.toLocaleString()} />
              <StatBlock label="Reading Time" value={formatTime(stats.readingTimeMinutes)} />
              <StatBlock label="Speaking Time" value={formatTime(stats.speakingTimeMinutes)} />
              <StatBlock label="Avg Sentence Len" value={stats.averageSentenceLength.toFixed(1) + " words"} />
              <StatBlock label="Avg Paragraph Len" value={stats.averageParagraphLength.toFixed(0) + " words"} />
              <StatBlock label="Est. Pages" value={stats.estimatedPages.toFixed(1)} />
              <StatBlock label="Est. A4 Pages" value={stats.estimatedA4Pages.toFixed(1)} />
            </div>

            {/* Keyword Density */}
            {stats.keywordDensity.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Keyword Density</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {stats.keywordDensity.map((entry) => (
                    <div key={entry.word} className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate flex-1">{entry.word}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{entry.count}×</span>
                      <span className="text-xs font-medium text-brand-600 dark:text-brand-300">{entry.density.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most Frequent Words */}
            {stats.mostFrequentWords.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Most Frequent Words</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.mostFrequentWords.map((entry) => (
                    <span key={entry.word} className="chip">
                      {entry.word} <span className="text-[10px] opacity-60">({entry.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Educational section */}
      <div className="card p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          How to Use the Word Counter
        </h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-3">
          <p>
            Paste or type your text into the input area above. The word counter analyzes your text instantly — no button clicks needed. You will see word count, unique words, keyword density, reading time, page estimates, and more.
          </p>
          <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">Benefits</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Track essay and blog post word counts against targets</li>
            <li>Identify overused keywords with density analysis</li>
            <li>Estimate page counts for print formatting</li>
            <li>Calculate reading time for audience expectations</li>
            <li>Export your text in TXT or Markdown format</li>
          </ul>
          <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">Use Cases</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Academic essays with strict word count requirements</li>
            <li>SEO content writing with keyword density targets</li>
            <li>Blog posts and articles (ideal: 1,500-2,500 words)</li>
            <li>Social media captions and short-form content</li>
            <li>Speeches and presentations (150 words per minute)</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function StatBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 text-center ${highlight ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20" : "border-slate-200 dark:border-slate-700"}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold truncate ${highlight ? "text-brand-700 dark:text-brand-300" : "text-slate-900 dark:text-slate-100"}`}>{value}</p>
    </div>
  );
}
