"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { SearchIcon, XIcon, UsersIcon } from "./icons";
import { track } from "@/lib/analytics";
import { formatCompact } from "@/lib/format";
import type { ChannelSearchResult } from "@/types/youtube";

interface Props {
  onSelect: (channelId: string) => void;
  autoFocus?: boolean;
  /**
   * Override the translated placeholder. Only supply this when the
   * caller has its own placeholder (e.g. an alternate label). Prefer
   * the default translation for consistency across locales.
   */
  placeholder?: string;
}

interface State {
  status: "idle" | "loading" | "success" | "error" | "empty";
  results: ChannelSearchResult[];
  error?: string;
}

/**
 * Response envelope returned by /api/search.
 *
 * Success:  { success: true, results: ChannelSearchResult[] }
 * Failure:  { success: false, error: { code, message } }
 *
 * The frontend validates BOTH `response.ok` AND `data.success` before
 * trusting the payload — a 200 with `success: false`, or a non-2xx
 * with a JSON body, both surface as errors with a user-friendly message.
 */
type SearchApiResponse =
  | { success: true; results: ChannelSearchResult[] }
  | { success: false; error?: { code?: string; message?: string } }
  // Legacy / defensive: some older paths may not include `success`.
  | { results?: ChannelSearchResult[]; error?: unknown; message?: string };

// ---------- Quota-efficiency tuning constants ----------
//
// These values are deliberate — see the "Quota efficiency" section of
// the README. Tightening any of them will cause more upstream YouTube
// calls; loosening them will make the box feel sluggish.

/** Minimum non-whitespace characters before a search is attempted. */
const MIN_SEARCH_CHARS = 3;
/** Idle time after the last keystroke before a search fires. */
const DEBOUNCE_MS = 700;
/** Client-side result cache TTL. */
const CLIENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
/** Max number of distinct queries cached client-side. */
const CLIENT_CACHE_MAX = 20;

/**
 * Normalize a query the way the server does, so client-side dedup and
 * caching agree with the server's cache key.
 *
 * IMPORTANT: keep this in sync with `normalizeSearchQuery` in
 * `src/lib/youtube.ts`. Duplicating the logic here (instead of
 * importing) is intentional — the component must not pull in any
 * server-only module.
 */
function normalizeQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * True iff the user has typed enough "meaningful" characters (i.e.
 * non-whitespace) to warrant a search. Ignores accidental space
 * bounces from mobile keyboards.
 */
function hasEnoughChars(raw: string): boolean {
  return raw.replace(/\s+/g, "").length >= MIN_SEARCH_CHARS;
}

/**
 * Tiny LRU-ish client-side result cache. Keyed by normalized query.
 * We deliberately do NOT cache empty results — a user who mistyped
 * "MrBiiast" and immediately re-types the correct term should not be
 * shown a stale empty state.
 */
interface CachedResult {
  results: ChannelSearchResult[];
  ts: number;
}
const clientCache = new Map<string, CachedResult>();
function readClientCache(key: string): ChannelSearchResult[] | null {
  const entry = clientCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CLIENT_CACHE_TTL_MS) {
    clientCache.delete(key);
    return null;
  }
  // Refresh LRU order.
  clientCache.delete(key);
  clientCache.set(key, entry);
  return entry.results;
}
function writeClientCache(key: string, results: ChannelSearchResult[]): void {
  if (results.length === 0) return; // don't cache empties
  if (clientCache.has(key)) clientCache.delete(key);
  clientCache.set(key, { results, ts: Date.now() });
  while (clientCache.size > CLIENT_CACHE_MAX) {
    const oldest = clientCache.keys().next().value;
    if (oldest === undefined) break;
    clientCache.delete(oldest);
  }
}
/** Exposed for tests — never used in production code paths. */
export const _clientSearchCacheForTests = {
  clear(): void {
    clientCache.clear();
  },
  size(): number {
    return clientCache.size;
  },
};

