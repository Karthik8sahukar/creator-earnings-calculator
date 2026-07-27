"use client";

import { useT } from "@/lib/t";
import { useEffect, useState } from "react";

import type { BlogTocEntry } from "@/lib/blog";

/**
 * Table of Contents for an article.
 *
 * Renders as a sticky column on `lg+` (see the article page layout)
 * and as a plain in-flow block on mobile. The component itself
 * doesn't apply position/stickiness — the outer container decides.
 *
 * IntersectionObserver highlights the currently-in-view heading in
 * the list. When JS is off (or before hydration), the list is still
 * a fully-functional set of anchor links.
 */
export function TableOfContents({ entries }: { entries: BlogTocEntry[] }) {
  const t = useT("blog.article");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (entries.length === 0) return;
    const headings = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (records) => {
        // Pick the intersecting entry closest to the top of the viewport.
        const visible = records
          .filter((r) => r.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      {
        // -25% from top and -60% from bottom biases the "active"
        // heading toward one the user is actually reading past.
        rootMargin: "-25% 0px -60% 0px",
        threshold: [0, 1],
      },
    );
    for (const h of headings) observer.observe(h);
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav
      aria-label={t("tocTitle")}
      className="text-sm"
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
        {t("tocTitle")}
      </p>
      <ol className="space-y-1.5 border-l border-slate-200 dark:border-slate-800">
        {entries.map((e) => {
          const isActive = e.id === activeId;
          return (
            <li key={e.id} className={e.level === 3 ? "ml-3" : undefined}>
              <a
                href={`#${e.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`block -ml-px border-l-2 pl-3 py-1 transition ${
                  isActive
                    ? "border-brand-500 text-brand-700 dark:text-brand-300"
                    : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                {e.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
