"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import {
  clearRecent as clearRecentStorage,
  loadRecent,
  type RecentChannel,
} from "@/lib/recentSearches";

interface Props {
  onSelect: (channelId: string) => void;
  /** Bump this value from the parent to force the list to reload. */
  refreshToken?: number;
}

/**
 * A local-only recent-searches list. Reads from localStorage and offers
 * a "Clear" affordance. History never leaves the browser.
 */
export function RecentSearches({ onSelect, refreshToken = 0 }: Props) {
  const [list, setList] = useState<RecentChannel[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setList(loadRecent());
  }, [refreshToken]);

  if (!mounted || list.length === 0) return null;

  function clear() {
    clearRecentStorage();
    setList([]);
  }

  return (
    <section
      aria-labelledby="recent-searches-title"
      className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4 sm:p-5"
    >
      <div className="flex items-center justify-between">
        <h2
          id="recent-searches-title"
          className="text-sm font-semibold text-slate-900"
        >
          Recent searches
        </h2>
        <button
          type="button"
          onClick={clear}
          className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2"
        >
          Clear history
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Stored only in your browser. Never sent to any server.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {list.map((r) => (
          <li key={r.channelId}>
            <button
              type="button"
              onClick={() => onSelect(r.channelId)}
              className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm hover:border-brand-300 hover:bg-brand-50"
            >
              <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-slate-100">
                {r.thumbnail ? (
                  <Image
                    src={r.thumbnail}
                    alt=""
                    fill
                    sizes="24px"
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
              </span>
              <span className="truncate max-w-[10rem] text-slate-800">
                {r.title}
              </span>
              {r.handle && (
                <span className="text-xs text-slate-500 truncate max-w-[6rem]">
                  {r.handle}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
