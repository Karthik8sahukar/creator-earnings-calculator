"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { CurrencySelector } from "./currency";
import { LanguageSelector } from "./LanguageSelector";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";
import { Search, Command } from "./ui/Icon";
import { getToolsByCategory, getTotalToolCount } from "@/lib/tools";
import { TOOL_CATEGORIES } from "@/lib/tools/categories";
import { CategoryIcon } from "./ui/Icon";
import type { ToolCategoryId } from "@/lib/tools/registry";

// ─── Constants ──────────────────────────────────────────────────────

const NAV_LINK_CLASS =
  "rounded-md px-2.5 py-1.5 text-sm font-medium hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60";

const CREATORS_LINKS = [
  { href: "/creators", label: "Browse Creators" },
  { href: "/top-creators", label: "Top Creators" },
] as const;

const ABOUT_LINKS = [
  { href: "/about", label: "About" },
  { href: "/methodology", label: "Methodology" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
] as const;

// ─── Header ─────────────────────────────────────────────────────────

/**
 * Site header — redesigned for the "App Store for Tools" product vision.
 *
 * Desktop: Logo | Tools▼ Creators▼ Rankings Blog About▼ | 🔍 Currency Language Theme
 * Mobile: Logo | 🔍 Hamburger
 */
export function Header() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg dark:border-slate-800/70 dark:bg-slate-950/80">
      <div className="container-page flex items-center justify-between gap-3 h-14 sm:h-16">
        <Logo size="md" />

        {/* Desktop navigation */}
        <nav
          aria-label={t("nav.primary")}
          className="hidden lg:flex items-center gap-0.5 text-sm text-slate-700 dark:text-slate-200"
        >
          <ToolsMegaMenu />
          <CreatorsDropdown />

          <Link href="/top-creators" className={NAV_LINK_CLASS}>
            Rankings
          </Link>
          <Link href="/blog" className={NAV_LINK_CLASS}>
            Blog
          </Link>

          <AboutDropdown />
        </nav>

        {/* Right side: search + utilities */}
        <div className="flex items-center gap-1">
          {/* Search trigger — dispatches Cmd+K to open the ToolSearchModal */}
          <SearchTrigger />

          <div className="hidden lg:flex items-center gap-1">
            <CurrencySelector />
            <LanguageSelector />
            <ThemeToggle />
          </div>
          <MobileNav className="lg:hidden" />
        </div>
      </div>
    </header>
  );
}

// ─── Search Trigger ─────────────────────────────────────────────────

function SearchTrigger() {
  return (
    <button
      type="button"
      onClick={() => {
        // Dispatch Cmd+K to open the ToolSearchModal
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
        );
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:border-brand-300 dark:hover:border-brand-600 hover:text-slate-700 dark:hover:text-slate-200 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
      aria-label="Search tools"
    >
      <Search size={14} />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium">
        <Command size={10} />K
      </kbd>
    </button>
  );
}

// ─── Tools Mega Menu ────────────────────────────────────────────────

function ToolsMegaMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close(); triggerRef.current?.focus(); }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const toolCount = getTotalToolCount();

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`${NAV_LINK_CLASS} inline-flex items-center gap-1`}
      >
        Tools
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 z-50 animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Browse {toolCount}+ Tools
            </span>
            <Link
              href="/developer-tools"
              onClick={close}
              className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              View all &rarr;
            </Link>
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-0 max-h-[60vh] overflow-y-auto p-2">
            {TOOL_CATEGORIES.map((cat) => {
              const tools = getToolsByCategory(cat.id);
              if (tools.length === 0) return null;
              return (
                <div key={cat.id} className="p-3">
                  {/* Category header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-500/10 to-accent-500/10 text-brand-600 dark:text-brand-300">
                      <CategoryIcon category={cat.id as ToolCategoryId} size={13} />
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{cat.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">({tools.length})</span>
                  </div>
                  {/* Tool links */}
                  <ul className="space-y-0.5">
                    {tools.slice(0, 6).map((tool) => (
                      <li key={tool.slug}>
                        <Link
                          href={tool.href as never}
                          onClick={close}
                          className="block rounded-md px-2 py-1 text-[13px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          {tool.title}
                        </Link>
                      </li>
                    ))}
                    {tools.length > 6 && (
                      <li>
                        <Link
                          href={cat.href as never}
                          onClick={close}
                          className="block rounded-md px-2 py-1 text-[12px] font-medium text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          +{tools.length - 6} more &rarr;
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Creators Dropdown ──────────────────────────────────────────────

function CreatorsDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`${NAV_LINK_CLASS} inline-flex items-center gap-1`}
      >
        Creators
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 z-50 animate-fade-in overflow-hidden py-1.5">
          {CREATORS_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href as never}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── About Dropdown ─────────────────────────────────────────────────

function AboutDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`${NAV_LINK_CLASS} inline-flex items-center gap-1`}
      >
        About
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white shadow-xl border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 z-50 animate-fade-in overflow-hidden py-1.5">
          {ABOUT_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href as never}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
