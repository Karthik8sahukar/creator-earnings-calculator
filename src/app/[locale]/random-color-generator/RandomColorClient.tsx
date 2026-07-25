"use client";

import { useCallback, useState } from "react";
import {
  generateRandomColor,
  complementary,
  analogous,
  triadic,
  monochrome,
  randomPalette,
  generateGradient,
  getContrastInfo,
} from "@/lib/decision";
import type { ColorData } from "@/lib/decision";

type PaletteMode = "random" | "complementary" | "analogous" | "triadic" | "monochrome";

export function RandomColorClient() {
  const [color, setColor] = useState<ColorData | null>(null);
  const [locked, setLocked] = useState(false);
  const [palette, setPalette] = useState<ColorData[]>([]);
  const [paletteMode, setPaletteMode] = useState<PaletteMode>("random");
  const [gradient, setGradient] = useState<string>("");
  const [copied, setCopied] = useState<string>("");

  const generate = useCallback(() => {
    if (locked) return;
    const newColor = generateRandomColor();
    setColor(newColor);
    setPalette([]);
    setGradient("");
  }, [locked]);

  const handleGeneratePalette = useCallback((mode: PaletteMode) => {
    const baseColor = color || generateRandomColor();
    if (!color) setColor(baseColor);
    setPaletteMode(mode);
    switch (mode) {
      case "random": setPalette(randomPalette()); break;
      case "complementary": setPalette([baseColor, complementary(baseColor)]); break;
      case "analogous": setPalette(analogous(baseColor)); break;
      case "triadic": setPalette(triadic(baseColor)); break;
      case "monochrome": setPalette(monochrome(baseColor)); break;
    }
  }, [color]);

  const handleGenerateGradient = useCallback(() => {
    const c1 = color || generateRandomColor();
    const c2 = generateRandomColor();
    if (!color) setColor(c1);
    setGradient(generateGradient(c1, c2));
  }, [color]);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch { /* silent */ }
  }, []);

  const contrast = color ? getContrastInfo(color) : null;

  return (
    <section className="space-y-6">
      {/* Main color display */}
      <div className="card p-6 sm:p-8 space-y-6">
        {/* Color preview */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-full max-w-sm h-40 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-card transition-colors duration-300"
            style={{ backgroundColor: color?.hex || "#e2e8f0" }}
            aria-label={color ? `Color preview: ${color.hex}` : "No color generated yet"}
          />
          {!color && (
            <p className="text-sm text-slate-400 dark:text-slate-500">Click Generate to create a random color</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={generate} disabled={locked} className="btn-primary">
            Generate
          </button>
          <button type="button" onClick={() => setLocked(!locked)} className={`btn-secondary ${locked ? "ring-2 ring-brand-500" : ""}`}>
            {locked ? "Unlock" : "Lock Color"}
          </button>
        </div>

        {/* Color values */}
        {color && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ColorValue label="HEX" value={color.hex} copied={copied} onCopy={copyToClipboard} />
            <ColorValue label="RGB" value={`rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`} copied={copied} onCopy={copyToClipboard} />
            <ColorValue label="HSL" value={`hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`} copied={copied} onCopy={copyToClipboard} />
            <ColorValue label="HSV" value={`hsv(${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%)`} copied={copied} onCopy={copyToClipboard} />
            <ColorValue label="CMYK" value={`cmyk(${color.cmyk.c}%, ${color.cmyk.m}%, ${color.cmyk.y}%, ${color.cmyk.k}%)`} copied={copied} onCopy={copyToClipboard} />
          </div>
        )}
      </div>

      {/* Accessibility info */}
      {color && contrast && (
        <div className="card p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Accessibility & Contrast</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">On White</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{contrast.contrastOnWhite}:1</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">On Black</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{contrast.contrastOnBlack}:1</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">WCAG AA</p>
              <p className={`text-lg font-bold ${contrast.wcagAA ? "text-green-600" : "text-red-500"}`}>{contrast.wcagAA ? "Pass" : "Fail"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Recommend</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 capitalize">{contrast.recommendation} bg</p>
            </div>
          </div>
        </div>
      )}

      {/* Palette generators */}
      <div className="card p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Generate Palettes</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => handleGeneratePalette("random")} className="btn-secondary text-xs">Random Palette</button>
          <button type="button" onClick={() => handleGeneratePalette("complementary")} disabled={!color} className="btn-secondary text-xs">Complementary</button>
          <button type="button" onClick={() => handleGeneratePalette("analogous")} disabled={!color} className="btn-secondary text-xs">Analogous</button>
          <button type="button" onClick={() => handleGeneratePalette("triadic")} disabled={!color} className="btn-secondary text-xs">Triadic</button>
          <button type="button" onClick={() => handleGeneratePalette("monochrome")} disabled={!color} className="btn-secondary text-xs">Monochrome</button>
          <button type="button" onClick={handleGenerateGradient} className="btn-secondary text-xs">Gradient</button>
        </div>

        {/* Palette display */}
        {palette.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{paletteMode} Palette</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {palette.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => copyToClipboard(c.hex, c.hex)}
                  className="shrink-0 w-16 h-20 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-end pb-1 transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  style={{ backgroundColor: c.hex }}
                  title={`Copy ${c.hex}`}
                >
                  <span className="text-[9px] font-mono bg-white/80 dark:bg-black/60 rounded px-1 text-slate-800 dark:text-slate-200">{c.hex}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gradient display */}
        {gradient && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Generated Gradient</p>
            <div className="h-20 rounded-xl border border-slate-200 dark:border-slate-700" style={{ background: gradient }} />
            <button type="button" onClick={() => copyToClipboard(gradient, "gradient")} className="btn-secondary text-xs">
              {copied === "gradient" ? "Copied!" : "Copy CSS"}
            </button>
          </div>
        )}
      </div>

      {/* Educational section */}
      <div className="card p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          How to Use the Color Generator
        </h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-3">
          <p>
            Click Generate to create a random color. Lock a color you like, then generate palettes based on color theory: complementary, analogous, triadic, or monochrome.
          </p>
          <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">Use Cases</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Design inspiration for web and graphic projects</li>
            <li>Generate accessible color combinations with contrast checking</li>
            <li>Create harmonious palettes using color theory</li>
            <li>Quick CSS gradient generation for backgrounds</li>
            <li>Brand color exploration and moodboards</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function ColorValue({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: string;
  onCopy: (text: string, label: string) => void;
}) {
  const isCopied = copied === label;
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-mono text-slate-900 dark:text-slate-100 truncate">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value, label)}
        className="ml-2 shrink-0 rounded-md px-2 py-1 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
        aria-label={`Copy ${label} value`}
      >
        {isCopied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