/**
 * Map stable server error codes to friendly, user-safe messages.
 *
 * The server already returns actionable copy in `error.message`, but
 * this table is a defense-in-depth override so the user never sees a
 * confusing string even if the server changes.
 */
function friendlyMessageForCode(code: string | undefined): string | null {
  switch (code) {
    case "INVALID_QUERY":
      return "Please enter a search term.";
    case "NOT_FOUND":
      return "No matching YouTube channel was found.";
    case "QUOTA_EXCEEDED":
      return "The YouTube API quota has been exceeded. Please try again later.";
    case "RATE_LIMITED":
      return "Too many searches. Please wait a moment and try again.";
    case "MISSING_API_KEY":
      return "The server is missing its YouTube API configuration.";
    case "INVALID_API_KEY":
      return "The YouTube API key on the server is invalid. Please contact the site operator.";
    case "KEY_RESTRICTED":
      return "The YouTube API key is restricted and rejected this request. Please contact the site operator.";
    case "API_DISABLED":
      return "The YouTube Data API is not enabled on the server. Please contact the site operator.";
    case "UPSTREAM_TIMEOUT":
    case "UPSTREAM_UNAVAILABLE":
    case "NETWORK_ERROR":
    case "MALFORMED_UPSTREAM":
    case "YOUTUBE_API_ERROR":
    case "FORBIDDEN":
      return "YouTube search is temporarily unavailable. Please try again shortly.";
    case "BAD_REQUEST":
      return "The YouTube API rejected this request. Try a different search term.";
    case "INTERNAL_ERROR":
      return "Something went wrong. Please try again shortly.";
    default:
      return null;
  }
}

/**
 * Channel search combobox.
 *
 * ARIA structure is preserved verbatim from the pre-i18n version so
 * every E2E selector (`role="combobox"`, `role="listbox"`,
 * `role="option"`, `aria-selected`, the "No channels found" empty
 * state) still matches. Only visible text is now translated.
 */
