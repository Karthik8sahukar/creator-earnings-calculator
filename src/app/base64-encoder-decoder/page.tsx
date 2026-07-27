import { createToolMetadata } from "@/lib/engine";
import { ToolLayout, ToolJsonLd } from "@/components/engine";
import { Base64Client } from "./Base64Client";

const SLUG = "base64-encoder-decoder";
const FAQ = [
  { q: "Is Base64 encryption?", a: "No. Base64 is an encoding scheme, not encryption. It makes binary data safe for text-based systems but provides no security." },
  { q: "Does this handle Unicode correctly?", a: "Yes. We use TextEncoder/TextDecoder for proper UTF-8 conversion before encoding, which correctly handles emoji, CJK characters, and all Unicode." },
  { q: "What is Base64URL?", a: "Base64URL replaces + with - and / with _, and omits padding (=). It is safe for use in URLs and filenames without escaping." },
  { q: "Is my data sent to a server?", a: "No. All encoding and decoding happens locally in your browser. Your data never leaves your device." },
];

export function generateStaticParams() {
  return [{}];
}

export const generateMetadata = createToolMetadata(SLUG, {
  title: "Base64 Encoder/Decoder — Encode & Decode Online",
  description: "Encode text to Base64 or decode Base64 to text with full Unicode support. Supports standard and URL-safe Base64. Free, browser-based.",
  keywords: ["base64 encode", "base64 decode", "base64 converter", "text to base64", "base64 to text"],
});

export default async function Page({ params }: { /* no params */ }) {
  return (
    <>
      <ToolLayout slug={SLUG} faq={FAQ}>
        <Base64Client />
      </ToolLayout>
      <ToolJsonLd slug={SLUG} faq={FAQ} />
    </>
  );
}
