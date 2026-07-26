"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "@/i18n/navigation";
import { searchTools, type SearchResult } from "@/lib/tools/search";
import { getCategoryDef } from "@/lib/tools/categories";
import { getSearchSuggestions, getSearchPlaceholder } from "@/lib/tools";
import { CategoryIcon } from "@/components/ui/Icon";
import { badge as badgeTokens } from "@/lib/design-tokens";

// ─── Types ──────────────────────────────────────────────────────────

interface Props {
  /** Whether the modal is open. */
  open: boolean;
  /** Callback to close the modal. */
  onClose: () => void;
}

// ─── Component ──────────────────────────────────────────────────────

/**
 * ToolSearchModal — VS Code-style command palette for instant tool discovery.
 *
 * Activation:
 *   - Cmd+K (Mac) / Ctrl+K (Windows/Linux)
 *   - "/" shortcut (when not focused on an input)
 *   - Click on any search trigger across the site
 *
 * Features:
 *   - Instant fuzzy search over 34+ tools (no API call, no page reload)
 *   - Keyboard navigation: ArrowUp/Down to move, Enter to open, Escape to close
 *   - Mobile: full-screen overlay with touch-friendly results
 *   - Desktop: centered modal with backdrop blur
 *   - Shows category badge and icon for each result
 *   - Empty state shows popular search suggestions
 *   - Focus trap while open
 *   - Accessible: role="dialog", aria-modal, aria-label, aria-activedescendant
 */
export function ToolSearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dialogId = useId();
  const router = useRouter();

  // Search results — instant, no debounce needed (synchronous)
  const results = useMemo(() => searchTools(query, 10), [query]);
  const suggestions = useMemo(() => getSearchSuggestions(), []);

  // Reset state when opening/closing
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Focus the input after the modal renders
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    return () => {
      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  // Navigate to selected tool
  const navigateTo = useCallback(
    (href: string) => {
      onClose();
      // Use Next.js router for internal navigation (no page reload)
      if (href.startsWith("/#")) {
        // Anchor link — navigate to homepage then scroll
        router.push("/" as never);
        requestAnimationFrame(() => {
          const anchor = href.replace("/", "");
          const el = document.querySelector(anchor);
          el?.scrollIntoView({ behavior: "smooth" });
        });
      } else {
        router.push(href as never);
      }
    },
    [onClose, router],
  );

  // Keyboard navigation
  const onInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const maxIdx = results.length - 1;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => (i >= maxIdx ? 0 : i + 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => (i <= 0 ? maxIdx : i - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (results[activeIndex]) {
            navigateTo(results[activeIndex].tool.href);
          }
          break;
        case "Home":
          e.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          e.preventDefault();
          setActiveIndex(maxIdx);
          break;
      }
    },
    [results, activeIndex, navigateTo],
  );

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector(`[data-index="${activeIndex}"]`);
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results.length]);

  if (!open) return null;

  const activeItemId = results[activeIndex]
    ? `${dialogId}-item-${activeIndex}`
    : undefined;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close search"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm cursor-default animate-fade-in"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        id={dialogId}
        className="relative w-full max-w-xl mx-4 sm:mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden animate-fade-in flex flex-col max-h-[70vh] sm:max-h-[60vh]"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-slate-400 dark:text-slate-500"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={getSearchPlaceholder()}
            aria-label="Search tools"
            aria-controls={`${dialogId}-list`}
            aria-activedescendant={activeItemId}
            aria-autocomplete="list"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-base sm:text-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />

          {/* Escape hint (desktop only) */}
          <kbd className="hidden sm:inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto">
          {query.length === 0 ? (
            <EmptyState suggestions={suggestions} onSelect={setQuery} />
          ) : results.length === 0 ? (
            <NoResults query={query} />
          ) : (
            <ul
              ref={listRef}
              id={`${dialogId}-list`}
              role="listbox"
              aria-label="Search results"
              className="py-2"
            >
              {results.map((result, idx) => (
                <ResultItem
                  key={result.tool.slug}
                  result={result}
                  index={idx}
                  isActive={idx === activeIndex}
                  id={`${dialogId}-item-${idx}`}
                  onSelect={() => navigateTo(result.tool.href)}
                  onHover={() => setActiveIndex(idx)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer with shortcut hints */}
        <div className="hidden sm:flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex items-center rounded border border-slate-200 dark:border-slate-700 px-1 py-0.5 text-[10px]">&uarr;</kbd>
              <kbd className="inline-flex items-center rounded border border-slate-200 dark:border-slate-700 px-1 py-0.5 text-[10px]">&darr;</kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex items-center rounded border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-[10px]">&crarr;</kbd>
              open
            </span>
          </div>
          <span>{results.length > 0 ? `${results.length} results` : ""}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function ResultItem({
  result,
  index,
  isActive,
  id,
  onSelect,
  onHover,
}: {
  result: SearchResult;
  index: number;
  isActive: boolean;
  id: string;
  onSelect: () => void;
  onHover: () => void;
}) {
  const categoryDef = getCategoryDef(result.tool.category);

  return (
    <li
      id={id}
      role="option"
      aria-selected={isActive}
      data-index={index}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 cursor-pointer transition-colors duration-75 ${
        isActive
          ? "bg-brand-50 dark:bg-brand-500/10"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
      }`}
    >
      {/* Category icon */}
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/10 to-accent-500/10 ${
          isActive ? "text-brand-600 dark:text-brand-300" : "text-slate-500 dark:text-slate-400"
        }`}
      >
        <CategoryIcon category={result.tool.category} size={16} />
      </span>

      {/* Tool info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          isActive ? "text-brand-900 dark:text-brand-100" : "text-slate-900 dark:text-slate-100"
        }`}>
          {result.tool.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {result.tool.description}
        </p>
      </div>

      {/* Category badge */}
      {categoryDef && (
        <span className={`hidden sm:inline-flex shrink-0 ${badgeTokens.base} ${categoryDef.badgeColor}`}>
          {categoryDef.label}
        </span>
      )}

      {/* Arrow indicator when active */}
      {isActive && (
        <span className="shrink-0 text-brand-500 dark:text-brand-400" aria-hidden>
          &rarr;
        </span>
      )}
    </li>
  );
}

function EmptyState({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (query: string) => void;
}) {
  return (
    <div className="px-5 py-6 space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Popular searches
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(s)}
            className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No tools found for &ldquo;<span className="font-medium text-slate-700 dark:text-slate-300">{query}</span>&rdquo;
      </p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        Try searching for &ldquo;json&rdquo;, &ldquo;random&rdquo;, or &ldquo;calculator&rdquo;
      </p>
    </div>
  );
}

// ─── Global Keyboard Shortcut Hook ──────────────────────────────────

/**
 * Hook to register the global Cmd+K / Ctrl+K / "/" shortcuts.
 * Use in a top-level client component (e.g., Header or Layout).
 *
 * Returns { open, setOpen } for controlling the modal state.
 */
export function useToolSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      // "/" shortcut — only when not focused on an input/textarea/contenteditable
      if (e.key === "/" && !isInputFocused()) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen, onClose: () => setOpen(false) };
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}
