/**
 * Shared color generation utilities for the Random Color Generator tool.
 * All functions are pure and safe for client-side use.
 */

export interface ColorData {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  hsv: { h: number; s: number; v: number };
  cmyk: { c: number; m: number; y: number; k: number };
}

/** Generate a random color with all representations. */
export function generateRandomColor(): ColorData {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return colorFromRgb(r, g, b);
}

/** Create a full ColorData from RGB values. */
export function colorFromRgb(r: number, g: number, b: number): ColorData {
  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);
  const hsv = rgbToHsv(r, g, b);
  const cmyk = rgbToCmyk(r, g, b);
  return { hex, rgb: { r, g, b }, hsl, hsv, cmyk };
}

/** Create a full ColorData from HSL values. */
export function colorFromHsl(h: number, s: number, l: number): ColorData {
  const { r, g, b } = hslToRgb(h, s, l);
  return colorFromRgb(r, g, b);
}

// ─── Conversion helpers ─────────────────────────────────────────────

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
    else if (max === gg) h = ((bb - rr) / d + 2) / 6;
    else h = ((rr - gg) / d + 4) / 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
    else if (max === gg) h = ((bb - rr) / d + 2) / 6;
    else h = ((rr - gg) / d + 4) / 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

export function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  const c = (1 - rr - k) / (1 - k);
  const m = (1 - gg - k) / (1 - k);
  const y = (1 - bb - k) / (1 - k);
  return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const ss = s / 100;
  const ll = l / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ll - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

// ─── Palette generators ─────────────────────────────────────────────

/** Generate complementary color (180° hue shift). */
export function complementary(color: ColorData): ColorData {
  const h = (color.hsl.h + 180) % 360;
  return colorFromHsl(h, color.hsl.s, color.hsl.l);
}

/** Generate analogous palette (±30° hue shifts). */
export function analogous(color: ColorData): ColorData[] {
  return [
    colorFromHsl((color.hsl.h + 330) % 360, color.hsl.s, color.hsl.l),
    color,
    colorFromHsl((color.hsl.h + 30) % 360, color.hsl.s, color.hsl.l),
  ];
}

/** Generate triadic palette (120° hue shifts). */
export function triadic(color: ColorData): ColorData[] {
  return [
    color,
    colorFromHsl((color.hsl.h + 120) % 360, color.hsl.s, color.hsl.l),
    colorFromHsl((color.hsl.h + 240) % 360, color.hsl.s, color.hsl.l),
  ];
}

/** Generate monochrome palette (5 shades with varying lightness). */
export function monochrome(color: ColorData): ColorData[] {
  const { h, s } = color.hsl;
  return [15, 30, 45, 60, 75].map((l) => colorFromHsl(h, s, l));
}

/** Generate a random 5-color palette. */
export function randomPalette(): ColorData[] {
  return Array.from({ length: 5 }, () => generateRandomColor());
}

/** Generate a CSS linear gradient string from two colors. */
export function generateGradient(c1: ColorData, c2: ColorData, angle = 135): string {
  return `linear-gradient(${angle}deg, ${c1.hex}, ${c2.hex})`;
}

// ─── Accessibility ──────────────────────────────────────────────────

/** Calculate relative luminance per WCAG 2.1 */
export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Calculate WCAG contrast ratio between two RGB colors. */
export function contrastRatio(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
): number {
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Get contrast against white and black, return recommendation. */
export function getContrastInfo(color: ColorData): {
  contrastOnWhite: number;
  contrastOnBlack: number;
  recommendation: "light" | "dark";
  wcagAA: boolean;
  wcagAAA: boolean;
} {
  const { r, g, b } = color.rgb;
  const contrastOnWhite = contrastRatio(r, g, b, 255, 255, 255);
  const contrastOnBlack = contrastRatio(r, g, b, 0, 0, 0);
  const recommendation = contrastOnWhite >= contrastOnBlack ? "dark" : "light";
  // WCAG levels for normal text (the color used as text on white/black)
  const bestContrast = Math.max(contrastOnWhite, contrastOnBlack);
  return {
    contrastOnWhite: Math.round(contrastOnWhite * 100) / 100,
    contrastOnBlack: Math.round(contrastOnBlack * 100) / 100,
    recommendation,
    wcagAA: bestContrast >= 4.5,
    wcagAAA: bestContrast >= 7,
  };
}
