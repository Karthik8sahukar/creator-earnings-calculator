"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ResultCard, ActionButtons, HistoryPanel } from "@/components/decision";
import type { HistoryItem } from "@/components/decision";
import { randomInt, prefersReducedMotion } from "@/lib/decision";

const DEFAULT_SEGMENTS = ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5", "Option 6"];
const COLORS = ["#7c3aed", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

// ─── SVG geometry helpers ───────────────────────────────────────────

const SIZE = 320;
const CENTER = SIZE / 2;
const OUTER_R = 148;
const INNER_R = 20;
const BORDER_W = 6;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

// ─── Component ──────────────────────────────────────────────────────

export function SpinWheelClient() {
  const [segments, setSegments] = useState<string[]>(DEFAULT_SEGMENTS);
  const [customInput, setCustomInput] = useState(DEFAULT_SEGMENTS.join("\n"));
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => { setReducedMotion(prefersReducedMotion()); }, []);

  // Build SVG slices
  const slices = useMemo(() => {
    const sliceAngle = 360 / segments.length;
    return segments.map((label, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const midAngle = startAngle + sliceAngle / 2;
      const color = COLORS[i % COLORS.length];
      const labelR = OUTER_R * 0.65;
      const labelPos = polarToCartesian(CENTER, CENTER, labelR, midAngle);
      const labelRotation = midAngle;
      return { label, startAngle, endAngle, color, labelPos, labelRotation };
    });
  }, [segments]);

  const spin = useCallback(() => {
    if (spinning || segments.length < 2) return;
    setSpinning(true);
    setResult(null);

    const winIdx = randomInt(0, segments.length - 1);
    const sliceDeg = 360 / segments.length;
    // Target: center of the winning slice (from the pointer's perspective at top/0°)
    // The pointer is at 0° (top). Slice i starts at i*sliceDeg.
    // To land slice winIdx under the pointer, rotate so that the center of winIdx aligns with 0°.
    const sliceCenter = winIdx * sliceDeg + sliceDeg / 2;
    // Add jitter within the slice (avoid landing exactly on a boundary)
    const jitter = randomInt(-Math.floor(sliceDeg * 0.35), Math.floor(sliceDeg * 0.35));
    const targetRotation = 360 - sliceCenter + jitter;
    const fullSpins = randomInt(5, 8) * 360;
    const finalRotation = rotation + fullSpins + targetRotation - (rotation % 360);

    setRotation(finalRotation);
    const delay = reducedMotion ? 0 : 3200;
    setTimeout(() => {
      setSpinning(false);
      setResult(segments[winIdx]);
      const item: HistoryItem = { label: segments[winIdx], color: "blue" };
      setHistory(h => [item, ...h].slice(0, 30));
    }, delay);
  }, [spinning, segments, rotation, reducedMotion]);

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

        <div className="flex flex-col items-center gap-5">
          {/* Pointer — fixed above the wheel */}
          <div className="relative w-[320px] h-[320px]">
            {/* Triangle pointer at exact top center */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
              <svg width="24" height="28" viewBox="0 0 24 28" fill="none" aria-hidden="true">
                <path d="M12 28L2 4a2 2 0 012-2h16a2 2 0 012 2L14 28a2 2 0 01-2 0z" className="fill-slate-900 dark:fill-slate-100" />
              </svg>
            </div>

            {/* Spinning wheel container */}
            <div
              className={reducedMotion ? "" : "transition-transform duration-[3200ms] ease-[cubic-bezier(0.15,0.6,0.15,1)]"}
              style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "center center" }}
            >
              <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                aria-hidden="true"
                className="drop-shadow-xl"
              >
                {/* Outer border ring */}
                <circle cx={CENTER} cy={CENTER} r={OUTER_R + BORDER_W / 2} fill="none" stroke="#1e293b" strokeWidth={BORDER_W} className="dark:stroke-slate-200" />

                {/* Pie slices */}
                {slices.map((slice, i) => (
                  <g key={i}>
                    <path
                      d={describeArc(CENTER, CENTER, OUTER_R, slice.startAngle, slice.endAngle)}
                      fill={slice.color}
                      stroke="#1e293b"
                      strokeWidth="0.5"
                      className="dark:stroke-slate-800"
                    />
                    {/* Slice label */}
                    <text
                      x={slice.labelPos.x}
                      y={slice.labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${slice.labelRotation}, ${slice.labelPos.x}, ${slice.labelPos.y})`}
                      fill="white"
                      fontSize={Math.min(13, 160 / segments.length)}
                      fontWeight="bold"
                      fontFamily="system-ui, sans-serif"
                    >
                      {slice.label.length > 10 ? slice.label.slice(0, 9) + "…" : slice.label}
                    </text>
                  </g>
                ))}

                {/* Inner highlight ring */}
                <circle cx={CENTER} cy={CENTER} r={OUTER_R - 2} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

                {/* Center hub */}
                <circle cx={CENTER} cy={CENTER} r={INNER_R + 4} fill="#1e293b" className="dark:fill-slate-200" />
                <circle cx={CENTER} cy={CENTER} r={INNER_R} fill="white" className="dark:fill-slate-900" />
                <circle cx={CENTER} cy={CENTER} r={6} fill="#7c3aed" />
              </svg>
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
