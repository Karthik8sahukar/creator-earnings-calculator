import { createToolMetadata } from "@/lib/engine";
import { ToolLayout, ToolJsonLd } from "@/components/engine";
import { JsonMinifierClient } from "./JsonMinifierClient";

const SLUG = "json-minifier";
const FAQ = [
  { q: "What does minification do?", a: "Minification removes all insignificant whitespace (spaces, tabs, newlines) from JSON while preserving the data structure and string values." },
  { q: "Is whitespace inside strings preserved?", a: "Yes. Only whitespace between tokens is removed. Whitespace inside string values is never modified." },
  { q: "How is the byte size calculated?", a: "We use the TextEncoder API to calculate actual UTF-8 byte size, which is more accurate than character count for strings containing non-ASCII characters." },
  { q: "Is my data sent anywhere?", a: "No. All processing happens locally in your browser. Your data never leaves your device." },
];


export const generateMetadata = createToolMetadata(SLUG, {
  title: "JSON Minifier — Compress JSON Online",
  description: "Minify JSON by removing whitespace. See original size, minified size, and bytes saved. Free, browser-based, no data uploaded.",
  keywords: ["json minifier", "minify json", "compress json", "json compressor", "reduce json size"],
});

export default async function Page({ params }: { /* no params */ }) {
  return (
    <>
      <ToolLayout slug={SLUG} faq={FAQ}>
        <JsonMinifierClient />
      </ToolLayout>
      <ToolJsonLd slug={SLUG} faq={FAQ} />
    </>
  );
}
