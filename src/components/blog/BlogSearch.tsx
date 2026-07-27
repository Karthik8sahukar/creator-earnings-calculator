"use client";

import { useT } from "@/lib/t";
import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { SearchIcon, XIcon } from "../icons";
import type { BlogSearchDoc } from "@/lib/blog";
import { searchIndex } from "@/lib/blog/search";

/**
 * Client-side blog search.
 *
 * Fed a pre-built search index (title + description + category id +
 * tags) via props so the network cost is a single JSON payload,
 * shared with the blog homepage list rendering.
 *
 * Match rules and rationale live in `src/lib/blog/search.ts` — this
 * component is pure UX around that pure function.
 */
export function BlogSearch({ index }: { index: BlogSearchDoc[] }) {
  const t = useT("blog.search");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchIndex(index, query).slice(0, 6);
  }, [index, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor="blog-search-input" className="sr-only">
        {t("srLabel")}
      </label>
      <div className="relative">
        <SearchIcon
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          width={18}
          height={18}
        />
        <input
          id="blog-search-input"
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open && query.length > 0}
          aria-controls="blog-search-results"
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={t("placeholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query && setOpen(true)}
          className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 py-3 text-base text-slate-900 placeholder:text-slate-400 shadow-card focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        {query && (
          <button
            type="button"
            aria-label={t("clearAria")}
            onClick={() => {
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
          >
            <XIcon width={16} height={16} />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div
          id="blog-search-results"
          role="listbox"
          className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop dark:border-slate-800 dark:bg-slate-900 animate-fade-in"
        >
          {results.length === 0 ? (
            <p className="p-4 text-sm text-slate-500 dark:text-slate-400">
              {t("empty", { query })}
            </p>
          ) : (
            <ul>
              {results.map((doc) => (
                <li key={doc.slug} role="option" aria-selected="false">
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/blog/${doc.slug}` as any}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                      {doc.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {doc.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
