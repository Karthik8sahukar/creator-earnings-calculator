"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { CreatorCard } from "./CreatorCard";
import { SearchIcon, XIcon } from "@/components/icons";
import type { Creator } from "@/lib/creators";

// ─── Types ──────────────────────────────────────────────────────────

interface Props {
  creators: readonly Creator[];
  countries: readonly string[];
  categories: readonly string[];
  avatars?: Record<string, string | null>;
  /** Current filter/sort/pagination state from URL */
  currentFilters: {
    search: string;
    country: string;
    category: string;
    verified: string;
    sort: string;
    page: number;
    perPage: number;
  };
  totalResults: number;
  totalPages: number;
}

type SortOption = "subscribers" | "name" | "country" | "category" | "newest";

const SORT_OPTIONS: SortOption[] = ["subscribers", "name", "country", "category", "newest"];

/**
 * Enhanced creator directory client component with URL-synced filters,
 * server-side pagination, and sort options.
 *
 * State lives in the URL query string so pages are shareable and
 * SEO-friendly. Uses useRouter to push new params without full reload.
 */
export function CreatorsDirectoryClient({
  creators,
  countries,
  categories,
  avatars,
  currentFilters,
  totalResults,
  totalPages,
}: Props) {
  const t = useTranslations("creators");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchId = useId();
  const [isPending, startTransition] = useTransition();

  // Ref to the search input so updateParams can read its live value
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Ref for debounce timer cleanup
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── URL param sync ────────────────────────────────────────────
  //
  // When any filter fires, we always read the LIVE search input value
  // (not the stale URL param) so the pushed URL reflects what the user
  // sees in the input. This prevents the race condition where a
  // debounced search update fires after a filter change.
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      // Cancel any pending debounced search — we'll include the input
      // value directly in this navigation.
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      const params = new URLSearchParams(searchParams.toString());

      // Always sync the live search input value into params so no stale
      // `q` param can persist from a prior navigation.
      const liveSearchValue = searchInputRef.current?.value ?? "";
      if (liveSearchValue) {
        params.set("q", liveSearchValue);
      } else {
        params.delete("q");
      }

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "all" || value === "1") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      // Reset to page 1 when any filter changes (except page itself)
      if (!("page" in updates)) {
        params.delete("page");
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  const clearAll = () => {
    // Also clear the search input visually
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const handleSearchChange = (value: string) => {
    // Clear any existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    // Debounce search URL sync by 300ms
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      updateParams({ q: value || null });
    }, 300);
  };

  const hasActiveFilters =
    currentFilters.search !== "" ||
    currentFilters.country !== "all" ||
    currentFilters.category !== "all" ||
    currentFilters.verified !== "all" ||
    currentFilters.sort !== "subscribers";

  return (
    <div className="space-y-6">
      {/* Filter card */}
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
            ref={searchInputRef}
            type="search"
            defaultValue={currentFilters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Immediate navigation on Enter — no debounce
                updateParams({ q: (e.target as HTMLInputElement).value || null });
              }
            }}
            placeholder={t("searchPlaceholder")}
            autoComplete="off"
            className="input pl-10 pr-10"
            data-testid="creators-search"
          />
          {currentFilters.search.length > 0 && (
            <button
              type="button"
              aria-label={t("clearSearchAria")}
              onClick={() => {
                if (searchInputRef.current) {
                  searchInputRef.current.value = "";
                }
                updateParams({ q: null });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <XIcon width={16} height={16} />
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect
            label={t("filterCountry")}
            value={currentFilters.country}
            testId="creators-filter-country"
            onChange={(v) => updateParams({ country: v === "all" ? null : v })}
            options={[
              { value: "all", label: t("filterAll") },
              ...countries.map((c) => ({ value: c, label: c })),
            ]}
          />
          <FilterSelect
            label={t("filterCategory")}
            value={currentFilters.category}
            testId="creators-filter-category"
            onChange={(v) => updateParams({ category: v === "all" ? null : v })}
            options={[
              { value: "all", label: t("filterAll") },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
          />
          <FilterSelect
            label={t("filterVerified") ?? "Verified"}
            value={currentFilters.verified}
            testId="creators-filter-verified"
            onChange={(v) => updateParams({ verified: v === "all" ? null : v })}
            options={[
              { value: "all", label: t("filterAll") },
              { value: "true", label: t("filterVerifiedOnly") ?? "Verified only" },
            ]}
          />
          <FilterSelect
            label={t("filterSort") ?? "Sort by"}
            value={currentFilters.sort}
            testId="creators-filter-sort"
            onChange={(v) => updateParams({ sort: v === "subscribers" ? null : v })}
            options={SORT_OPTIONS.map((s) => ({
              value: s,
              label: t(`sortOptions.${s}`) ?? s,
            }))}
          />
          <div className="flex items-end">
            <button
              type="button"
              onClick={clearAll}
              className="btn-secondary w-full"
              data-testid="creators-clear-filters"
              disabled={!hasActiveFilters}
            >
              {t("clearFilters")}
            </button>
          </div>
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <p aria-live="polite" data-testid="creators-result-count">
          {isPending ? (
            <span className="animate-pulse">{t("resultCount", { count: totalResults })}</span>
          ) : (
            t("resultCount", { count: totalResults })
          )}
        </p>
        {totalPages > 1 && (
          <p>
            {t("pageInfo", { page: currentFilters.page, total: totalPages })}
          </p>
        )}
      </div>

      {/* Creator grid */}
      {creators.length === 0 ? (
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
          {creators.map((c) => (
            <li key={c.slug}>
              <CreatorCard creator={c} avatarUrl={avatars?.[c.slug] ?? null} />
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentFilters.page}
          totalPages={totalPages}
          onPageChange={(page) => updateParams({ page: page > 1 ? String(page) : null })}
        />
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

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

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = generatePageNumbers(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="btn-secondary px-3 py-2 text-sm disabled:opacity-40"
        aria-label="Previous page"
      >
        ←
      </button>

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-slate-400">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page as number)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`px-3 py-2 text-sm rounded-lg transition ${
              page === currentPage
                ? "bg-brand-600 text-white font-semibold"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="btn-secondary px-3 py-2 text-sm disabled:opacity-40"
        aria-label="Next page"
      >
        →
      </button>
    </nav>
  );
}

/**
 * Generate a list of page numbers with ellipsis for large page counts.
 * Always shows first, last, and 2 pages around current.
 */
function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(total - 1, current + 1);

  pages.push(1);
  if (rangeStart > 2) pages.push("...");
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
  if (rangeEnd < total - 1) pages.push("...");
  pages.push(total);

  return pages;
}
