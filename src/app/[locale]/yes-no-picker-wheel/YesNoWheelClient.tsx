"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

// ─── Types ──────────────────────────────────────────────────────────

type WheelResult = "yes" | "no" | null;

// ─── Component ──────────────────────────────────────────────────────

export function YesNoWheelClient() {
  const [yesWeight, setYesWeight] = useState(50);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelResult>(null);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState<WheelResult[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Draw the wheel (supports HiDPI)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const logicalSize = 280;
    const physicalSize = Math.round(logicalSize * dpr);

    // Only resize if needed to avoid flicker
    if (canvas.width !== physicalSize || canvas.height !== physicalSize) {
      canvas.width = physicalSize;
      canvas.height = physicalSize;
      canvas.style.width = `${logicalSize}px`;
      canvas.style.height = `${logicalSize}px`;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, logicalSize, logicalSize);

    const center = logicalSize / 2;
    const radius = center - 4;

    // Yes slice (green)
    const yesAngle = (yesWeight / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, -Math.PI / 2, -Math.PI / 2 + yesAngle);
    ctx.closePath();
    ctx.fillStyle = "#16a34a";
    ctx.fill();

    // No slice (red)
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, -Math.PI / 2 + yesAngle, -Math.PI / 2 + Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = "#dc2626";
    ctx.fill();

    // Labels
    ctx.save();
    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";

    const labelRadius = radius * 0.6;

    // Yes label
    const yesLabelAngle = -Math.PI / 2 + yesAngle / 2;
    ctx.fillText(
      "YES",
      center + Math.cos(yesLabelAngle) * labelRadius,
      center + Math.sin(yesLabelAngle) * labelRadius,
    );

    // No label
    const noAngle = Math.PI * 2 - yesAngle;
    const noLabelAngle = -Math.PI / 2 + yesAngle + noAngle / 2;
    ctx.fillText(
      "NO",
      center + Math.cos(noLabelAngle) * labelRadius,
      center + Math.sin(noLabelAngle) * labelRadius,
    );
    ctx.restore();

    // Center dot
    ctx.beginPath();
    ctx.arc(center, center, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [yesWeight, rotation]);

  const spin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    // Determine result based on weight
    const rand = Math.random() * 100;
    const won: WheelResult = rand < yesWeight ? "yes" : "no";

    // Calculate landing angle (angle from 12 o'clock clockwise where the result zone is)
    const yesAngle = (yesWeight / 100) * 360;
    let targetAngle: number;
    if (won === "yes") {
      // Land somewhere in the Yes zone (0 to yesAngle degrees from 12 o'clock)
      targetAngle = Math.random() * yesAngle;
    } else {
      // Land somewhere in the No zone (yesAngle to 360 degrees from 12 o'clock)
      targetAngle = yesAngle + Math.random() * (360 - yesAngle);
    }

    // Rotate the wheel so the targetAngle aligns under the pointer at 12 o'clock
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const finalRotation = rotation + fullSpins * 360 + (360 - targetAngle);

    if (reducedMotion) {
      // Skip animation — jump directly
      setRotation(finalRotation);
      setSpinning(false);
      setResult(won);
      setHistory((h) => [won, ...h].slice(0, 20));
    } else {
      setRotation(finalRotation);
      setTimeout(() => {
        setSpinning(false);
        setResult(won);
        setHistory((h) => [won, ...h].slice(0, 20));
      }, 3000);
    }
  }, [spinning, yesWeight, rotation, reducedMotion]);

  // Keyboard support — prevent repeat firing from held keys
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        spin();
      }
    },
    [spin],
  );

  const spinDuration = reducedMotion ? "duration-0" : "duration-[3000ms]";
  const spinEase = reducedMotion ? "" : "ease-[cubic-bezier(0.17,0.67,0.12,0.99)]";

  return (
    <section className="space-y-6">
      <div className="card p-6 sm:p-8 space-y-6">
        {/* Ratio slider */}
        <div className="space-y-2">
          <label className="block">
            <span className="label">Yes / No ratio</span>
            <input
              type="range"
              min={5}
              max={95}
              step={5}
              value={yesWeight}
              onChange={(e) => setYesWeight(Number(e.target.value))}
              className="w-full mt-2 accent-brand-600"
              disabled={spinning}
            />
          </label>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="text-green-700 dark:text-green-400 font-medium">Yes: {yesWeight}%</span>
            <span className="text-red-700 dark:text-red-400 font-medium">No: {100 - yesWeight}%</span>
          </div>
        </div>

        {/* Wheel */}
        <div className="flex flex-col items-center gap-4">
          {/* Pointer */}
          <div className="relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-slate-900 dark:border-t-slate-100" />
            <div
              className={`transition-transform ${spinDuration} ${spinEase}`}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <canvas
                ref={canvasRef}
                className="w-[280px] h-[280px] rounded-full shadow-lg"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Spin button */}
          <button
            type="button"
            onClick={spin}
            onKeyDown={handleKeyDown}
            disabled={spinning}
            aria-label={spinning ? "Wheel is spinning" : "Spin the wheel"}
            className="px-8 py-3 rounded-xl bg-brand-600 text-white font-semibold text-lg shadow-md hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
          >
            {spinning ? "Spinning\u2026" : "Spin!"}
          </button>

          {/* Result — always in DOM for aria-live to work */}
          <div
            role="status"
            aria-live="assertive"
            aria-atomic="true"
            className="min-h-[60px] flex items-center justify-center"
          >
            {result && !spinning && (
              <div
                className={`text-center rounded-xl px-8 py-4 font-bold text-2xl ${
                  result === "yes"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                }`}
              >
                {result === "yes" ? "\u2713 YES" : "\u2717 NO"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card p-6 sm:p-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              History
            </h2>
            <button
              type="button"
              onClick={() => setHistory([])}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <span
                key={i}
                className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${
                  h === "yes"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                }`}
              >
                {h === "yes" ? "Yes" : "No"}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Yes: {history.filter((h) => h === "yes").length} / No: {history.filter((h) => h === "no").length}
          </p>
        </div>
      )}

      {/* Related tools */}
      <div className="card p-6 sm:p-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Related Tools
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 text-sm">
          <li>
            <Link href="/random-team-generator" className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-200 underline-offset-2 hover:underline">
              Random Team Generator
            </Link>
            <span className="text-slate-500 dark:text-slate-400"> — Split names into random groups.</span>
          </li>
          <li>
            <Link href="/twitch-bits-calculator" className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-200 underline-offset-2 hover:underline">
              Twitch Bits Calculator
            </Link>
            <span className="text-slate-500 dark:text-slate-400"> — Convert Bits to USD.</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
