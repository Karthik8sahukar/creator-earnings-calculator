/**
 * PDF Tools registry — single source of truth for all tool definitions.
 *
 * Each tool's slug, validation rules, metadata, FAQ, and related tools
 * are defined here. The registry drives navigation, SEO, and tool pages.
 */

import type { PdfToolDef, ValidationRule } from "./types";

// ─── Shared Validation Presets ──────────────────────────────────────

const PDF_SINGLE: ValidationRule = {
  acceptedTypes: ["application/pdf", ".pdf"],
  acceptedFormats: ["PDF"],
  maxFileSize: 100 * 1024 * 1024, // 100 MB
  maxFiles: 1,
  minFiles: 1,
};

const PDF_MULTI: ValidationRule = {
  acceptedTypes: ["application/pdf", ".pdf"],
  acceptedFormats: ["PDF"],
  maxFileSize: 100 * 1024 * 1024,
  maxFiles: 50,
  minFiles: 2,
};

const IMAGES: ValidationRule = {
  acceptedTypes: ["image/jpeg", "image/png", "image/webp", ".jpg", ".jpeg", ".png", ".webp"],
  acceptedFormats: ["JPG", "PNG", "WebP"],
  maxFileSize: 50 * 1024 * 1024, // 50 MB per image
  maxFiles: 50,
  minFiles: 1,
};

// ─── Tool Definitions ───────────────────────────────────────────────

