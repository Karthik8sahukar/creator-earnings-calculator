"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { SearchIcon, UsersIcon } from "./icons";
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
  status: "idle" | "loading" | "success" | "error" | "empty" | "unsupported";
  results: ChannelSearchResult[];
  error?: string;
}

/**
 * Channel lookup — explicit submission only.
 *
 * UX contract:
 *   - NO autocomplete, NO suggestions while typing, NO debounce.
 *   - The API is called ONLY when the user clicks "Search Channel"
 *     or presses Enter.
 *   - While loading, the button is disabled and shows "Searching...".
 *   - Duplicate submissions are prevented.
 *   - Unsupported plain text is rejected with a friendly message.
 */
export function ChannelSearch({ onSelect, autoFocus = false, placeholder }: Props) {
  const t = useTranslations("search");
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ status: "idle", results: [] });
  const abortRef = useRef<AbortController | null>(null);
  const pendingRef = useRef(false);

  async function submitSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Prevent duplicate submissions while a request is in-flight
    if (pendingRef.current) return;
    pendingRef.current = true;

    // Abort any stale request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "loading", results: [] });

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal },
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };

        if (body.error === "UNSUPPORTED_INPUT") {
          setState({
            status: "unsupported",
            results: [],
            error: body.message ?? t("unsupported"),
          });
          return;
        }
        throw new Error(body.message ?? `Search failed (${res.status})`);
      }

      const body = (await res.json()) as { results: ChannelSearchResult[] };
      if (body.results.length === 0) {
        setState({ status: "empty", results: [] });
      } else {
        setState({ status: "success", results: body.results });
      }
      track({
        name: "search.submitted",
        queryLength: trimmed.length,
        resultCount: body.results.length,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState({
        status: "error",
        results: [],
        error: (err as Error).message,
      });
    } finally {
      pendingRef.current = false;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void submitSearch();
    }
  }

  function handleSelect(item: ChannelSearchResult) {
    setQuery("");
    setState({ status: "idle", results: [] });
    track({
      name: "channel.selected",
      channelId: item.channelId,
      source: "search",
    });
    onSelect(item.channelId);
  }

  const isLoading = state.status === "loading";

  return (
    <div className="w-full space-y-3">
      {/* Input row */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <SearchIcon
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            width={20}
            height={20}
          />
          <input
            id="channel-search-input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            autoFocus={autoFocus}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? t("placeholder")}
            aria-label={t("srLabel")}
            className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-4 text-base sm:text-lg text-slate-900 placeholder:text-slate-400 shadow-card focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => void submitSearch()}
          disabled={isLoading || !query.trim()}
          aria-busy={isLoading}
          className="shrink-0 rounded-2xl bg-brand-500 px-6 py-4 text-base font-semibold text-white shadow-card hover:bg-brand-600 focus:ring-4 focus:ring-brand-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isLoading ? t("searchButtonLoading") : t("searchButton")}
        </button>
      </div>

      {/* Helper text */}
      <p className="text-sm text-slate-500">{t("helperText")}</p>

      {/* Results area — shown only after submission */}
      {state.status !== "idle" && state.status !== "loading" && (
        <div className="mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
          {state.status === "empty" && (
            <p role="alert" aria-live="polite" className="p-4 text-sm text-slate-500">{t("empty")}</p>
          )}

          {state.status === "unsupported" && (
            <p role="alert" aria-live="polite" className="p-4 text-sm text-amber-600">
              {state.error ?? t("unsupported")}
            </p>
          )}

          {state.status === "error" && (
            <p role="alert" aria-live="polite" className="p-4 text-sm text-rose-600">
              {state.error ?? t("error")}
            </p>
          )}

          {state.status === "success" &&
            state.results.map((r) => (
              <button
                key={r.channelId}
                type="button"
                onClick={() => handleSelect(r)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
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

      {/* Loading indicator below input */}
      {isLoading && (
        <div className="mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
          <SkeletonRows />
        </div>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <ul className="divide-y divide-slate-100" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
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
