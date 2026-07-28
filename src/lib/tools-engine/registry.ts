/**
 * Registry for the 13 new tools added in this expansion.
 */

import type { ToolMeta } from "./types";

export const NEW_TOOLS_REGISTRY: ToolMeta[] = [
  // ─── Developer Tools ──────────────────────────────────────────────
  {
    slug: "html-formatter",
    title: "HTML Formatter",
    description: "Beautify and indent HTML code with proper formatting.",
    longDescription: "Format messy HTML into clean, properly indented code. Supports self-closing tags, attributes, and inline elements. Free, private, browser-based.",
    category: "developer",
    href: "/html-formatter",
    keywords: ["html formatter", "html beautifier", "format html", "pretty print html"],
    relatedTools: ["xml-formatter", "json-formatter", "yaml-formatter"],
    faq: [
      { q: "Does this validate HTML?", a: "It formats the structure but does not validate against the HTML spec." },
      { q: "Are inline styles preserved?", a: "Yes. All attributes including inline styles are preserved exactly." },
    ],
  },
  {
    slug: "xml-formatter",
    title: "XML Formatter",
    description: "Format and indent XML documents for readability.",
    longDescription: "Beautify XML documents with proper indentation and line breaks. Handles namespaces, CDATA sections, and comments. Processed locally.",
    category: "developer",
    href: "/xml-formatter",
    keywords: ["xml formatter", "xml beautifier", "format xml", "xml pretty print"],
    relatedTools: ["html-formatter", "json-formatter", "yaml-formatter"],
    faq: [
      { q: "Are namespaces preserved?", a: "Yes. All namespace declarations and prefixes are preserved exactly." },
      { q: "Does this handle CDATA?", a: "Yes. CDATA sections are preserved without modification." },
    ],
  },
  {
    slug: "yaml-formatter",
    title: "YAML Formatter",
    description: "Format and validate YAML with proper indentation.",
    longDescription: "Beautify YAML documents with consistent 2-space indentation. Validates syntax and reports errors with line numbers. Entirely browser-based.",
    category: "developer",
    href: "/yaml-formatter",
    keywords: ["yaml formatter", "yaml beautifier", "format yaml", "yaml validator"],
    relatedTools: ["json-formatter", "xml-formatter", "html-formatter"],
    faq: [
      { q: "What indentation is used?", a: "2-space indentation, the most common YAML style." },
      { q: "Does this validate YAML?", a: "Yes. Invalid YAML will show an error with the approximate location." },
    ],
  },
  {
    slug: "jwt-generator",
    title: "JWT Generator",
    description: "Generate JSON Web Tokens with custom claims.",
    longDescription: "Create JWTs with custom header, payload, and secret. Supports HS256 signing. Preview the encoded token and decoded parts. No data leaves your browser.",
    category: "developer",
    href: "/jwt-generator",
    keywords: ["jwt generator", "create jwt", "json web token generator", "jwt maker"],
    relatedTools: ["jwt-decoder", "hash-generator", "base64-encoder-decoder"],
    faq: [
      { q: "What algorithms are supported?", a: "HS256 (HMAC-SHA256) for client-side generation. RS256 requires a server." },
      { q: "Is this secure for production?", a: "For testing and development only. Never expose your signing secret." },
    ],
  },
  {
    slug: "hash-generator",
    title: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes.",
    longDescription: "Compute cryptographic hashes of any text input. Supports MD5, SHA-1, SHA-256, and SHA-512. Uses the Web Crypto API for secure, native-speed hashing.",
    category: "developer",
    href: "/hash-generator",
    keywords: ["hash generator", "sha256 hash", "md5 generator", "sha512 hash"],
    relatedTools: ["base64-encoder-decoder", "jwt-generator", "uuid-generator"],
    faq: [
      { q: "Which algorithm should I use?", a: "SHA-256 is recommended for most purposes. MD5 and SHA-1 are considered weak." },
      { q: "Can I hash files?", a: "Currently text only. File hashing may be added in a future update." },
    ],
  },
  {
    slug: "qr-generator",
    title: "QR Code Generator",
    description: "Generate QR codes for URLs, text, or Wi-Fi credentials.",
    longDescription: "Create high-quality QR codes for any text, URL, or Wi-Fi configuration. Download as PNG or SVG. Customizable size and error correction level.",
    category: "developer",
    href: "/qr-generator",
    keywords: ["qr generator", "qr code maker", "create qr code", "qr code generator"],
    relatedTools: ["uuid-generator", "hash-generator", "base64-encoder-decoder"],
    faq: [
      { q: "What formats can I download?", a: "PNG (raster) and SVG (vector) are both available." },
      { q: "What is error correction?", a: "Higher error correction allows the QR code to be read even when partially damaged." },
    ],
  },
  {
    slug: "markdown-preview",
    title: "Markdown Preview",
    description: "Write Markdown and see a live rendered preview.",
    longDescription: "Real-time Markdown editor with instant rendered preview. Supports GitHub Flavored Markdown including tables, task lists, and code blocks.",
    category: "developer",
    href: "/markdown-preview",
    keywords: ["markdown preview", "markdown editor", "markdown renderer", "live markdown"],
    relatedTools: ["html-formatter", "diff-checker", "text-compare"],
    faq: [
      { q: "What Markdown flavor is supported?", a: "GitHub Flavored Markdown (GFM) including tables, strikethrough, and task lists." },
      { q: "Can I export the HTML?", a: "Yes. Copy the rendered HTML output for use in your projects." },
    ],
  },
  {
    slug: "diff-checker",
    title: "Diff Checker",
    description: "Compare two texts and highlight the differences.",
    longDescription: "Paste two texts side by side and instantly see additions, deletions, and changes highlighted. Supports line-by-line and word-by-word comparison.",
    category: "developer",
    href: "/diff-checker",
    keywords: ["diff checker", "text diff", "compare text", "online diff"],
    relatedTools: ["text-compare", "markdown-preview", "html-formatter"],
    faq: [
      { q: "What comparison modes are available?", a: "Line-by-line diff showing additions (green), deletions (red), and unchanged lines." },
      { q: "Is there a size limit?", a: "No hard limit. Very large texts (100K+ lines) may be slow in the browser." },
    ],
  },

  // ─── Text Tools ───────────────────────────────────────────────────
  {
    slug: "lorem-ipsum",
    title: "Lorem Ipsum Generator",
    description: "Generate placeholder text in paragraphs, sentences, or words.",
    longDescription: "Generate Lorem Ipsum placeholder text. Choose paragraphs, sentences, or words. Copy with one click. Perfect for design mockups and prototypes.",
    category: "text",
    href: "/lorem-ipsum",
    keywords: ["lorem ipsum generator", "placeholder text", "dummy text", "lipsum"],
    relatedTools: ["word-counter", "character-counter", "case-converter"],
    faq: [
      { q: "Is this real Latin?", a: "No. Lorem Ipsum is scrambled Latin — it looks like natural language but has no meaning." },
      { q: "How many paragraphs can I generate?", a: "Up to 100 paragraphs at a time." },
    ],
  },
  {
    slug: "case-converter",
    title: "Case Converter",
    description: "Convert text between uppercase, lowercase, title case, and more.",
    longDescription: "Convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, and kebab-case. Instant conversion.",
    category: "text",
    href: "/case-converter",
    keywords: ["case converter", "uppercase converter", "title case", "camelcase converter"],
    relatedTools: ["slug-generator", "character-counter", "word-counter"],
    faq: [
      { q: "What case styles are supported?", a: "UPPER, lower, Title, Sentence, camelCase, PascalCase, snake_case, kebab-case." },
      { q: "Does it handle Unicode?", a: "Yes. Full Unicode support including accented characters." },
    ],
  },
  {
    slug: "remove-duplicate-lines",
    title: "Remove Duplicate Lines",
    description: "Remove duplicate lines from text while preserving order.",
    longDescription: "Paste text and instantly remove duplicate lines. Preserves the first occurrence of each line. Options for case-sensitive or case-insensitive comparison.",
    category: "text",
    href: "/remove-duplicate-lines",
    keywords: ["remove duplicate lines", "deduplicate text", "unique lines", "remove duplicates"],
    relatedTools: ["text-compare", "word-counter", "case-converter"],
    faq: [
      { q: "Is comparison case-sensitive?", a: "By default yes. Toggle case-insensitive mode to ignore capitalization." },
      { q: "Are blank lines removed?", a: "Blank lines are treated as duplicates of each other — only one is kept." },
    ],
  },
  {
    slug: "text-compare",
    title: "Text Compare",
    description: "Compare two texts and see differences highlighted.",
    longDescription: "Paste two texts and instantly see what changed. Additions are highlighted in green, deletions in red. Word-level precision.",
    category: "text",
    href: "/text-compare",
    keywords: ["text compare", "compare text online", "text difference", "text diff"],
    relatedTools: ["diff-checker", "remove-duplicate-lines", "word-counter"],
    faq: [
      { q: "How is this different from Diff Checker?", a: "Text Compare uses word-level highlighting. Diff Checker uses line-level diffs." },
      { q: "Is whitespace significant?", a: "Yes. Trailing spaces and tabs are compared as-is." },
    ],
  },
  {
    slug: "slug-generator",
    title: "Slug Generator",
    description: "Convert any text into a URL-friendly slug.",
    longDescription: "Transform titles and text into clean URL slugs. Handles Unicode, special characters, and multiple separators. Instant live preview.",
    category: "text",
    href: "/slug-generator",
    keywords: ["slug generator", "url slug", "slugify", "seo url generator"],
    relatedTools: ["case-converter", "character-counter", "remove-duplicate-lines"],
    faq: [
      { q: "What characters are removed?", a: "All non-alphanumeric characters except hyphens. Spaces become hyphens." },
      { q: "Does it handle Unicode?", a: "Yes. Accented characters are transliterated (e.g., e instead of e)." },
    ],
  },
];

export function getNewToolBySlug(slug: string): ToolMeta | undefined {
  return NEW_TOOLS_REGISTRY.find((t) => t.slug === slug);
}