export const PDF_TOOLS: PdfToolDef[] = [
  {
    slug: "merge-pdf",
    title: "Merge PDF",
    description: "Combine multiple PDF files into one document.",
    longDescription: "Merge two or more PDF files into a single document. Drag to reorder pages before combining. Free, private, and processed entirely in your browser.",
    href: "/tools/merge-pdf",
    icon: "merge",
    validation: PDF_MULTI,
    relatedTools: ["split-pdf", "rearrange-pdf", "rotate-pdf", "delete-pdf-pages"],
    keywords: ["merge pdf", "combine pdf", "join pdf", "pdf merger"],
    faq: [
      { q: "Is there a file size limit?", a: "Each file can be up to 100 MB. You can merge up to 50 files at once." },
      { q: "Is my data sent to a server?", a: "No. All processing happens locally in your browser. Your files never leave your device." },
      { q: "Can I reorder pages before merging?", a: "Yes. Drag and drop files in the list to change their order before merging." },
      { q: "What PDF versions are supported?", a: "All standard PDF versions (1.0 through 2.0) are supported." },
    ],
  },
  {
    slug: "split-pdf",
    title: "Split PDF",
    description: "Extract pages or split a PDF into multiple files.",
    longDescription: "Split a PDF into separate files by page range, extract specific pages, or split every page into its own file. Fast, free, and private.",
    href: "/tools/split-pdf",
    icon: "split",
    validation: PDF_SINGLE,
    relatedTools: ["merge-pdf", "delete-pdf-pages", "rearrange-pdf", "rotate-pdf"],
    keywords: ["split pdf", "extract pdf pages", "separate pdf", "pdf splitter"],
    faq: [
      { q: "Can I extract specific pages?", a: "Yes. Select individual pages or enter page ranges (e.g., 1-3, 5, 7-10)." },
      { q: "Can I split into equal parts?", a: "Yes. Choose 'Split every N pages' to divide evenly." },
      { q: "Is my data secure?", a: "Absolutely. Processing is done locally in your browser. Nothing is uploaded." },
    ],
  },
  {
    slug: "rearrange-pdf",
    title: "Rearrange PDF",
    description: "Reorder pages in a PDF by dragging and dropping.",
    longDescription: "Rearrange pages in any PDF by dragging thumbnails into your desired order. See a live preview before saving. No upload required.",
    href: "/tools/rearrange-pdf",
    icon: "reorder",
    validation: PDF_SINGLE,
    relatedTools: ["rotate-pdf", "delete-pdf-pages", "merge-pdf", "split-pdf"],
    keywords: ["rearrange pdf", "reorder pdf pages", "move pdf pages", "pdf page order"],
    faq: [
      { q: "How do I reorder pages?", a: "Upload your PDF, then drag and drop page thumbnails into the desired order." },
      { q: "Can I see a preview?", a: "Yes. Each page is shown as a thumbnail you can drag to reorder." },
    ],
  },
  {
    slug: "rotate-pdf",
    title: "Rotate PDF",
    description: "Rotate PDF pages 90, 180, or 270 degrees.",
    longDescription: "Rotate individual pages or all pages in a PDF. Choose 90, 180, or 270 degree rotation. Preview changes before saving.",
    href: "/tools/rotate-pdf",
    icon: "rotate",
    validation: PDF_SINGLE,
    relatedTools: ["rearrange-pdf", "delete-pdf-pages", "merge-pdf", "split-pdf"],
    keywords: ["rotate pdf", "rotate pdf pages", "flip pdf", "pdf rotation"],
    faq: [
      { q: "Can I rotate individual pages?", a: "Yes. Click on any page thumbnail to rotate it independently." },
      { q: "What rotation angles are available?", a: "90 degrees clockwise, 90 degrees counter-clockwise, and 180 degrees." },
    ],
  },
  {
    slug: "delete-pdf-pages",
    title: "Delete PDF Pages",
    description: "Remove unwanted pages from a PDF file.",
    longDescription: "Select and delete specific pages from any PDF. Preview all pages as thumbnails and click to remove the ones you don't need.",
    href: "/tools/delete-pdf-pages",
    icon: "delete",
    validation: PDF_SINGLE,
    relatedTools: ["split-pdf", "rearrange-pdf", "rotate-pdf", "merge-pdf"],
    keywords: ["delete pdf pages", "remove pdf pages", "pdf page remover"],
    faq: [
      { q: "Can I select multiple pages to delete?", a: "Yes. Click on multiple page thumbnails to select them, then delete all at once." },
      { q: "Can I undo a deletion?", a: "Before saving, yes. After downloading the new file, you'll need to re-upload the original." },
    ],
  },
  {
    slug: "image-to-pdf",
    title: "Image to PDF",
    description: "Convert JPG, PNG, or WebP images to a PDF document.",
    longDescription: "Convert one or more images (JPG, PNG, WebP) into a single PDF document. Reorder images, choose page size and orientation.",
    href: "/tools/image-to-pdf",
    icon: "image",
    validation: IMAGES,
    relatedTools: ["pdf-to-jpg", "merge-pdf", "rotate-pdf", "add-watermark"],
    keywords: ["jpg to pdf", "png to pdf", "image to pdf", "convert image to pdf"],
    faq: [
      { q: "What image formats are supported?", a: "JPG/JPEG, PNG, and WebP images are all supported." },
      { q: "Can I convert multiple images at once?", a: "Yes. Upload up to 50 images and they'll be combined into a single PDF in order." },
      { q: "Can I choose the page size?", a: "Yes. Options include A4, Letter, and fitting the image to its original dimensions." },
    ],
  },
  {
    slug: "pdf-to-jpg",
    title: "PDF to JPG",
    description: "Convert each PDF page to a high-quality JPG image.",
    longDescription: "Convert every page of a PDF into separate JPG images. Choose quality and resolution. Download all images at once.",
    href: "/tools/pdf-to-jpg",
    icon: "export",
    validation: PDF_SINGLE,
    relatedTools: ["image-to-pdf", "split-pdf", "rotate-pdf", "delete-pdf-pages"],
    keywords: ["pdf to jpg", "pdf to image", "convert pdf to jpg", "pdf to jpeg"],
    faq: [
      { q: "What quality options are available?", a: "Choose from 72 DPI (web), 150 DPI (standard), or 300 DPI (print quality)." },
      { q: "How do I download all images?", a: "All converted images are available for individual or batch download." },
    ],
  },
  {
    slug: "add-watermark",
    title: "Add Watermark",
    description: "Add text or image watermarks to PDF pages.",
    longDescription: "Add customizable text or image watermarks to every page of your PDF. Control position, opacity, rotation, font size, and color.",
    href: "/tools/add-watermark",
    icon: "watermark",
    validation: PDF_SINGLE,
    relatedTools: ["add-page-numbers", "protect-pdf", "rotate-pdf", "merge-pdf"],
    keywords: ["add watermark to pdf", "pdf watermark", "stamp pdf", "pdf branding"],
    faq: [
      { q: "Can I use an image as a watermark?", a: "Yes. Upload a PNG or JPG image to use as your watermark." },
      { q: "Can I adjust the watermark opacity?", a: "Yes. Use the opacity slider to make the watermark more or less transparent." },
    ],
  },
  {
    slug: "add-page-numbers",
    title: "Add Page Numbers",
    description: "Add page numbers to every page of a PDF.",
    longDescription: "Automatically add page numbers to your PDF. Choose position (top/bottom, left/center/right), font size, starting number, and format.",
    href: "/tools/add-page-numbers",
    icon: "numbers",
    validation: PDF_SINGLE,
    relatedTools: ["add-watermark", "merge-pdf", "rearrange-pdf", "protect-pdf"],
    keywords: ["add page numbers to pdf", "pdf page numbering", "number pdf pages"],
    faq: [
      { q: "Where can I place page numbers?", a: "Top or bottom of the page, aligned left, center, or right." },
      { q: "Can I start numbering from a specific page?", a: "Yes. Set a custom starting number and optionally skip the first page." },
    ],
  },
  {
    slug: "protect-pdf",
    title: "Protect PDF",
    description: "Add password protection to a PDF file.",
    longDescription: "Encrypt your PDF with a password to prevent unauthorized access. Choose between user password (to open) and owner password (to restrict editing/printing).",
    href: "/tools/protect-pdf",
    icon: "lock",
    validation: PDF_SINGLE,
    relatedTools: ["unlock-pdf", "add-watermark", "add-page-numbers", "merge-pdf"],
    keywords: ["protect pdf", "password protect pdf", "encrypt pdf", "secure pdf"],
    faq: [
      { q: "What encryption is used?", a: "AES-256 encryption, the same standard used by banks and governments." },
      { q: "Can I restrict printing and editing?", a: "Yes. Set an owner password to control permissions while allowing viewing." },
    ],
  },
  {
    slug: "unlock-pdf",
    title: "Unlock PDF",
    description: "Remove password protection from a PDF (password required).",
    longDescription: "Remove password protection from a PDF file. You must know the password to unlock it. This tool does not bypass security.",
    href: "/tools/unlock-pdf",
    icon: "unlock",
    validation: PDF_SINGLE,
    relatedTools: ["protect-pdf", "merge-pdf", "split-pdf", "rotate-pdf"],
    keywords: ["unlock pdf", "remove pdf password", "decrypt pdf", "open locked pdf"],
    faq: [
      { q: "Do I need the password?", a: "Yes. You must provide the correct password. This tool cannot bypass encryption." },
      { q: "Is the unlocked file secure?", a: "The output file has no password. Re-protect it if needed." },
    ],
  },
];

// ─── Lookup Helpers ─────────────────────────────────────────────────

export function getPdfToolBySlug(slug: string): PdfToolDef | undefined {
  return PDF_TOOLS.find((t) => t.slug === slug);
}

export function getRelatedPdfTools(slug: string): PdfToolDef[] {
  const tool = getPdfToolBySlug(slug);
  if (!tool) return [];
  return tool.relatedTools
    .map((s) => getPdfToolBySlug(s))
    .filter((t): t is PdfToolDef => t !== undefined);
}
