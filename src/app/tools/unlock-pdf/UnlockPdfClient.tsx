"use client";

import { getPdfToolBySlug } from "@/lib/file-tools/registry";
import Link from "next/link";

const tool = getPdfToolBySlug("unlock-pdf")!;

/**
 * Unlock PDF — client component.
 *
 * pdf-lib does not support loading encrypted PDFs with a password.
 * This page explains the limitation. A future phase will integrate
 * a WebAssembly-based decryption library to handle this client-side.
 */
export function UnlockPdfClient() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <header className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-500/10 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-300">
          PDF Tool
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {tool.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
          {tool.longDescription}
        </p>
      </header>

      {/* Coming soon notice */}
      <div className="max-w-md mx-auto rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-500/10 p-6 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400" aria-hidden>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
          Coming Soon
        </h2>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          PDF decryption requires handling encrypted PDF streams that are
          not yet supported by our client-side library. We are working on a
          WebAssembly-based solution that will decrypt PDFs locally without
          uploading your files.
        </p>
        <Link
          href="/tools"
          className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline"
        >
          &larr; Browse other PDF tools
        </Link>
      </div>

      {/* FAQ */}
      {tool.faq.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Frequently Asked Questions
          </h2>
          <dl className="space-y-4">
            {tool.faq.map((item) => (
              <div key={item.q} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                <dt className="font-medium text-slate-900 dark:text-slate-100">{item.q}</dt>
                <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
