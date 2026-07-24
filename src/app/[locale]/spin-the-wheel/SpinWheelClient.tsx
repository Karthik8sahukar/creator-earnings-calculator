"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ResultCard, ActionButtons, HistoryPanel } from "@/components/decision";
import { randomInt, prefersReducedMotion } from "@/lib/decision";

const DEFAULT_SEGMENTS = ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5", "Option 6"];
const COLORS = ["#7c3aed", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export function SpinWheelClient() {
  const [segments, setSegments] = useState<string[]>(DEFAULT_SEGMENTS);
  const [customInput, setCustomInput] = useState(DEFAULT_SEGMENTS.join("\n"));
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState<{ label: string; color?: "green" | "blue" | "neutral" }[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { setReducedMotion(prefersReducedMotion()); }, []);

  // Draw wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
    const logical = 300;
    const physical = Math.round(logical * dpr);
    if (canvas.width !== physical) { canvas.width = physical; canvas.height = physical; canvas.style.width = `${logical}px`; canvas.style.height = `${logical}px`; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, logical, logical);
    const center = logical / 2;
    const radius = center - 4;
    const sliceAngle = (Math.PI * 2) / segments.length;

    segments.forEach((seg, i) => {
      const start = i * sliceAngle - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, start, start + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      // Label
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.min(14, 140 / segments.length)}px system-ui, sans-serif`;
      ctx.fillText(seg.slice(0, 12), radius - 12, 0);
      ctx.restore();
    });
    // Center
    ctx.beginPath(); ctx.arc(center, center, 10, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = "#374151"; ctx.lineWidth = 2; ctx.stroke();
  }, [segments, rotation]);

  const spin = useCallback(() => {
    if (spinning || segments.length < 2) return;
    setSpinning(true);
    setResult(null);
    const winIdx = randomInt(0, segments.length - 1);
    const sliceDeg = 360 / segments.length;
    const target = sliceDeg * winIdx + randomInt(5, Math.floor(sliceDeg) - 5);
    const spins = randomInt(5, 8);
    const final = rotation + spins * 360 + (360 - target);
    setRotation(final);
    const delay = reducedMotion ? 0 : 3000;
    setTimeout(() => { setSpinning(false); setResult(segments[winIdx]); setHistory(h => [{ label: segments[winIdx], color: "blue" }, ...h].slice(0, 30)); }, delay);
  }, [spinning, segments, rotation, reducedMotion]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => { if (e.repeat) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); spin(); } }, [spin]);

  const updateSegments = (val: string) => {
    setCustomInput(val);
    const parsed = val.split(/[\n]+/).map(s => s.trim()).filter(Boolean);
    if (parsed.length >= 2) setSegments(parsed);
  };

  return (
    <section className="space-y-6">
      <div className="card p-6 sm:p-8 space-y-6">
        <label className="block">
          <span className="label">Wheel options (one per line, min 2)</span>
          <textarea value={customInput} onChange={e => updateSegments(e.target.value)} rows={4} className="input mt-1 resize-y min-h-[80px]" disabled={spinning} />
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">{segments.length} segment{segments.length !== 1 ? "s" : ""}</p>

        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-slate-900 dark:border-t-slate-100" />
            <div className={`${reducedMotion ? "transition-none" : "transition-transform duration-[3000ms] ease-[cubic-bezier(0.17,0.67,0.12,0.99)]"}`} style={{ transform: `rotate(${rotation}deg)` }}>
              <canvas ref={canvasRef} aria-hidden="true" className="w-[300px] h-[300px] rounded-full shadow-lg" />
            </div>
          </div>
          <ActionButtons onAction={spin} actionLabel={spinning ? "Spinning\u2026" : "Spin!"} actionDisabled={spinning || segments.length < 2} />
          <div role="status" aria-live="assertive" aria-atomic="true" className="min-h-[60px] flex items-center">
            {result && !spinning && <ResultCard label="Result" value={result} />}
          </div>
        </div>
      </div>
      <HistoryPanel entries={history} onClear={() => setHistory([])} />
    </section>
  );
}
