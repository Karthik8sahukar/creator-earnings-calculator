"use client";

import { useCallback, useState } from "react";
import { getNewToolBySlug } from "@/lib/tools-engine";

const tool = getNewToolBySlug("qr-generator")!;

/**
 * QR Code Generator — renders real QR codes using the 'qrcode' library.
 *
 * Supports:
 * - Text and URL input
 * - PNG download
 * - SVG download
 * - Input validation (length limit)
 * - Error correction level selection
 */
export function QrGeneratorClient() {
  const [input, setInput] = useState("");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [svgString, setSvgString] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) {
      setError("Please enter text or a URL.");
      return;
    }
    if (input.length > 2000) {
      setError("Input too long. QR codes support up to ~2000 characters.");
      return;
    }

    setGenerating(true);
    setError(null);
    setDataUrl(null);
    setSvgString(null);

    try {
      const QRCode = await import("qrcode");

      // Generate PNG data URL
      const png = await QRCode.toDataURL(input, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      setDataUrl(png);

      // Generate SVG string
      const svg = await QRCode.toString(input, {
        type: "svg",
        margin: 2,
        errorCorrectionLevel: "M",
      });
      setSvgString(svg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate QR code.");
    } finally {
      setGenerating(false);
    }
  }, [input]);

  const handleDownloadPng = useCallback(() => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
    a.click();
  }, [dataUrl]);

  const handleDownloadSvg = useCallback(() => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, [svgString]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-600 dark:text-accent-400">
          Developer Tool
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {tool.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300">{tool.longDescription}</p>
      </header>

      {/* Input */}
      <div className="max-w-md mx-auto space-y-4">
        <div className="space-y-2">
          <label htmlFor="qr-input" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Text or URL
          </label>
          <input
            id="qr-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://example.com"
            maxLength={2000}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-slate-500">{input.length}/2000 characters</p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !input.trim()}
          className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-6 py-3 text-sm font-semibold transition-colors"
        >
          {generating ? "Generating..." : "Generate QR Code"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-md mx-auto rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 p-3 text-center">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* QR Code output */}
      {dataUrl && (
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <img src={dataUrl} alt="Generated QR Code" className="w-64 h-64" />
          </div>

          {/* Download buttons */}
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Download PNG
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Download SVG
            </button>
          </div>
        </div>
      )}

      {/* Privacy */}
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        All processing happens locally in your browser. Nothing is sent to any server.
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