export function ChannelSearch({ onSelect, autoFocus = false, placeholder }: Props) {
  const t = useTranslations("search");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [state, setState] = useState<State>({ status: "idle", results: [] });
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  /**
   * Normalized key of the query currently being fetched. Prevents
   * duplicate in-flight requests: if the user types "mr beast", pauses,
   * types " " (still "mr beast" after normalization), pauses again,
   * we don't issue a second /api/search call.
   */
  const inflightKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    // ---- Idle state: query is empty ----
    if (!trimmed) {
      abortRef.current?.abort();
      inflightKeyRef.current = null;
      setState({ status: "idle", results: [] });
      return;
    }

    // ---- Below the "meaningful chars" threshold ----
    // Fewer than MIN_SEARCH_CHARS non-whitespace characters is almost
    // always a user still typing. Don't spend a 100-quota-unit
    // search.list call on "m" or "mr".
    if (!hasEnoughChars(trimmed)) {
      abortRef.current?.abort();
      inflightKeyRef.current = null;
      setState({ status: "idle", results: [] });
      return;
    }

    const normalized = normalizeQuery(trimmed);

    // ---- Client-side cache hit → no request at all ----
    const cached = readClientCache(normalized);
    if (cached) {
      abortRef.current?.abort();
      inflightKeyRef.current = null;
      setState({ status: "success", results: cached });
      setOpen(true);
      setActiveIndex(-1);
      return;
    }

    // ---- In-flight dedup ----
    // If we're already fetching for this exact normalized query, do
    // nothing — the in-flight response will populate state when it
    // arrives.
    if (inflightKeyRef.current === normalized) {
      return;
    }

    // ---- Debounced fetch ----
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      inflightKeyRef.current = normalized;

      setState((s) => ({ ...s, status: "loading" }));
      setOpen(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal, cache: "no-store" },
        );

        // Defensive JSON parsing. If the server returns HTML (e.g. an
        // edge error page) or the body isn't valid JSON, we still
        // surface a user-friendly message instead of a raw crash.
        let body: SearchApiResponse | null = null;
        try {
          body = (await res.json()) as SearchApiResponse;
        } catch {
          body = null;
        }

        // Validate BOTH `response.ok` and `body.success` before trusting.
        const parsedSuccess =
          body !== null &&
          "success" in body &&
          (body as { success?: unknown }).success === true;
        if (!res.ok || !parsedSuccess) {
          const errorObj =
            body && typeof (body as { error?: unknown }).error === "object"
              ? ((body as { error?: { code?: string; message?: string } })
                  .error ?? {})
              : {};
          const code = errorObj.code;
          const serverMessage =
            errorObj.message ??
            (body as { message?: string } | null)?.message;
          const message =
            friendlyMessageForCode(code) ??
            serverMessage ??
            "YouTube search is temporarily unavailable.";
          throw new Error(message);
        }

        // Guard against a stale response (user has typed further and
        // moved on). Compare the normalized key we launched with the
        // current one in the ref — if they don't match, ignore.
        if (inflightKeyRef.current !== normalized) return;

        const results = (body as { results?: ChannelSearchResult[] }).results ?? [];
        writeClientCache(normalized, results);
        if (results.length === 0) {
          setState({ status: "empty", results: [] });
        } else {
          setState({ status: "success", results });
        }
        track({
          name: "search.submitted",
          queryLength: trimmed.length,
          resultCount: results.length,
        });
        setOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        // Same stale-response guard as above.
        if (inflightKeyRef.current !== normalized) return;
        setState({
          status: "error",
          results: [],
          error: (err as Error).message,
        });
        setOpen(true);
      } finally {
        if (inflightKeyRef.current === normalized) {
          inflightKeyRef.current = null;
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || state.results.length === 0) {
      if (e.key === "ArrowDown" && state.results.length > 0) {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % state.results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? state.results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && state.results[activeIndex]) {
        e.preventDefault();
        pick(state.results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function pick(item: ChannelSearchResult) {
    setOpen(false);
    setQuery("");
    setState({ status: "idle", results: [] });
    track({
      name: "channel.selected",
      channelId: item.channelId,
      source: "search",
    });
    onSelect(item.channelId);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="sr-only" htmlFor="channel-search-input">
        {t("srLabel")}
      </label>
      <div className="relative">
        <SearchIcon
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          width={20}
          height={20}
        />
        <input
          id="channel-search-input"
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t("placeholder")}
          className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 py-4 text-base sm:text-lg text-slate-900 placeholder:text-slate-400 shadow-card focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            aria-label={t("clearAria")}
            onClick={() => {
              setQuery("");
              setState({ status: "idle", results: [] });
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <XIcon />
          </button>
        )}
      </div>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop animate-fade-in"
        >
          {state.status === "loading" && <SkeletonRows />}

          {state.status === "empty" && (
            <p className="p-4 text-sm text-slate-500">{t("empty")}</p>
          )}

          {state.status === "error" && (
            <p className="p-4 text-sm text-rose-600">
              {state.error ?? t("error")}
            </p>
          )}

          {state.status === "success" &&
            state.results.map((r, i) => (
              <button
                key={r.channelId}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={activeIndex === i}
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => pick(r)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                  activeIndex === i ? "bg-brand-50" : "hover:bg-slate-50"
                }`}
              >
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-100">
                  {r.thumbnail ? (
                    <Image
                      src={r.thumbnail}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium text-slate-900">
                      {r.title}
                    </span>
                    {r.handle && (
                      <span className="truncate text-xs text-slate-500">
                        {r.handle}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon width={14} height={14} />
                      {r.hiddenSubscriberCount
                        ? t("subsHidden")
                        : `${formatCompact(r.subscriberCount ?? 0)} ${t("subsSuffix")}`}
                    </span>
                    {r.description && (
                      <span className="truncate">{r.description}</span>
                    )}
                  </span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <ul className="divide-y divide-slate-100" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <span className="skeleton h-11 w-11 rounded-full" />
          <span className="flex-1 space-y-2">
            <span className="skeleton block h-3 w-1/3" />
            <span className="skeleton block h-3 w-2/3" />
          </span>
        </li>
      ))}
    </ul>
  );
}
