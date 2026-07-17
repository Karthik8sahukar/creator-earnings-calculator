"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { SearchIcon, XIcon, UsersIcon } from "./icons";
import { track } from "@/lib/analytics";
import { formatCompact } from "@/lib/format";
import type { ChannelSearchResult } from "@/types/youtube";

interface Props {
  onSelect: (channelId: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

interface State {
  status: "idle" | "loading" | "success" | "error" | "empty";
  results: ChannelSearchResult[];
  error?: string;
}

export function ChannelSearch({ onSelect, autoFocus = false, placeholder }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [state, setState] = useState<State>({ status: "idle", results: [] });
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      abortRef.current?.abort();
      setState({ status: "idle", results: [] });
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((s) => ({ ...s, status: "loading" }));
      setOpen(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? `Search failed (${res.status})`);
        }
        const body = (await res.json()) as { results: ChannelSearchResult[] };
        if (body.results.length === 0) {
          setState({ status: "empty", results: [] });
        } else {
          setState({ status: "success", results: body.results });
        }
        // Analytics — never send raw text, only queryLength + resultCount.
        track({
          name: "search.submitted",
          queryLength: trimmed.length,
          resultCount: body.results.length,
        });
        setOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState({
          status: "error",
          results: [],
          error: (err as Error).message,
        });
        setOpen(true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Outside click
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
      setActiveIndex((i) =>
        i <= 0 ? state.results.length - 1 : i - 1,
      );
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
        Search channel
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
          placeholder={
            placeholder ??
            "Search by channel name, @handle, channel URL or channel ID"
          }
          className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 py-4 text-base sm:text-lg text-slate-900 placeholder:text-slate-400 shadow-card focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
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
            <p className="p-4 text-sm text-slate-500">
              No channels found. Try a different name or paste a channel URL.
            </p>
          )}

          {state.status === "error" && (
            <p className="p-4 text-sm text-rose-600">
              {state.error ?? "Something went wrong."}
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
                        ? "Hidden"
                        : `${formatCompact(r.subscriberCount ?? 0)} subs`}
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
