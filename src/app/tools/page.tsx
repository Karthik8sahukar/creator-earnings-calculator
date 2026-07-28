import type { Metadata } from "next";
import Link from "next/link";
import { PDF_TOOLS } from "@/lib/file-tools/registry";
import { publicConfig } from "@/lib/config";

export function generateMetadata(): Metadata {
  const title = "PDF Tools — Free Online PDF Editor & Converter";
  const description =
    "Free browser-based PDF tools. Merge, split, rotate, compress, convert, watermark, and protect PDFs. No upload required — all processing happens locally.";
  const pageUrl = `${publicConfig.siteUrl}/tools`;

  return {
    title,
    description,
    keywords: [
      "pdf tools",
      "online pdf editor",
      "merge pdf",
      "split pdf",
      "convert pdf",
      "free pdf tools",
      "pdf converter",
      "pdf combiner",
    ],
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      title,
      description,
      url: pageUrl,
      siteName: publicConfig.siteName,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function PdfToolsPage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <header className="text-center space-y-4 max-w-2xl mx-auto">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-500/10 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-300">
          {PDF_TOOLS.length} Free Tools
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          PDF Tools
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Free, private, browser-based PDF tools. No file uploads — everything
          is processed locally on your device.
        </p>
      </header>

      {/* Tool Grid */}
      <section aria-label="PDF Tools">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PDF_TOOLS.map((tool) => (
            <Link
              key={tool.slug}
              href={tool.href}
              className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {/* Icon */}
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                <ToolIcon icon={tool.icon} />
              </span>

              {/* Content */}
              <div className="flex-1">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {tool.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {tool.description}
                </p>
              </div>

              {/* Arrow */}
              <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                Open tool
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  &rarr;
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Privacy Section */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6 sm:p-8 text-center space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Your files stay private
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          Every tool processes files locally in your browser using WebAssembly
          and JavaScript. Nothing is uploaded to any server. Your documents
          never leave your device.
        </p>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: publicConfig.siteUrl,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "PDF Tools",
                  item: `${publicConfig.siteUrl}/tools`,
                },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "PDF Tools",
              description:
                "Free browser-based PDF tools for merging, splitting, rotating, converting, watermarking, and protecting PDFs.",
              url: `${publicConfig.siteUrl}/tools`,
              mainEntity: {
                "@type": "ItemList",
                numberOfItems: PDF_TOOLS.length,
                itemListElement: PDF_TOOLS.map((tool, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  name: tool.title,
                  url: `${publicConfig.siteUrl}${tool.href}`,
                })),
              },
            },
          ]),
        }}
      />
    </div>
  );
}

/** Maps tool icon identifiers to SVG icons. */
function ToolIcon({ icon }: { icon: string }) {
  const common = "w-5 h-5";
  switch (icon) {
    case "merge":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );
    case "split":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="2" x2="12" y2="22" />
          <path d="M4 12H2M22 12h-2M7 4l-3 3 3 3M17 4l3 3-3 3" />
        </svg>
      );
    case "reorder":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
          <polyline points="9 3 9 9" /><polyline points="15 15 15 21" />
        </svg>
      );
    case "rotate":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2v6h-6M2.5 22v-6h6" />
          <path d="M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
        </svg>
      );
    case "delete":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case "image":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
        </svg>
      );
    case "export":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    case "watermark":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
        </svg>
      );
    case "numbers":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7V4h16v3M9 20h6M12 4v16" />
        </svg>
      );
    case "lock":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case "unlock":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />
        </svg>
      );
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
      );
  }
}
