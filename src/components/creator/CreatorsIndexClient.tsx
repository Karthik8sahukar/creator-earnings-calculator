"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useState } from "react";

import { CreatorCard } from "./CreatorCard";
import { SearchIcon, XIcon } from "@/components/icons";
import type { Creator } from "@/lib/creators";
import { track } from "@/lib/analytics";

interface Props {
  creators: readonly Creator[];
  countries: readonly string[];
  categories: readonly string[];
  /**
   * Map of `slug → avatarUrl | null`, resolved server-side by
   * `getCreatorAvatars()`. The map is guaranteed to have an entry
   * for every creator; a `null` value means "show the initial
   * fallback".
   */
  avatars?: Record<string, string | null>;
}

type AlphabetFilter = "all" | (typeof ALPHA)[number];

/** A–Z + "#" for creators whose name starts with a digit or symbol. */
const ALPHA = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
  "U", "V", "W", "X", "Y", "Z", "#",
] as const;

/**
 * `/[locale]/creators` search + filter UI.
 *
 * Fully client-side: the catalog is small (~20 items in phase 1, up
 * to a few hundred in the long run) so filtering in memory is faster
 * than a round-trip to a search API. All filters are combinable: the
 * query is ANDed against country AND category AND alphabet.
 *
 * Analytics: emits `creators.searched` (debounced) and
 * `creators.filtered` on filter changes.
 */
export function CreatorsIndexClient({
  creators,
  countries,
  categories,
  avatars,
}: Props) {
  const t = useTranslations("creators");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [letter, setLetter] = useState<AlphabetFilter>("all");
  const searchId = useId();

  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return creators.filter((c) => {
      if (country !== "all" && c.country !== country) return false;
      if (category !== "all" && c.category !== category) return false;
      if (letter !== "all") {
        const first = firstAlpha(c.displayName);
        if (letter === "#" ? /[A-Z]/.test(first) : first !== letter) {
          return false;
        }
      }
      if (normalized.length > 0) {
        const hay = [
          c.displayName,
          c.youtubeHandle,
          c.country,
          c.category,
          c.description,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(normalized)) return false;
      }
      return true;
    });
  }, [creators, normalized, country, category, letter]);

  // Debounced analytics event for search. We measure INTENT (query
  // length + result count), never the query text — matches the
  // pattern in `ChannelSearch`.
  useEffect(() => {
    if (normalized.length === 0) return;
    const id = window.setTimeout(() => {
      track({
        name: "creators.searched",
        queryLength: normalized.length,
        resultCount: filtered.length,
      });
    }, 500);
    return () => window.clearTimeout(id);
  }, [normalized, filtered.length]);

  const clearAll = () => {
    setQuery("");
    setCountry("all");
    setCategory("all");
    setLetter("all");
    track({ name: "creators.filtered", filter: "clear" });
  };

  return (
    <div className="space-y-6">
      {/* Search bar. */}
      <div className="card p-4 sm:p-5">
        <label htmlFor={searchId} className="sr-only">
          {t("searchLabel")}
        </label>
        <div className="relative">
          <SearchIcon
            width={18}
            height={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            autoComplete="off"
            className="input pl-10 pr-10"
            data-testid="creators-search"
          />
          {query.length > 0 && (
            <button
              type="button"
              aria-label={t("clearSearchAria")}
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <XIcon width={16} height={16} />
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            label={t("filterCountry")}
            value={country}
            testId="creators-filter-country"
            onChange={(v) => {
              setCountry(v);
              track({ name: "creators.filtered", filter: "country" });
            }}
            options={[
              { value: "all", label: t("filterAll") },
              ...countries.map((c) => ({ value: c, label: c })),
            ]}
          />
          <FilterSelect
            label={t("filterCategory")}
            value={category}
            testId="creators-filter-category"
            onChange={(v) => {
              setCategory(v);
              track({ name: "creators.filtered", filter: "category" });
            }}
            options={[
              { value: "all", label: t("filterAll") },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
          />
          <FilterSelect
            label={t("filterAlphabet")}
            value={letter}
            testId="creators-filter-alphabet"
            onChange={(v) => {
              setLetter(v as AlphabetFilter);
              track({ name: "creators.filtered", filter: "alphabet" });
            }}
            options={[
              { value: "all", label: t("filterAll") },
              ...ALPHA.map((c) => ({ value: c, label: c })),
            ]}
          />
          <div className="flex items-end">
            <button
              type="button"
              onClick={clearAll}
              className="btn-secondary w-full"
              data-testid="creators-clear-filters"
            >
              {t("clearFilters")}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <p aria-live="polite" data-testid="creators-result-count">
          {t("resultCount", { count: filtered.length })}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("emptyResults")}
          </p>
        </div>
      ) : (
        <ul
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="creators-grid"
        >
          {filtered.map((c) => (
            <li key={c.slug}>
              <CreatorCard creator={c} avatarUrl={avatars?.[c.slug] ?? null} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface Option {
  value: string;
  label: string;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  testId,
}: {
  label: string;
  value: string;
  options: readonly Option[];
  onChange: (v: string) => void;
  testId: string;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input mt-1"
        data-testid={testId}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Return the first alpha character of a name in uppercase — used
 * for the alphabet filter. Names starting with a digit or symbol
 * are grouped under "#".
 */
function firstAlpha(name: string): string {
  for (const ch of name) {
    const upper = ch.toUpperCase();
    if (upper >= "A" && upper <= "Z") return upper;
  }
  return "#";
}
