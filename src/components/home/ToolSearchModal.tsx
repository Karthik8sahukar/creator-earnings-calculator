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
import {
  searchTools,
  highlightMatch,
  getZeroResultsSuggestions,
  getTrendingTools,
  getSearchSuggestions,
  getSearchPlaceholder,
  type SearchResult,
  type HighlightSegment,
} from "@/lib/tools";
import { getCategoryDef } from "@/lib/tools/categories";
import { CategoryIcon } from "@/components/ui/Icon";
import { badge as badgeTokens } from "@/lib/design-tokens";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useSearchAnalytics } from "@/hooks/useSearchAnalytics";

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
 *   - Recent searches: shows previously searched queries
 *   - Popular/trending searches: dynamic based on user analytics
 *   - Highlighted matched text in results
 *   - Zero-results suggestions: related tools when nothing matches
 *   - Search analytics tracking
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

  // Hooks
  const { history, addQuery, removeQuery, clearHistory } = useSearchHistory();
  const { trackSearch, getPopularSearches, getTrendingSearches } = useSearchAnalytics();

  // Search results — instant, no debounce needed (synchronous)
  const results = useMemo(() => searchTools(query, 10), [query]);

  // Popular/trending searches (combine analytics with static fallbacks)
  const popularSearches = useMemo(() => {
    const fromAnalytics = getPopularSearches(6);
    if (fromAnalytics.length >= 3) return fromAnalytics;
    // Fall back to static suggestions, deduped
    const fallback = getSearchSuggestions();
    const combined = [...fromAnalytics];
    for (const s of fallback) {
      if (!combined.some((c) => c.toLowerCase() === s.toLowerCase())) {
        combined.push(s);
      }
      if (combined.length >= 6) break;
    }
    return combined;
  }, [getPopularSearches]);

  // Trending searches
  const trendingSearches = useMemo(() => getTrendingSearches(4), [getTrendingSearches]);

  // Trending tools for empty state
  const trendingTools = useMemo(() => getTrendingTools(4), []);

  // Zero-results suggestions
  const zeroSuggestions = useMemo(
    () => (results.length === 0 && query.length >= 2 ? getZeroResultsSuggestions(query, 4) : []),
    [query, results.length],
  );

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
    (href: string, toolSlug?: string) => {
      // Record search in history & analytics
      if (query.trim().length >= 2) {
        addQuery(query.trim());
        trackSearch(query.trim(), toolSlug);
      }

      onClose();
      // Use Next.js router for internal navigation (no page reload)
      if (href.startsWith("/#")) {
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
    [onClose, router, query, addQuery, trackSearch],
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
            navigateTo(results[activeIndex].tool.href, results[activeIndex].tool.slug);
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
            <EmptyState
              recentSearches={history}
              popularSearches={popularSearches}
              trendingSearches={trendingSearches}
              trendingTools={trendingTools}
              onSelect={setQuery}
              onRemoveRecent={removeQuery}
              onClearHistory={clearHistory}
              onNavigate={(href, slug) => navigateTo(href, slug)}
            />
          ) : results.length === 0 ? (
            <NoResults
              query={query}
              suggestions={zeroSuggestions}
              onSelect={setQuery}
              onNavigate={(href, slug) => navigateTo(href, slug)}
            />
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
                  query={query}
                  index={idx}
                  isActive={idx === activeIndex}
                  id={`${dialogId}-item-${idx}`}
                  onSelect={() => navigateTo(result.tool.href, result.tool.slug)}
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
  query,
  index,
  isActive,
  id,
  onSelect,
  onHover,
}: {
  result: SearchResult;
  query: string;
  index: number;
  isActive: boolean;
  id: string;
  onSelect: () => void;
  onHover: () => void;
}) {
  const categoryDef = getCategoryDef(result.tool.category);
  const titleSegments = highlightMatch(result.tool.title, query);
  const descSegments = highlightMatch(result.tool.description, query);

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

      {/* Tool info with highlighted text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          isActive ? "text-brand-900 dark:text-brand-100" : "text-slate-900 dark:text-slate-100"
        }`}>
          <HighlightedText segments={titleSegments} />
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          <HighlightedText segments={descSegments} />
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

/** Renders text with highlighted segments. */
function HighlightedText({ segments }: { segments: HighlightSegment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark
            key={i}
            className="bg-brand-100 dark:bg-brand-500/20 text-inherit rounded-sm px-0.5 -mx-0.5"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

function EmptyState({
  recentSearches,
  popularSearches,
  trendingSearches,
  trendingTools,
  onSelect,
  onRemoveRecent,
  onClearHistory,
  onNavigate,
}: {
  recentSearches: string[];
  popularSearches: string[];
  trendingSearches: string[];
  trendingTools: ReturnType<typeof getTrendingTools>;
  onSelect: (query: string) => void;
  onRemoveRecent: (query: string) => void;
  onClearHistory: () => void;
  onNavigate: (href: string, slug: string) => void;
}) {
  return (
    <div className="px-5 py-4 space-y-5">
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div data-testid="recent-searches">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Recent searches
            </p>
            <button
              type="button"
              onClick={onClearHistory}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-0.5">
            {recentSearches.slice(0, 5).map((q) => (
              <div
                key={q}
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <ClockIcon />
                <button
                  type="button"
                  onClick={() => onSelect(q)}
                  className="flex-1 text-left text-sm text-slate-700 dark:text-slate-300 truncate"
                >
                  {q}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveRecent(q)}
                  aria-label={`Remove "${q}" from history`}
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-opacity"
                >
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular / Trending Searches */}
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          {trendingSearches.length >= 3 ? "Trending" : "Popular searches"}
        </p>
        <div className="flex flex-wrap gap-2">
          {(trendingSearches.length >= 3 ? trendingSearches : popularSearches).map((s) => (
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

      {/* Trending Tools */}
      {trendingTools.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Trending tools
          </p>
          <div className="grid grid-cols-2 gap-2">
            {trendingTools.map((tool) => {
              const catDef = getCategoryDef(tool.category);
              return (
                <button
                  key={tool.slug}
                  type="button"
                  onClick={() => onNavigate(tool.href, tool.slug)}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/10 to-accent-500/10 text-brand-600 dark:text-brand-300">
                    <CategoryIcon category={tool.category} size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                      {tool.title}
                    </p>
                    {catDef && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {catDef.label}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NoResults({
  query,
  suggestions,
  onSelect,
  onNavigate,
}: {
  query: string;
  suggestions: ReturnType<typeof getZeroResultsSuggestions>;
  onSelect: (query: string) => void;
  onNavigate: (href: string, slug: string) => void;
}) {
  return (
    <div className="px-5 py-8 text-center space-y-5" data-testid="no-results">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No tools found for &ldquo;<span className="font-medium text-slate-700 dark:text-slate-300">{query}</span>&rdquo;
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Try a different spelling or browse by category
        </p>
      </div>

      {/* Zero-results suggestions */}
      {suggestions.length > 0 && (
        <div className="text-left">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            You might be looking for
          </p>
          <div className="space-y-1">
            {suggestions.map((tool) => (
              <button
                key={tool.slug}
                type="button"
                onClick={() => onNavigate(tool.href, tool.slug)}
                className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand-500/10 to-accent-500/10 text-brand-600 dark:text-brand-300">
                  <CategoryIcon category={tool.category} size={13} />
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                  {tool.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick category suggestions */}
      <div className="flex flex-wrap justify-center gap-2">
        {["calculator", "random", "json", "text", "converter"].map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => onSelect(term)}
            className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Small Icons ────────────────────────────────────────────────────

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-400" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
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
