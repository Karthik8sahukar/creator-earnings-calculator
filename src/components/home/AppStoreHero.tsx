"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { Search, Command } from "@/components/ui/Icon";
import { getSearchPlaceholder, getSearchSuggestions, getTotalToolCount } from "@/lib/tools";
import { typography } from "@/lib/design-tokens";

// ─── Types ──────────────────────────────────────────────────────────

interface Props {
  /** Callback to open the ToolSearchModal. */
  onSearchOpen: () => void;
  /** Slot for the existing Creator Search (ChannelWorkspace). */
  creatorSearch?: ReactNode;
}

type Tab = "tools" | "creators";

// ─── Component ──────────────────────────────────────────────────────

/**
 * AppStoreHero — The primary landing section for BeHumler.
 *
 * Communicates immediately that BeHumler is an "App Store for Free Online Tools."
 * Provides two discovery modes via tabs:
 *   - Tools: opens the ToolSearchModal (command palette)
 *   - Creators: shows the existing ChannelWorkspace (YouTube search)
 *
 * Design inspired by Apple App Store / Product Hunt / Linear hero sections.
 */
export function AppStoreHero({ onSearchOpen, creatorSearch }: Props) {
  const [tab, setTab] = useState<Tab>("tools");
  const t = useTranslations();
  const toolCount = getTotalToolCount();
  const suggestions = getSearchSuggestions();

  return (
    <section aria-labelledby="hero-title" className="relative pt-12 sm:pt-20 pb-4">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[650px] rounded-full bg-gradient-to-br from-brand-500/8 via-accent-500/5 to-transparent blur-3xl" />
        <div className="absolute top-24 -right-20 w-[280px] h-[280px] rounded-full bg-accent-500/5 blur-2xl" />
        <div className="absolute top-48 -left-16 w-[200px] h-[200px] rounded-full bg-brand-500/5 blur-2xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
        {/* SEO H1 — screen-reader accessible, not visually displayed */}
        <h1 id="hero-title" className="sr-only">{t("home.title")}</h1>

        {/* Brand mark */}
        <p className="text-sm sm:text-base font-semibold text-brand-600 dark:text-brand-400 tracking-wide uppercase">
          BeHumler
        </p>

        {/* Visual headline */}
        <h2 aria-hidden="true" className={`${typography.heroTitle} text-slate-900 dark:text-slate-50`}>
          <span className="block">The App Store for</span>
          <span className="block gradient-text">Free Online Tools</span>
        </h2>

        {/* Supporting text */}
        <p className={`max-w-2xl mx-auto ${typography.heroSubtitle}`}>
          Discover {toolCount}+ beautifully designed tools for creators, developers, students, and everyone. All free, browser-based, and private.
        </p>

        {/* Search Tabs */}
        <div className="max-w-xl mx-auto pt-4">
          {/* Tab switcher */}
          <div role="tablist" aria-label="Search mode" className="flex items-center justify-center gap-1 mb-4">
            <TabButton active={tab === "tools"} onClick={() => setTab("tools")}>
              Tools
            </TabButton>
            <TabButton active={tab === "creators"} onClick={() => setTab("creators")}>
              Creators
            </TabButton>
          </div>

          {/* Tools tab — search trigger */}
          {tab === "tools" && (
            <div className="animate-fade-in">
              <button
                type="button"
                onClick={onSearchOpen}
                className="w-full flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-5 py-4 text-left shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-600 transition-all duration-200 group"
              >
                <Search size={20} className="text-slate-400 dark:text-slate-500 group-hover:text-brand-500 transition-colors" />
                <span className="flex-1 text-base text-slate-400 dark:text-slate-500">
                  {getSearchPlaceholder()}
                </span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <Command size={12} />
                  <span>K</span>
                </kbd>
              </button>

              {/* Popular searches */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-slate-400 dark:text-slate-500">Popular:</span>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={onSearchOpen}
                    className="inline-flex items-center rounded-full border border-slate-200/80 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-brand-50 hover:border-brand-200 dark:hover:bg-brand-500/10 dark:hover:border-brand-600/50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Creators tab — existing YouTube channel search */}
          {tab === "creators" && (
            <div id="find-channel" className="animate-fade-in scroll-mt-24">
              <div className="search-shell">
                <div className="search-shell-inner">
                  {creatorSearch}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-green-500">&#10003;</span> 100% Free
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-green-500">&#10003;</span> No Login Required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-green-500">&#10003;</span> Browser Based
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-green-500">&#10003;</span> Private &amp; Secure
          </span>
        </div>
      </div>
    </section>
  );
}

// ─── Tab Button ─────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-brand-600 text-white shadow-sm dark:bg-brand-500"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}
