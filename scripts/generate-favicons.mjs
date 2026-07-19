#!/usr/bin/env node
/**
 * One-shot favicon generator for BeHumler.
 *
 * Reads the compact brand mark (an inline SVG matching the
 * `<LogoMark/>` component in `src/components/icons.tsx`) and produces
 * three files under `src/app/` so that Next.js App Router file
 * conventions pick them up automatically:
 *
 *   src/app/favicon.ico    — multi-resolution ICO (16×16, 32×32, 48×48)
 *   src/app/icon.png       — 512×512 PNG (used by Google Search results)
 *   src/app/apple-icon.png — 180×180 PNG (iOS home-screen)
 *
 * Rerun with `node scripts/generate-favicons.mjs` any time the brand
 * mark changes. The generated files are committed as binary assets so
 * `npm run build` never needs to touch this script.
 *
 * Design notes:
 *
 *   * The mark is deliberately a SYMBOL (rounded gradient square with
 *     a play triangle), not a wordmark. Text logos are illegible at
 *     16×16 and Google specifically warns against them for site icons.
 *
 *   * The SVG is embedded here as a string rather than imported from
 *     the React component so this script has no runtime dependency on
 *     the app code. That keeps regeneration cheap even from a clean
 *     checkout.
 *
 *   * The ICO is packed by hand (no `png-to-ico` dep) using the
 *     standard ICONDIR / ICONDIRENTRY layout with the modern PNG-
 *     inside-ICO convention. Every browser released in the last
 *     decade renders these correctly, and Google Search prefers the
 *     larger PNG (`icon.png`) anyway.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDir = path.join(__dirname, "..", "src", "app");

// Compact brand mark — matches `<LogoMark/>` in
// src/components/icons.tsx but with the 2px inset removed so the
// gradient fills the full canvas (favicons look best edge-to-edge
// because most browsers already render them inside a chrome).
const SVG_MARK = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
      <stop stop-color="#7c3aed" />
      <stop offset="1" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="32" height="32" rx="7" ry="7" fill="url(#g)" />
  <path d="M12 10.5 L22 16 L12 21.5 Z" fill="#ffffff" />
</svg>`;

/**
 * Rasterize the mark to a PNG buffer of the given square size.
 * Uses sharp's SVG loader with `density` scaled up so the vector is
 * rendered crisply at the target resolution (rather than upscaled
 * from a small bitmap).
 */
async function pngOfSize(size) {
  const density = Math.max(72, Math.round((size / 32) * 72));
  return sharp(Buffer.from(SVG_MARK), { density })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Pack an array of PNG buffers into a single .ico file.
 *
 * ICO layout:
 *   6-byte ICONDIR header
 *   16-byte ICONDIRENTRY per image (all entries first, contiguous)
 *   PNG payloads (each image's raw PNG bytes, concatenated)
 *
 * Each ICONDIRENTRY records where in the file its PNG starts and
 * how many bytes it spans, so browsers can seek directly to the
 * image they want without decoding the others.
 */
function packIco(images) {
  const headerSize = 6;
  const entrySize = 16;
  const dirEnd = headerSize + entrySize * images.length;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);              // reserved
  header.writeUInt16LE(1, 2);              // type = ICO
  header.writeUInt16LE(images.length, 4);  // image count

  const entries = [];
  const payloads = [];
  let offset = dirEnd;

  for (const { size, buffer } of images) {
    const entry = Buffer.alloc(entrySize);
    // 0 in the width/height byte means 256 per spec — we never emit
    // that size for a favicon so a plain uint8 is safe.
    entry.writeUInt8(size === 256 ? 0 : size, 0); // width
    entry.writeUInt8(size === 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2);                       // color palette count (0 = no palette)
    entry.writeUInt8(0, 3);                       // reserved
    entry.writeUInt16LE(1, 4);                    // color planes
    entry.writeUInt16LE(32, 6);                   // bits per pixel (RGBA)
    entry.writeUInt32LE(buffer.length, 8);        // image data size
    entry.writeUInt32LE(offset, 12);              // image data offset
    entries.push(entry);
    payloads.push(buffer);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...entries, ...payloads]);
}

async function main() {
  process.stdout.write("Rasterizing brand mark at required sizes…\n");

  // Sizes needed for browsers, iOS home-screen, and Google Search.
  // We generate them all up-front so nothing scales twice.
  const [png16, png32, png48, png180, png512] = await Promise.all([
    pngOfSize(16),
    pngOfSize(32),
    pngOfSize(48),
    pngOfSize(180),
    pngOfSize(512),
  ]);

  // favicon.ico — packs 16 / 32 / 48 in one file, per convention.
  const ico = packIco([
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
    { size: 48, buffer: png48 },
  ]);

  await fs.writeFile(path.join(appDir, "favicon.ico"), ico);
  await fs.writeFile(path.join(appDir, "icon.png"), png512);
  await fs.writeFile(path.join(appDir, "apple-icon.png"), png180);

  process.stdout.write(
    [
      `  wrote src/app/favicon.ico    (${ico.length} bytes, 16+32+48)`,
      `  wrote src/app/icon.png       (${png512.length} bytes, 512×512)`,
      `  wrote src/app/apple-icon.png (${png180.length} bytes, 180×180)`,
      "done.",
    ].join("\n") + "\n",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
